# BinSparkle — posts ledger

> One row per live post. Update whenever something goes live. **Ask the user
> before any post actually goes public** — it's a public action.
>
> Posting mechanism: documented in `automation-template/postiz.md` (Public
> API recipe, run live on the VPS). Do not post from memory — re-check the
> playbook.
>
> **Source of truth for past posts:** the Postiz Postgres DB on the VPS
> (`postiz.srv1178347.hstgr.cloud`). Query it (do not trust this file alone
> — it can drift):
> ```powershell
> "select p.""createdAt"", i.name, json_array_length(p.image::json) as imgs, left(p.content,80), p.""releaseURL"" from ""Post"" p left join ""Integration"" i on p.""integrationId""=i.id where p.state='PUBLISHED' and p.""deletedAt"" is null order by p.""createdAt"" desc;" | ssh -i "$env:USERPROFILE\.ssh\hostinger_vps" root@72.61.208.103 'docker exec -i postiz-postgres psql -U postiz-user -d postiz-db-local'
> ```

## Published posts

Times shown in NZST (UTC+12). Verified against Postiz Postgres 2026-08-03.

| date (NZ) | platform | channel | format | imgs | copy summary | URL | ref slug |
|---|---|---|---|---|---|---|---|
| 2026-08-02 11:37 | Facebook | Local Client Finder | text | 0 | "Test post — please disregard." | facebook.com/1307860934890935/posts/1307860914890937 | — |
| 2026-08-02 22:42 | Facebook | Local Client Finder | carousel | 5 | **Recruit** — "looking for a side hustle? Bin Sparkle needs bin cleaners. 75% of every job is yours… Apply: binsparkle.nz/contractor/apply" | facebook.com/1307860934890935/posts/1308244698185892 | `?ref=lcf` |
| 2026-08-02 23:50 | Facebook | Local Client Finder | carousel | 5 | **How-it-works** — "here's how Bin Sparkle works, end to end: a customer books, you claim the job, you keep 75%… Apply: binsparkle.nz/contractor/apply" | facebook.com/1307860934890935/posts/1308286148181747 | `?ref=lcf` |
| 2026-08-03 00:18 | Facebook | Local Client Finder | carousel | 5 | **Customer** — "if your bin is the one the neighbours dread on bin day, we will sort it. We pressure-wash and deodorise it at your place. Book a clean: binsparkle.nz" | facebook.com/1307860934890935/posts/1308332808177081 | `?ref=lcf` |
| 2026-08-03 00:52 | Facebook | Bin Sparkle (page `1011356651724878`) | carousel | 5 | **Customer** — "if opening your bin makes you gag, we will sort it. We scrub every wall and the base — smell gone, bin clean. Book a clean: binsparkle.nz" | facebook.com/1011356651724878/posts/1011356638391546 | — |

### Notes

- **Carousel images** are hosted on the Postiz VPS under
  `https://postiz.srv1178347.hstgr.cloud/uploads/2026/08/02/*.png`. They are
  NOT in this repo. To pull them down for reuse or inspection, query the
  `image` column for the full JSON array of paths, then download each.
- **Text-size feedback (2026-08-03):** the user says the carousel text could
  be a little bigger for mobile readability. Applies to the slide template
  across all 4 carousels. Open thread.
- **The recruit + how-it-works posts** both point at `binsparkle.nz/contractor/apply?ref=lcf`
  — the `ref=lcf` slug lets the apply form attribute signups to the Local
  Client Finder channel.
- **One error post** (`cmsb04smq0004lj65tju4mqgq`, 2026-08-01 23:27 UTC) was
  deleted; it failed before publishing. Likely the Facebook identity-checkpoint
  (code 368) documented in `automation-template/postiz.md`.

## Scheduled (queued, not yet live)

Posts created in Postiz with `state=QUEUE`. The publishDate is when they go
live. Re-query the DB (command at the top of this file) to confirm they flip
to `PUBLISHED` — don't trust this table alone.

**27 queued posts** across Aug 4–8 NZST, 3 channels each (FB Bin Sparkle,
IG zypri, Threads binsparklenz). Verified against Postiz Postgres
2026-08-04 (~19:30 UTC): all 27 `state=QUEUE`.

| publishDate (NZ) | platform | channel | format | imgs | copy summary | postiz postId | ref slug |
|---|---|---|---|---|---|---|---|
| 2026-08-04 08:30 | Facebook | Bin Sparkle | carousel | 7 | **Tinder profile** — "Your bin's Tinder profile just dropped. Bio: 'i've got depth, character, and a thriving ecosystem' … Book YOUR bin a date: binsparkle.nz" | `cmscya1a7000dlj65d6coarw8` | — |
| 2026-08-04 08:30 | Instagram | zypri | carousel | 7 | **Tinder profile** — "Your bin's Tinder profile just dropped … Book YOUR bin a date: binsparkle.nz" | `cmscya1dr000elj65jy25k08e` | — |
| 2026-08-04 08:30 | Threads | binsparklenz | single | 1 | **Tinder profile** — "Your bin's Tinder profile: 'i've got depth, character, and a thriving ecosystem.' We matched. binsparkle.nz" | `cmscya1gd000flj658s7j9z0j` | — |
| 2026-08-04 13:30 | Facebook | Bin Sparkle | carousel | 7 | **Bin talks (roast)** — "If your bin could talk… Spoiler: it would ROAST you … Book a clean: binsparkle.nz" | `cmscya392000glj65x1q1tnuk` | — |
| 2026-08-04 13:30 | Instagram | zypri | carousel | 7 | **Bin talks (roast)** — "If your bin could talk… 'go ahead pretend i'm not here' / '35 degrees and you left me like THIS?' … binsparkle.nz" | `cmscya3a7000hlj65fohm54vn` | — |
| 2026-08-04 13:30 | Threads | binsparklenz | single | 1 | **Bin talks** — "'even I can't handle what's inside me right now.' — your bin, probably. binsparkle.nz" | `cmscya3bt000ilj65ul1pxk1f` | — |
| 2026-08-04 18:00 | Facebook | Bin Sparkle | single | 1 | **Dating profile** — "Swipe left, swipe left… Your bin's dating profile is something else. But every bin deserves love. binsparkle.nz" | `cmsd08z5v000mlj651y1uv0pt` | — |
| 2026-08-04 18:00 | Instagram | zypri | single | 1 | **Dating profile** — "Swipe left… 'thriving ecosystem' / 'red flag: open at own risk' … binsparkle.nz" | `cmsd08z6p000nlj65mvrcyu2v` | — |
| 2026-08-04 18:00 | Threads | binsparklenz | single | 1 | **Dating profile** — "your bin's dating profile just dropped. binsparkle.nz" | `cmsd08z7i000olj65ejexfkvr` | — |
| 2026-08-05 18:00 | Facebook | Bin Sparkle | single | 1 | **Bin talks (roast)** — "If your bin could talk… Spoiler: it would ROAST you … binsparkle.nz" *(same angle as 08-04 13:30 — see note)* | `cmsd09uu8000plj65ez32nqmm` | — |
| 2026-08-05 18:00 | Instagram | zypri | single | 1 | **Bin talks (roast)** — "If your bin could talk… it would ROAST you … binsparkle.nz" *(same angle as 08-04 13:30 — see note)* | `cmsd09uv3000qlj65amr7tgoa` | — |
| 2026-08-05 18:00 | Threads | binsparklenz | single | 1 | **Bin talks** — "if your bin could talk… it's not happy. binsparkle.nz" | `cmsd09ux2000rlj65cs3fop6d` | — |
| 2026-08-06 18:00 | Facebook | Bin Sparkle | video | 1 | **POV** — "POV: you're the bin 😅 … Be the bin you want to be ✨ binsparkle.nz" | `cmsd2u0e8000slj65ot2ifg9g` | — |
| 2026-08-06 18:00 | Instagram | zypri | video | 1 | **POV** — "POV: you're a bin and you've had a WEEK 😩🚮 … binsparkle.nz" | `cmsd2u0f9000tlj653g23jpd2` | — |
| 2026-08-06 18:00 | Threads | binsparklenz | video | 1 | **POV** — "POV: you're a bin and you've had a week… ✨ binsparkle.nz" | `cmsd2u0fv000ulj65bya197d2` | — |
| 2026-08-07 09:00 | Facebook | Bin Sparkle | carousel | 4 | **Wanted** — "Your bin's on the run, mate… One BinSparkle clean — pressure wash, scrub, deodorise… binsparkle.nz" | `cmsdru5xa000vlj6535tzqtbr` | — |
| 2026-08-07 09:00 | Instagram | zypri | video | 1 | **Wanted** — "WANTED: one lovable rogue… Book the pardon at binsparkle.nz" | `cmsdrutph000xlj65rdpbvyui` | — |
| 2026-08-07 09:00 | Threads | binsparklenz | single | 1 | **Wanted** — "Your wheelie bin's wanted… One clean clears its name. binsparkle.nz" | `cmsdru610000wlj65uxwf5dyd` | — |
| 2026-08-07 18:00 | Facebook | Bin Sparkle | carousel | 7 | **Texts** — "Your bin has thoughts… prawn shells you forgot on the 4th… binsparkle.nz" | `cmsdrvoy6000ylj65nzd5k9rw` | — |
| 2026-08-07 18:00 | Instagram | zypri | carousel | 7 | **Texts** — "Somewhere in your wheelie bin, something has started a whole new life… binsparkle.nz" | `cmsdrvoz8000zljj653q7xdp9g` | — |
| 2026-08-07 18:00 | Threads | binsparklenz | single | 1 | **Texts** — "your bin has your number… sort the poor thing out at binsparkle.nz" | `cmsdrvp050010lj65bm0pdps5` | — |
| 2026-08-08 09:00 | Facebook | Bin Sparkle | carousel | 7 | **Invoice** — "Your bin has done the maths… balance due is one BinSparkle clean… binsparkle.nz" | `cmsdrwiwx0011lj65h4ogkqvo` | — |
| 2026-08-08 09:00 | Instagram | zypri | carousel | 7 | **Invoice** — "Statement received… Every charge: $0.00… Settle up at binsparkle.nz" | `cmsdrwixx0012lj653tbt38y6` | — |
| 2026-08-08 09:00 | Threads | binsparklenz | single | 1 | **Invoice** — "Your bin just sent you an itemised invoice… binsparkle.nz" | `cmsdrwiyw0013lj65089j34k4` | — |
| 2026-08-08 18:00 | Facebook | Bin Sparkle | carousel | 7 | **Reviews** — "Turns out your wheelie bin has opinions… Make peace with your bin at binsparkle.nz" | `cmsdrxbmf0014lj65s5ychwop` | — |
| 2026-08-08 18:00 | Instagram | zypri | carousel | 7 | **Reviews** — "Your bin has been keeping receipts… one clean and it takes it all back… binsparkle.nz" | `cmsdrxbms0015lj65v2ftcs67` | — |
| 2026-08-08 18:00 | Threads | binsparklenz | single | 1 | **Reviews** — "your wheelie bin has left you a review and honestly it's brutal… binsparkle.nz" | `cmsdrxbne0016lj653dnkso75` | — |

### 2026-08-09 — "Comeback" batch (6 posts, first TikTok + LinkedIn via Zernio)

| publishDate (NZ) | platform | channel | format | imgs | copy summary | postiz / zernio id | ref slug |
|---|---|---|---|---|---|---|---|
| 2026-08-09 09:00 | Facebook | Bin Sparkle | carousel | 6 | **Comeback** — "Rock bottom for a wheelie bin?… washed, scrubbed, and deodorised… Every bin deserves a comeback." | `cmsjp4nil0000rp6u0qj5zfi6` | — |
| 2026-08-09 09:02 | Instagram | zypri | video | 1 | **Comeback (video)** — same arc, IG caption + 16 hashtags | `cmsjpaau10001rp6uswggo894` | — |
| 2026-08-09 09:04 | Threads | binsparklenz | single | 1 | **Comeback** — slide 6 ("Every bin deserves a comeback") | `cmsjrkpml0002rp6u6lvhpth1` | — |
| 2026-08-09 09:06 | TikTok | binsparkle | video | 1 | **Comeback (video)** — first TikTok post via Zernio | Zernio `6a7696c6bf1eb72d9dd8f6ad` | — |
| 2026-08-09 09:08 | LinkedIn | Bin Sparkle | single | 1 | **Comeback** — purpose-built professional slide (`linkedin-clean-4×5.png`) + marketplace caption | Zernio `6a7696d2bf1eb72d9dd8fb1e` | — |
| 2026-08-09 18:00 | Facebook | Bin Sparkle | video | 1 | **Comeback (video)** — 2nd FB post of the day (carousel AM, video PM) | `cmsjrlkac0003rp6upedyyuse` | — |

**Notes for this batch:**
- **First use of Zernio** (TikTok + LinkedIn). Key was added to `automation-template/.env` 2026-08-08; both accounts `canPost: true`. TikTok token refreshes ~monthly — if the 09:06 post 401s, reconnect from the Zernio dashboard and re-submit.
- **First 5-platform day** — previously FB/IG/Threads only. LinkedIn gets the purpose-built real-photo slide (not the cartoon) — rated 8/10 LinkedIn-fit vs 3–6/10 for the comeback cartoon slides.
- **FB twice, LinkedIn once:** FB takes 2/day (carousel + video); LinkedIn = 1/day max for a business page (the professional audience tunes out more — ~2–3/week is the long-term sweet spot). IG held at 1 for this concept (same comeback twice on IG is one too many) — revisit per-concept.
- **Re-verify after publish:** re-query Postiz for the 4 `cms…` ids to confirm `QUEUE → PUBLISHED`; poll `GET https://zernio.com/api/v1/posts/<id>` for the two Zernio ids until `status=published`.
- **Operational gotcha:** the 12 MB video SCP'd to the VPS dropped once (`Connection reset / Broken pipe`) on the first IG attempt — retry succeeded. The `scp()` in `post-to-postiz.mjs` has a 60s timeout; large files on a flaky link can hit it. If a video post fails at SCP, just retry — no partial state is created (it fails before the post is made).

### 2026-08-11 → 16 — Character-gag set (24 posts, 6 concepts × 4 platforms)

One unused character-gag video per day, each to Facebook + Instagram + Threads (Postiz) + TikTok (Zernio). **LinkedIn skipped** for this batch — cartoon character gags rate 3–6/10 LinkedIn-fit (the comeback taught us that). Configs in `videos/binsparkle/posting/2026-08-11-to-16-character-set/`.

| NZ day | concept | gag | FB / IG / Threads (Postiz) | TikTok (Zernio) |
|---|---|---|---|---|
| Aug 11 | `therapy` | bin in therapy, "I just hold it all in" | 3 posts (1 each) | `6a79a2ce4cc9e822798a5460` |
| Aug 12 | `resignation` | bin's letter of resignation | 3 posts | `6a79a2d28cefd1376b180713` |
| Aug 13 | `forecast` | 5-day smell forecast (high: FISH) | 3 posts | `6a79a2d66003dabaef159067` |
| Aug 14 | `horoscope` | Binscopes, "time to let go" | 3 posts | `6a79a2d96003dabaef159107` |
| Aug 15 | `playlist` | 2026 Wrapped, "Sounds of the Sea" | 3 posts | `6a79a2dca6427e380c113ebb` |
| Aug 16 | `groupchat` | Neighbourhood Bin Chat, the nappy | 3 posts | `6a79a2dfe8858ac43eeb051d` |

All 18 Postiz posts verified `QUEUE` with the right `publishDate` (UTC `2026-08-10..15 21:00` = NZST Aug 11–16 09:00), 1 per channel per day, **no duplicates**. All 6 Zernio posts `status=scheduled`.

**Notes for this batch:**
- **Captions:** all 24 generated in one pass through the copy expert (Opus 4.8, $0.08). Each uses "washed, scrubbed, and deodorised" (no "pressure-wash"), ends on `binsparkle.nz`, platform-tuned (FB warm, IG energetic + hashtags, Threads short, TikTok punchy + hashtags).
- **Threads gets the video** in this batch (the comeback sent a single image). Threads plays video fine; sending the video avoided building 6 single-image slides.
- **Same SCP flakiness as Aug 9** — `forecast` and `playlist` each needed 2–3 retries (`Connection reset / closed`). All eventually landed. The 60s `scp()` timeout + a flaky VPS link is the recurring cause; a retry always works. Worth a proper fix in `post-to-postiz.mjs` (longer timeout + auto-retry) — filed mentally.
- **Re-verify after publish:** from Aug 11 onward, re-query Postiz `where publishDate >= '2026-08-10 20:00' and state='PUBLISHED'` to confirm each day flipped; poll the 6 Zernio ids until `status=published`. Watch TikTok — `platformPostUrl` is often empty even on success; `status=published` is the signal.
- **Runway after this batch:** the 6 unused character videos are now scheduled. Aug 17+ needs fresh concepts ("another set, totally different" — in progress). The 2–3 unused *product* ads (customer / clean / fullcare) remain available as a different flavour if needed.

### 2026-08-17 → 21 — Set 2: five brand-new concepts (20 posts, video + carousel each)

Five new character concepts built from scratch (new gags, unused character poses), each shipped as **both** a 15s video and a 5-slide carousel. Per concept, one day: FB gets the carousel, IG + TikTok get the video, Threads gets the CTA slide. LinkedIn skipped (cartoon). Configs in `videos/binsparkle/posting/2026-08-17-to-21-set2/`; compositions in `videos/binsparkle/compositions/binsparkle-{resume,cookbook,openmic,bucketlist,confessional}-{video,carousel}.html`.

| NZ day | concept | gag | FB carousel / IG video / Threads (Postiz) | TikTok (Zernio) |
|---|---|---|---|---|
| Aug 17 | `resume` | bin's letter of application | 3 posts (5-slide carousel / video / slide-5) | `6a7a1076b32f515bdc1212e0` |
| Aug 18 | `cookbook` | "From the Bin Kitchen" recipes | 3 posts | `6a7a110f761e98a3a69953a7` |
| Aug 19 | `openmic` | bin doing standup | 3 posts | `6a7a11d7761e98a3a6996852` |
| Aug 20 | `bucketlist` | bin's list before recycling | 3 posts | `6a7a12a5a0bfe4b95bac6271` |
| Aug 21 | `confessional` | "Bless me, doc" | 3 posts | `6a7a136c53f2b33fd52f585a` |

All 15 Postiz posts verified `QUEUE` with the right `publishDate` (UTC `2026-08-16..20 21:00` = NZST Aug 17–21 09:00), 1 per channel per day, no duplicates. All 5 Zernio posts scheduled.

**Notes for this batch:**
- **Built, not reused** — five new compositions (mirrored the lean `wanted`-style template: full-bleed character image + a content card with 3 animated beats + CTA, music + SFX, 15s). Reused the existing character *image* library (the brand's visual), with five previously-unused poses (proud / surprised / annoyed / content / embarrassed) so nothing repeats the comeback or set 1.
- **Captions:** all 20 generated in one pass through the copy expert (Opus 4.8, $0.07). All "washed, scrubbed, and deodorised" (no "pressure-washed"), all end `binsparkle.nz`.
- **Carousels generated programmatically** — `gen-carousel-comps.mjs` emitted all 5 carousel compositions from a concept-data table (5 clip-windowed slides each, full-bleed style matching the comeback carousel). The hook-slide kicker was initially a leftover ("A bin redemption") — caught and fixed to "A Bin Sparkle original".
- **Orchestrator pattern worked well** — one script (`schedule-set2.mjs`) wrote all 20 configs and ran them with auto-retry on the SCP drops. It timed out near the very end (confessional Threads + TikTok) — re-ran those two manually. Worth raising the script's per-call timeout or splitting FB-carousel (5 SCPs) from the rest next time.
- **Re-verify after publish:** from Aug 17, re-query Postiz `where publishDate >= '2026-08-16 20:00' and state='PUBLISHED'` per day; poll the 5 Zernio ids until `status=published`.

**Runway after this batch:** Aug 22+ is empty again. The 2–3 unused *product* ads (customer / clean / fullcare — real footage, service-forward) are the obvious next direction if a format break from the cartoon is wanted.

- **First scheduler test:** the 2026-08-04 08:30 NZST batch (publishDate `2026-08-03 20:30:00` UTC) is the first real publish through the Postiz scheduler. Re-query the DB after that time to confirm those three flipped `QUEUE → PUBLISHED`. If they haven't, the scheduler isn't firing — check the postiz container + cron.
- **"Bin talks" angle posts twice** — the same "if your bin could talk / ROAST you" joke is queued for **2026-08-04 13:30 AND 2026-08-05 18:00**, same channels. Likely over-scheduled; will read repetitive on the feed. Decide: drop the 08-05 re-run, or swap it for a different angle.
- **POV source video:** `renders/binsparkle/binsparkle_2026-08-03_22-07-26-graded-yuv420.mp4` (27s, 8.26 MB). Composition: `videos/binsparkle/compositions/binsparkle-pov-video.html`.
- **Format labels:** 7-img = carousel; 1-img = single image (POV's 1 entry is the video file in the image array). The 1-img Tinder/dating/talk posts are assumed single-image — re-query the `image` JSON to confirm if reusing.
- **Captions differ per channel** per content-creation.md Rule 7 (FB warm/medium, IG energetic/long with hashtags, Threads short/conversational).
- **Hybrid posting model (from 2026-08-04):** each concept is shaped per platform — FB gets the carousel, IG gets the carousel (or the video for video concepts like wanted/POV), Threads gets a single hero slide + short line. Same gag, platform-native format. Pacing ≈ 2 concepts/day. Single-image text posts are also in the mix where a one-frame hero lands better. **Local Client Finder is NOT in use** (dropped 2026-08-04) — three channels only: FB Bin Sparkle, IG zypri, Threads binsparklenz.

## How to add a row

Fill every column. If you don't know a value, write `unknown` and flag it —
don't leave a cell blank, a blank cell looks like "not applicable" rather
than "not known."

- **date (NZ):** the day it went live in New Zealand time.
- **platform:** Facebook / Instagram / Threads / LinkedIn / TikTok.
- **channel:** the page or account name + its numeric id if known.
- **format:** text / single image / carousel / album / video / story / reel.
- **imgs:** image count (0 for text-only).
- **copy summary:** a short paraphrase — full copy lives in Postiz, not here.
- **URL:** the `releaseURL` from Postiz (the public post URL).
- **ref slug:** the `?ref=` parameter on any link in the post, if used.

## Pre-post checklist

1. **Ask the user first** — every post is a public action.
2. Re-read `automation-template/postiz.md` for the current posting recipe.
3. Confirm the channel id against the playbook (don't post from memory).
4. After the post confirms, capture the `releaseURL` **immediately** — add the row before doing anything else.
5. Re-query Postiz (command above) to verify `state=PUBLISHED` and grab the real URL.
