# BinSparkle — project manifest

> **Read this first.** This is the running source-of-truth for everything
> BinSparkle in this repo. A fresh session reads this file and knows what
> exists, where it lives, what's been posted, and what's open. Update it in
> place when things change — don't append dated sections.
>
> **Verify before you trust any line.** Each entry below has a `verified` date
> = the last time a human or agent confirmed it against the real system. If
> the date is old, re-check before relying on it.

**The brand:** BinSparkle — wheelie-bin-cleaning marketplace, Hamilton NZ.
Homeowners book, self-employed contractors clean. Site: https://binsparkle.nz
Tone: warm, plain-spoken, friendly-local, never corporate.

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
(machine-readable: `assets/asset-catalogue.json`). Re-run
`npm run describe:assets -- --dir=videos/binsparkle/assets` to refresh.

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

### Video ad
1. Script first ([`docs/playbooks/script-and-copy.md`](../../docs/playbooks/script-and-copy.md) is the gold-standard example).
2. Images next — generate fresh per scene, feeding the brand anchors from `IMAGE-PROMPTS.md` Part A as image-to-image references.
3. Composition at `compositions/binsparkle-<name>.html` (copy the cleanest existing one as a starting point, don't edit the originals).
4. Voiceover: Edge TTS `en-NZ-MollyNeural` is the locked voice ([`docs/voices.md`](../../docs/voices.md)). Use `npm run fetch:tts:edge` or the OpenAI fetcher (`scripts/fetch-tts-openai.mjs`).
5. Render: `npm run render:comp -- --comp=<name>` → `npm run to-yuv420 -- <mp4>` (every render).
6. Judge: `npm run judge:still` and/or `npm run judge:video` against the rubric.

### Carousel slides
The 7-image `clean-*` set reads as a carousel arc: house-bin → interior →
scrub → fresh → sparkle → brand-reveal → before-after. The 4 published
carousels (see §5) were made as base-image + HTML text overlays. To make a
new one: pick images from the catalogue, write an HTML slide template that
overlays branded text, render each slide with `render:still`. A formal
`render:carousel` wrapper isn't built yet — defer until a repeatable deck
format is wanted.

### Stories (9:16, vertical, 1080×1920)
Same canvas as the video comps. Pick a base image from the catalogue (the
`good_for` column flags which suit `story background`), overlay text via
HTML, render with `render:still`. Multiple stories = multiple stills, one
per story.

`verified: 2026-08-03`

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
| API keys + secrets | `automation-template` | `.env` (RUNWARE_API_KEY etc.) |
| Cron / unattended runner | `autonomous-runner` | separate — wire up only when unattended runs are wanted |
| **Obsolete:** social distributor docs | — | `docs/social-media-pipeline.md` in this repo is OBSOLETE (proposed a `bin-sparkle-social` distributor layer; superseded by the one-repo model). |

`verified: 2026-08-03`
