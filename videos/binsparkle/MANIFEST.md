# BinSparkle — project manifest

> **Read this first.** This is the running source-of-truth for everything
> BinSparkle in this repo. A fresh session reads this file and knows what
> exists, where it lives, what's been posted, and what's open. Update it in
> place when things change — don't append dated sections.
>
> **Verify before you trust any line.** Each entry below has a `verified` date
> = the last time a human or agent confirmed it against the real system. If
> the date is old, re-check before relying on it.

<!-- NEXT-SESSION:START -->
## ▶ Start here — written 2026-08-10, end of session

**This session shipped a lot.** Read in order: this block → §3 (comps) → §5
(`posts.md` ledger) → `POSTING-PLAN.md`. The comeback concept + two scheduling
sets are done; the feed is queued through **Aug 21**.

**Verified live 2026-08-10 ~22:00 NZST** (Postiz Postgres on the VPS + Zernio API):
- **36 Postiz posts** across this session's batches: **9 PUBLISHED, 27 QUEUED,
  0 ERROR.** The scheduler is firing (the Aug 9 comeback batch went out on time).
- **Zernio:** 2 comeback posts (TikTok + LinkedIn) `published`; **9 TikTok posts
  scheduled** Aug 11–21 (one/day per concept). Zernio key is in
  `automation-template/.env`; both accounts `canPost: true`.

**The next 1–3 jobs, in order:**
1. **Watch the queue publish, day by day (Aug 11 → 21).** Re-query Postiz:
   `select state, count(*) from "Post" where "deletedAt" is null and
   "publishDate" between '2026-08-10 20:00' and '2026-08-21 12:00' group by state;`
   — each day should flip `QUEUE → PUBLISHED` with no `ERROR`. Poll Zernio
   `GET /v1/posts/<id>` until `status=published`. **Watch the TikTok token** — it
   refreshes ~monthly; a 401 on a TikTok post means reconnect @binsparkle in the
   Zernio dashboard and re-submit that one.
2. **Aug 22+ runway is empty.** Build the next set. Suggested direction (a format
   break from the cartoon): the **unused real-footage product ads** — customer /
   clean / fullcare videos (renders exist, never posted). Or new character
   concepts. Ask the user which.
3. **One record-only blemish:** the comeback FB-video Postiz row (`cmsjrlkac…`)
   was soft-deleted (deletedAt set) mid-session — I deleted it thinking it was
   still queued, but it had already published. The **live Facebook post is still
   up**; only the Postiz record is hidden. No action needed unless you want the
   record restored for clean tracking.

**Constraints (project-specific):**
- **Never post without the user's explicit yes** — public action.
- **Service copy:** "washed, scrubbed, and deodorised" — NOT "pressure-washed."
- **LinkedIn:** 1/day max; the cartoon character gags rate 3–6/10 LinkedIn-fit,
  so they're skipped on LinkedIn (the comeback's purpose-built real-photo slide
  is the model when LinkedIn is wanted).
- **Posting flakiness:** the video SCP to the VPS drops ~1-in-3 (`Connection
  reset / broken pipe`, 60s timeout in `post-to-postiz.mjs`). Retry always works;
  no partial state. Worth a proper fix (longer timeout + auto-retry).
- **Copy expert for captions:** `docs/playbooks/script-and-copy.md` — don't
  hand-write. After every video/carousel, run the §7 "Final step" sweep.

**Deliberately NOT done this session:** the bookkeeping for the 11 new
compositions (5 set-2 videos + 5 carousels + the LinkedIn slide) isn't yet in
§3 below — add them. The 5 set-2 `final/` deliverables exist on disk.
<!-- NEXT-SESSION:END -->

**The brand:** BinSparkle — wheelie-bin-cleaning marketplace, Hamilton NZ.
Homeowners book, self-employed contractors clean. Site: https://binsparkle.nz
Tone: warm, plain-spoken, friendly-local, never corporate.

**Service copy — say this, not that:** the clean is **"washed and deodorised"**
or **"washed, scrubbed, and deodorised."** Do **not** say "pressure-washed" — the
service isn't necessarily pressure-washing (user correction, 2026-08-08). Note:
the shipped `comeback-video.mp4` still says "Pressure-washed. Scrubbed.
Deodorised." on beat 5 by the user's explicit "leave it" — any future re-cut of
that comp should swap the line to "Washed. Scrubbed. Deodorised."

**The model:** one source → many outputs. The same brand kit + image set +
copy becomes video ads, carousel slides, stories, and hero stills. Drop new
real-job photos into `assets/` and they join the pool with no rebuild.

---

## 1. The look — source of truth

| What | Where | Notes |
|---|---|---|
| Brand colours + fonts (tokens) | [`tokens.css`](tokens.css) | **The single source.** `--leaf #2f7a4d`, `--leaf-deep #1f5b38`, `--cream #faf6ee`, `--sunny #f4b942`, `--coral #c25a35`, `--ink #0d2218`. Do not duplicate colours elsewhere. |
| Logo SVGs (7 variants) | [`assets/brand/`](assets/brand/) | Mirrored from `bin-sparkle` repo's `landing-page/assets/brand/`. Primary: `binsparkle-logo.svg`. Mark only: `binsparkle-mark.svg`. |
| Fonts (woff2, 4 families) | [`assets/fonts/`](assets/fonts/) | Bricolage Grotesque (display), Inter (body), Fraunces (serif), JetBrains Mono. Compositions also pull Bricolage + Inter from Google Fonts, so they render without these files. |
| Expert rules for the judge | [`judge-rubrics/expert-knowledge.md`](judge-rubrics/expert-knowledge.md) | Palette, type, platform safe zones (top 220px / bottom 420–484px / right 140px), text ≥80px. Prepended to every judge call. |

`verified: 2026-08-02`

---

## 2. Image assets

**Vision-described catalogue:** [`assets/asset-catalogue.md`](assets/asset-catalogue.md)
(machine-readable: `assets/asset-catalogue.json`). **Every session reads
this before picking images — for videos, image posts, carousels, stories.**
When new images arrive, refresh it (the process is in §7, "Adding new base
images").

| Set | Files | Count | Origin | Used by |
|---|---|---|---|---|
| **A — customer-ad set** | `assets/01_dirty.png` … `07_end.png` | 7 | Supplied by Wiri (2026-07-29) | `binsparkle-customer.html`, `binsparkle-fullcare.html` |
| **B — clean-ad set** | `assets/clean-01-house-bin.png` … `clean-07-before-after.png` | 7 | AI-generated (2026-08-02) | `binsparkle-clean.html` |

**Per-image prompts** (how the AI set was specified): [`IMAGE-PROMPTS.md`](IMAGE-PROMPTS.md).
Part A = 5 reusable brand anchors (hero bin, cleaner, van, street, sparkle
texture) meant to be fed back as image-to-image references forever. Part B =
the 6 per-scene prompts.

**Open issue:** `06_photos.png` shows two bins that look identical — meant as
before/after proof, doesn't read. `01_dirty` and `05_fresh` are different
bins in different places, so the transformation never matches. The strongest
ad is one bin, same angle, filthy then gleaming.

`verified: 2026-08-02`

---

## 3. Video compositions (5)

All at `compositions/`. All 1080×1920 vertical except onboarding.

| File | What it's for | Voice | State |
|---|---|---|---|
| `binsparkle-customer.html` | Customer Facebook ad — "get your bins cleaned" | `voiceover/customer-vo-nova.mp3` (Wiri's supplied read) | Shipped as `customer-v3.mp4`. Lints clean. |
| `binsparkle-clean.html` | Standard-clean ad — "we scrub your bin" | `voiceover/binsparkle-clean-final.mp3` (OpenAI "aoede") | Newest (2026-08-02). The pick. |
| `binsparkle-fullcare.html` | Full Care premium tier — "we do bin day for you" | `voiceover/binsparkle-fullcare-mixed.mp3` | Script finished; **reuses 5 customer-set images**, no dedicated Full Care set yet. |
| `binsparkle-recruit.html` | Cleaner-recruitment ad | `voiceover/binsparkle-recruit-final.mp3` | SVG-drawn (not photo). |
| `binsparkle-onboarding.html` | Contractor onboarding orientation (landscape 1920×1080) | `voiceover/binsparkle-onboarding.mp3` | The only landscape comp. Built for the welcome-call screen. |
| `binsparkle-comeback-video.html` | **Comeback** — the bin's redemption arc (rock bottom → rescued → triumphant), text-driven, fast-cut. New angle: the only comp that plays the character-emotion set as a *journey* rather than a static gag. | none (text-driven + music + SFX) | **New 2026-08-08.** Fresh Runware music bed (`assets/music/binsparkle-comeback-bed.mp3`, 120bpm Dmaj comeback-anthem — distinct from kindred/binsparkle beds). 6 beats, 27s, custom inline SVG (stink waves, water spray, suds, sparkle burst, confetti). |
| `binsparkle-comeback-carousel.html` | Same arc as a 6-slide vertical carousel (render:still). | none | **New 2026-08-08.** One source → two outputs. Slides render at t=1,3,5,7,9,11. |
| `binsparkle-linkedin-clean.html` | Purpose-built LinkedIn slide (real photo `04_scrub.png` + professional overlay). | none | **New 2026-08-08.** Rated 8/10 LinkedIn-fit. Renders 4:5 + 9:16. |
| **Set 2 (2026-08-10) — five brand-new character concepts, each video + carousel:** | | | |
| `binsparkle-{resume,cookbook,openmic,bucketlist,confessional}-video.html` | 5 × 15s character videos, new gags (CV / recipe / standup / list / confession). | none (music bed + SFX) | **New 2026-08-10.** Lean `wanted`-style template (full-bleed char image + content card with 3 animated beats + CTA). Unused poses: proud / surprised / annoyed / content / embarrassed. |
| `binsparkle-{resume,cookbook,openmic,bucketlist,confessional}-carousel.html` | 5 matching 5-slide carousels (gen via `gen-carousel-comps.mjs`). | none | **New 2026-08-10.** Full-bleed slide style, render:still at t=1,3,5,7,9. |

**Scripts:** [`SCRIPT.md`](SCRIPT.md) (onboarding), [`SCRIPT-customer.md`](SCRIPT-customer.md) (v10 customer — **not** what shipped v3 says),
[`SCRIPT-fullcare.md`](SCRIPT-fullcare.md) (gold-standard example).

`verified: 2026-08-02`

---

## 4. Renders (local-only, gitignored)

Live at `renders/binsparkle/` — not committed to git. Copy to the
Postiz/library machine when needed.

| File | What |
|---|---|
| `binsparkle-customer-v3.mp4` | **Customer ad — shipped.** 1080×1920, 22s. |
| `binsparkle_2026-08-02_20-13-31-graded-yuv420.mp4` | **Clean ad — master, upload-ready.** yuv420 re-encode (the only format every player reads). |
| `binsparkle_2026-08-02_20-13-31-graded.mp4` | Same, pre-yuv420. |
| `binsparkle-customer-v1.mp4`, `-v2.mp4` | Earlier customer iterations. |
| `comeback/final/comeback-video.mp4` | **Comeback video — 2026-08-08.** 1080×1920, 27s, yuv420 (plays everywhere). The deliverable. |
| `comeback/final/slide-1..6-*.png` | **Comeback carousel — 2026-08-08.** 6 vertical slides off the same arc. |
| `comeback/binsparkle_2026-08-07_*-graded-yuv420.mp4` | Pre-yuv420 + earlier iterations (kept for A/B). |
| `comeback/verify/*.jpg` | Frame-verification stills at each beat peak. |
| Other `binsparkle_2026-08-02_*` pairs | The 5 earlier clean-ad iterations from the build session (raw + graded each). |

`verified: 2026-08-02`

---

## 5. What's been posted

**Ledger:** [`posts.md`](posts.md) — one row per live post, updated whenever
something goes live. **The Postiz Postgres DB on the VPS is the source of
truth, not this file** — re-query it to verify (the query is in posts.md).

**4 carousel posts + 1 test post, all published 2026-08-02/03 NZST.** Each
carousel has 5 images. Verified against Postiz 2026-08-03:

| Channel | Format | Count | Copy angle |
|---|---|---|---|
| Local Client Finder (FB) | text | 1 | Test post (the API-e2e check) |
| Local Client Finder (FB) | carousel × 5 imgs | 2 | Recruit ("side hustle, 75% yours") + How-it-works ("here's how it works end to end") — both link to `/contractor/apply?ref=lcf` |
| Local Client Finder (FB) | carousel × 5 imgs | 1 | Customer ("if your bin is the one the neighbours dread") — links to `binsparkle.nz?ref=lcf` |
| Bin Sparkle (FB page `1011356651724878`) | carousel × 5 imgs | 1 | Customer ("if opening your bin makes you gag") — links to `binsparkle.nz` |

**Carousel slide images are published outputs, NOT source material.** They
live on the Postiz VPS under
`https://postiz.srv1178347.hstgr.cloud/uploads/2026/08/02/*.png` with text
baked in. Do not pull them down for reuse — the base images in `assets/` +
HTML text overlay produce a fresh slide any time, and stay editable. The
published slides are the finished goods; the base images are the raw stock.

**Posting mechanism:** documented in `automation-template/postiz.md` (Public
API recipe, run live on the VPS). Known channels: Bin Sparkle (FB),
zypri (IG), binsparklenz (Threads), **Local Client Finder** (FB, integration
`cmsazp0rq0003lj65eao4e1mh`, page id `222932881901146`).

`verified: 2026-08-03`

---

## 6. Vision tooling (how to look at images)

| Command | What it does | Cost |
|---|---|---|
| `npm run describe:assets -- --dir=<folder>` | Vision-describes every image, writes `asset-catalogue.{json,md}`. **Reuse/discovery.** | ~$0.0015/image |
| `npm run judge:still -- --image=<path>` | Scores a still against the brand rubric (`judge-rubrics/still.md`). **QA.** Appends to `judge-ledger.md`. | ~$0.002–0.005/look |
| `npm run judge:video -- --image=<path>` | Scores a contact-sheet of sampled frames (`judge-rubrics/video.md`). | ~$0.005/look |
| `npm run runware:usage` | Today's spend vs the $2/day cap. | free |

The underlying primitive is `judge()` in `scripts/lib/runware-vision.mjs` —
takes any image + a prompt, returns text. Daily-capped at `RUNWARE_DAILY_CAP`
($2 default). Model ids are Runware AIR ids from `docs/runware-models.md`.

**Ledger of past judge runs:** [`judge-ledger.md`](judge-ledger.md).

`verified: 2026-08-02`

---

## 7. How to make new content (the patterns)

### The core principle: base image + HTML text overlay
**Never bake text into an image.** The base images in `assets/` (described
in the catalogue) are the reusable stock. Text — headlines, captions, CTAs —
is overlaid via HTML on top of the image, then the whole frame is rendered
to a PNG/MP4. This is how the video compositions work (see `IMAGE-PROMPTS.md`
rule 1: "Do not bake text into scenes 1–6"), and it's how carousel slides
and stories should work too. A new slide = base image + new HTML text +
`render:still`. The image never gets touched.

### Platform matrix — one concept, native formats per channel (the matching method)
Every concept ships to up to **5 channels** via two tools: **Postiz** (FB / IG / Threads) and **Zernio** (TikTok / LinkedIn). The same gag lands on every platform, but each gets the **format it favours** and a **caption tuned to its tone**. This is how content "matches" the platform — don't post the identical asset + caption everywhere.

| Platform | Tool → channel | Asset for a VIDEO concept | Asset for a CAROUSEL concept | Caption style |
|---|---|---|---|---|
| **Facebook** | Postiz → Bin Sparkle page | the **carousel slides** (FB favours swipeable decks over video) | the carousel | warm, medium (3–5 lines), a few emojis |
| **Instagram** | Postiz → zypri | the **video** (IG favours video; ≤90s) | the carousel | energetic, longer (5–8 lines) + 15–20 hashtags |
| **Threads** | Postiz → binsparklenz | **slide 6** (the payoff) — single image | slide 6 — single image | short, conversational (1–3 lines), minimal hashtags |
| **TikTok** | Zernio → @binsparkle | the **video** (9:16, 3s–10min) | the slides cut as a video | energetic, trending hashtags; wrapper adds `tiktokSettings` |
| **LinkedIn** | Zernio → Bin Sparkle page | **purpose-built professional slide** — real photo (`04_scrub.png`, a contractor washing a bin) + restrained overlay (`compositions/binsparkle-linkedin-clean.html`). Rated 8/10 LinkedIn-fit vs the cartoon comeback slides at 3–6/10. Render at 4:5 for the feed. | professional, minimal emojis, business framing |

**How the captions get matched:** one brief → the copy expert (`docs/playbooks/script-and-copy.md`) generates **all five platform-tuned versions** in one pass, each against the bar in `SCRIPT-fullcare.md`. Don't hand-write one caption and paste it everywhere — Rule 7 in `content-creation.md` is explicit about per-platform tone.

**Scheduling mechanism:** one Postiz call (`npm run post -- --config=postiz.json`) handles FB + IG + Threads together — the config carries a per-channel caption and a `threads_file` index so Threads gets its single image. Then one Zernio call each for TikTok and LinkedIn (`npm run post:zernio -- --config=<tiktok.json>`). Same publish instant across platforms, or staggered ~2 min to avoid Facebook's identity-checkpoint trigger on rapid posts.

**Native constraints to respect:**
- **Threads** — single image only (that's why it gets one slide, not the deck).
- **TikTok** — needs the `tiktokSettings` block (`privacy_level`, `allow_*`, the two consent flags); daily post cap per account; token refreshes ~monthly (watch for a 401 on the first post after refresh).
- **Instagram** — posts as a video **post** via the current integration, not a Reel (Reel audio fields are a known gap). The comeback has audio baked in, so it's fine as a video post.
- **LinkedIn via Zernio** — image or text, not video. Use the strongest single slide.

`verified: 2026-08-08`

### Step zero — ALWAYS check the catalogue first
Before making ANY content that uses a base image — a **video**, an **image
post**, a **carousel**, a **story**, a thumbnail — open
[`assets/asset-catalogue.md`](assets/asset-catalogue.md) and pick from there.
The catalogue tells you what each image actually depicts, its mood, its
dominant colours, whether people are visible, and what it's good for (the
`good_for` column). Don't guess from filenames. Don't re-describe images
you already have. The catalogue IS the source — a new session reads it and
knows every image without a human re-explaining.

### Adding new base images (the process)
When new images arrive — supplied photos, freshly generated, pulled from a
brand repo — do this every time:

1. **Generate** (if AI): `npm run gen:image -- --prompt="..." --out=videos/binsparkle/assets/<name>.png`
   — full playbook at [`docs/playbooks/image-generation.md`](../../docs/playbooks/image-generation.md).
   Or drop supplied photos straight in.
2. Drop them into `videos/binsparkle/assets/` (PNG preferred, descriptive filename).
3. Run `npm run describe:assets -- --dir=videos/binsparkle/assets`
4. The catalogue rewrites with ALL images (old + new) — each one
   vision-described (~$0.0015/image). Re-running on the whole folder is by
   design; it refreshes everything, not just the new files.
5. Commit the updated `asset-catalogue.{json,md}` alongside the new images.
6. Every session and every content prompt can now reason about the new
   images automatically.

This is not optional and not a one-off. If a base image lands in `assets/`
and the catalogue isn't refreshed, the next session won't know it exists.

### Video ad
1. **Check the catalogue** (step zero) — pick base images from `asset-catalogue.md`, don't guess.
2. Script first ([`docs/playbooks/script-and-copy.md`](../../docs/playbooks/script-and-copy.md) is the gold-standard example).
3. Images next — generate fresh per scene if needed, feeding the brand anchors from `IMAGE-PROMPTS.md` Part A as image-to-image references. **Any new image → refresh the catalogue** (see "Adding new base images" above).
4. Composition at `compositions/binsparkle-<name>.html` (copy the cleanest existing one as a starting point, don't edit the originals).
5. Voiceover: Edge TTS `en-NZ-MollyNeural` is the locked voice ([`docs/voices.md`](../../docs/voices.md)). Use `npm run fetch:tts:edge` or the OpenAI fetcher (`scripts/fetch-tts-openai.mjs`).
6. Render: `npm run render:comp -- --comp=<name>` → `npm run to-yuv420 -- <mp4>` (every render).
7. Judge: `npm run judge:still` and/or `npm run judge:video` against the rubric.

**Two video patterns — pick by pace:**
- **VO-driven** (steps above): narration carries the message; ~20–30s; the customer / clean / fullcare / recruit / onboarding ads. Use when the script needs to land out loud.
- **Text-driven, no VO:** fast-cut on-screen text punches over a music bed + SFX; ~15–27s; the character-gag comps (`wanted`, `therapy`, `stages`, `comeback`). Faster feel, and sidesteps the Edge-TTS SSML traps. **Cleanest reference: `binsparkle-comeback-video.html`.** Omit step 5; add `<audio>` music + SFX (unique `data-track-index` per SFX, counting up from 20). Fresh Runware music: `node scripts/fetch-music-runware.mjs <name>.mp3 --prompt="..." --duration=30 --bpm=N --key="X major" --seed=N` (the `steps` param defaults to 15 in the script — ACE-Step needs 1–20 — so you no longer need `--steps` unless you want to override).

**⚠ Always verify the text actually rendered.** After `to-yuv420`, extract a mid-scene frame and run `node scripts/look.mjs <frame.jpg> "list EVERY piece of text visible, read each exactly"`. Do **not** trust `judge:still`/`judge:video` to report missing text — they score safe-zone criteria and will grade an empty frame without plainly saying "the headline is gone." This is how the 2026-08-08 comeback video shipped with no writing (caught by the user, not the judge). Full pitfall + fix: `LEARNINGS.md §4` "Animating text children while the parent sits at opacity:0".

### Carousel slides
1. **Check the catalogue** (step zero) — pick images from `asset-catalogue.md`.
2. Write the slide copy (one line per slide, punchy).
3. Build an HTML slide template that overlays branded text on the base image (never bake text into the image itself).
4. Render each slide with `render:still`.

**Proven deck technique — one composition, clip windows.** Put every slide in a single comp as `<div class="slide clip">` blocks, each with its own `data-start` / `data-duration` / `data-track-index` (e.g. slide *i* at `data-start=(i-1)*2`, `data-duration=2`). Then one call pulls the whole deck:
```bash
npm run render:still -- --comp=videos/binsparkle/compositions/<name>.html --at=1,3,5,7,9,11 --out=renders/binsparkle/<concept>
```
Reference: `binsparkle-comeback-carousel.html` → 6 slides → `renders/binsparkle/comeback/final/slide-1..6-*.png`. This is the "one source → many outputs" model — the same comp can also yield a video, and the slide copy stays editable HTML, never baked into the image. (Same `look`-verification rule applies: confirm the text rendered before shipping.)

The 7-image `clean-*` set reads as a carousel arc: house-bin → interior →
scrub → fresh → sparkle → brand-reveal → before-after. The 4 published
carousels (see §5) were made this way. A formal `render:carousel` wrapper
isn't built yet — defer until a repeatable deck format is wanted.

### Stories (9:16, vertical, 1080×1920)
1. **Check the catalogue** (step zero) — the `good_for` column flags which images suit `story background`.
2. Write the story (one line per slide, 7–10 slides).
3. Overlay text via HTML on each base image.
4. Render with `render:still` — one PNG per slide.

### Final step — run the improvements sweep (every time, non-optional)
A creation is **not done when the render lands** — it's done when the lessons are written back into the docs. Before reporting "done," run the 6-point sweep in [`docs/playbooks/content-creation.md`](../../docs/playbooks/content-creation.md) **Rule 12**:
1. Verify the text/visuals actually rendered — extract a mid-scene frame and `node scripts/look.mjs <frame> "list EVERY piece of text visible"` (the judge tools won't report missing text).
2. Log the work in `LEARNINGS.md §6`.
3. Promote any new pitfall to `LEARNINGS.md §4` (with fix + detection).
4. Update this MANIFEST (compositions table, renders, brand-copy rules, traps).
5. Update §7 above if the method itself moved (new flag, new technique, new pattern).
6. Root-fix tooling instead of documenting a workaround where possible.

This is what stops the same bug shipping twice — the 2026-08-08 comeback video shipped with no on-screen text because nothing enforced step 1.

`verified: 2026-08-08`

---

## 8. Open threads

1. **Three funny stories** (9:16) using the existing base image set —
   requested 2026-08-03. Not started. Pattern: base image + HTML text
   overlay → `render:still` (see §7).
2. **Text on the carousel slides could be bigger for mobile** — the user's
   feedback on the 4 published carousels (2026-08-03). The fix is in the
   HTML text-overlay layer, not the base images.
3. **Carousel engine** — a `render:carousel` wrapper (planned, not built).
    Defer until a repeatable deck format is wanted.
4. **Full Care image set** — the Full Care ad reuses customer images. Give it
   its own set when the script is locked.
5. **Customer-ad voice** — the shipped v3 uses an older supplied recording
   that says "Hamilton" and "60 seconds". `SCRIPT-customer.md` v10 drops the
   town and corrects the booking claim to ~2 minutes. Re-record when the
   voice decision (NZ Molly vs AU Natasha) is settled.

`verified: 2026-08-03`

---

## 9. Traps — these cost real time

1. **`voiceover/binsparkle-recruit-music.mp3` IS NOT MUSIC.** Spoken VO
   despite the name. Mixing it puts two voices on top of each other. Test:
   `ffmpeg -i FILE -t 30 -af "silencedetect=noise=-35dB:d=0.25" -f null - 2>&1 | findstr /c:silence_start | find / c ":"`
   — 0–1 hits = music, 5+ = someone talking.
2. **`assets/music/kindred-bed.mp3` is near-silent for its first 2 seconds.**
   Start at ~2s, not 0.
3. **Edge TTS ignores inline SSML** — reads tags aloud as words. Use the
   beat-by-beat workaround in [`voiceover/README-performed-read.md`](voiceover/README-performed-read.md).
4. **Edge TTS bakes ~0.8s silence onto every clip's end.** Trim before
   adding designed pauses.
5. **Render outputs `yuv444p`** — only VLC plays it. Run `npm run to-yuv420`
   after every render.
6. **`index.html` at the repo root is the render entry point.** Restore with
   `git checkout -- index.html`, not from a mid-session backup.
7. **Run `npx hyperframes lint` after every composition edit.** A missing
   `data-composition-id` still renders — it just stacks every scene.
8. **The linter reads HTML comments.** A quoted attribute inside a comment
   parses as a real declaration.
9. **No `en-NZ` voices on Runware.** Use Edge TTS `en-NZ-MollyNeural` for NZ.

`verified: 2026-08-02`

---

## 10. Where things live elsewhere

| What | Repo | Path |
|---|---|---|
| Live website (do not edit for content) | `bin-sparkle` | `landing-page/` (brand kit lives here; copied into this repo) |
| Postiz playbook + VPS details | `automation-template` | `postiz.md` |
| Zernio playbook (TikTok + LinkedIn path) | `automation-template` | `zernio.md` |
| API keys + secrets | `automation-template` | `.env` — incl. `ZERNIO_API_KEY` (TikTok/LinkedIn via Zernio) and `POSTIZ_API_KEY`. Verified present 2026-08-08. |
| **Posting to TikTok / LinkedIn (Zernio)** | this repo | `npm run post:zernio -- --config=<json>` → `scripts/post-to-zernio.mjs`. AccountIds baked in: TikTok `@binsparkle` `6a75223cd0fe733d1ae1e045`, LinkedIn Bin Sparkle page `6a757a4bd0fe733d1aef10f0`. Health check: `curl -s -H "Authorization: Bearer $ZERNIO_API_KEY" https://zernio.com/api/v1/accounts/health`. |
| Cron / unattended runner | `autonomous-runner` | separate — wire up only when unattended runs are wanted |
| **Obsolete:** social distributor docs | — | `docs/social-media-pipeline.md` in this repo is OBSOLETE (proposed a `bin-sparkle-social` distributor layer; superseded by the one-repo model). |

`verified: 2026-08-03`
