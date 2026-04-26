# LEARNINGS — `aivideomaker`

> **For a brand new session:** Read this top-down before doing anything. It captures
> what's been tried, what works, what doesn't, and the small bits of context that
> save hours. Updated after every meaningful increment. **Every improvement counts.**

---

## How to use this file

1. **At session start** — skim §1 (Project at a glance), §2 (Working setup), §4 (Pitfalls). 30 seconds.
2. **Before writing code** — search this file for keywords from your task (`Ctrl+F "TTS"`, `"FFmpeg"`, `"Pixabay"`).
3. **After completing work** — append a new dated entry to §6 (Increment log) following the template at the bottom. **The discipline of writing it down is the improvement loop.**
4. **When a pitfall bites you** — promote it from §6 into §4 so the next session sees it immediately.

If anything in §1–§5 conflicts with what you're seeing, **trust what you observe now and update this file**. Stale guidance is worse than none.

---

## 1. Project at a glance

`aivideomaker` builds short videos from HTML compositions using **HyperFrames** (HTML → headless Chrome frame capture → ffmpeg). Outputs land in `renders/`.

- **Engine:** HyperFrames CLI — `npx hyperframes preview | render | lint | doctor`
- **Composition:** `index.html` at project root (currently Claim Mate v5 "Ninety Days" promo, 1080×1920, 26.5s). Previous compositions live in `archive/`.
- **Asset library:** `assets/` — `svg-animations/`, `icons/`, `photos/`, `videos/`, `voiceover/`, `music/`, `illustrations/`
- **Fetcher scripts:** `scripts/fetch-*.mjs` — bring assets in from free sources
- **Usage tracker:** `scripts/lib/usage.mjs` + `.usage.json` — keeps each fetcher under documented free-tier limits

---

## 2. Working setup (verified to work)

```bash
# Required versions
node    >= 22
npm     >= 9

# FFmpeg: bundled via @ffmpeg-installer/ffmpeg (npm dep, ~80 MB) since 2026-04-26.
# Every project script that shells out (post-grade, extract-amp, gen-sfx, render
# watermark) routes through scripts/lib/ffmpeg-path.mjs which prefers the
# bundled binary, falls back to system PATH if the package fails to load.
# No PATH munging required for fresh sessions. See §3 "Bundled ffmpeg".

# Historical (still works as a fallback):
# winget install puts ffmpeg.exe NOT on default PATH for new bash shells. It lives at:
C:\Users\wirihere\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-8.1-full_build\bin\ffmpeg.exe
# Override the bundled binary by setting FFMPEG=<path> in env, or prepend on PATH:
export PATH="/c/Users/wirihere/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
```

The HyperFrames CLI itself still looks at `process.env.PATH` only — bundled binary covers project scripts, but `npx hyperframes render` uses whatever ffmpeg PATH resolves to. If the HyperFrames render step ever reports "FFmpeg not found", the PATH-export fallback above still applies.

---

## 3. Patterns that work

### Bundled ffmpeg via `@ffmpeg-installer/ffmpeg`
Project scripts no longer depend on a system ffmpeg install. `@ffmpeg-installer/ffmpeg` (~80 MB, in `dependencies` so renders work post-`npm install`) ships a platform-detected `ffmpeg.exe` at `node_modules/@ffmpeg-installer/<platform>-<arch>/`. On Windows that's `node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe`.

Every script routes through [scripts/lib/ffmpeg-path.mjs](scripts/lib/ffmpeg-path.mjs):

```js
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";
const ffmpeg = await getFfmpegPath();
spawn(ffmpeg, args, { cwd: projectRoot });   // §4 path-colon trick still applies
```

Resolution order: `process.env.FFMPEG` (override) → bundled binary → literal `"ffmpeg"` (system PATH fallback). The bundled lookup catches its own errors so a missing/broken install silently falls through — every script still works on a machine with system ffmpeg only.

**Consumers** (all updated 2026-04-26): [scripts/post-grade.mjs](scripts/post-grade.mjs) (LUT pass), [scripts/extract-amp.mjs](scripts/extract-amp.mjs) (astats per-band amplitude), [scripts/gen-sfx.mjs](scripts/gen-sfx.mjs) (procedural SFX), [scripts/render.mjs](scripts/render.mjs) (watermark stage). Verify the resolved path with `node scripts/lib/ffmpeg-path.mjs` — should print the bundled `ffmpeg.exe` path on a vanilla install.

What this fixes: §4's "FFmpeg not on bash PATH after winget install" is now mitigated structurally — fresh Claude Code sessions never hit it. The §4 entry is marked RESOLVED but kept as historical context for the HyperFrames CLI itself, which still uses `process.env.PATH` and isn't routed through the helper.

### TTS — `edge-tts-universal` is the right choice
- High-quality Azure neural voices, free, no API key.
- Returns audio + word-level boundaries → drop-in **VTT/SRT captions for free**.
- Wrap in our `scripts/fetch-tts-edge.mjs`. Saves to `assets/voiceover/<name>.mp3` plus `.vtt`.
- Word timings are the secret weapon for choreography — fetch the audio first, read the VTT, build scenes around the actual word boundaries.

**Voice picks (verified on this project):**
| Role | Voice | Rate | Why |
|---|---|---|---|
| NZ female, calm | `en-NZ-MollyNeural` | `-10%` | genuine Kiwi accent, measured pace |
| NZ/AU female, warmer | `en-AU-NatashaNeural` | `-10% +2Hz` | warmer than Molly, AU reads as local to NZ |
| AU male, authoritative | `en-AU-WilliamNeural` | `-12%` | mid-low baritone, 157 WPM base; calm authority. Better than Mitchell (too light) and US voices (too foreign for NZ briefs). Fallback: `en-AU-DarrenNeural` (deeper) at same settings. |

**Edge TTS ceiling (don't bash your head on):**
- The free Read Aloud endpoint `edge-tts-universal` uses supports ONE `<voice>` + ONE `<prosody>` — **no `<break>`, no `<emphasis>`, no `<say-as>`, no Azure style tags** (chat, cheerful, newscast, etc). Only CLI levers: `--rate`, `--pitch`, `--volume`.
- Safe ranges: rate `-30%` to `+30%` (beyond -40% gets robotic), pitch `-20Hz` to `+20Hz`.
- Pause control via plain text (verified):
  - comma ≈ 180ms · period ≈ 350ms · em-dash `—` ≈ 250ms (inconsistent — test)
  - **double line break (paragraph) ≈ 500ms — most reliable pause**
  - ellipsis `...` is effectively ignored (confirmed upstream issue, "not planned")

**Copy-for-TTS rules:**
- **Acronyms:** write `A.C.C.` not `ACC` so every voice reads letter-by-letter (plain `ACC` might read as "ack" on some voices).
- **Numbers:** spell out — `two minutes` not `2 minutes`. Zero-risk across voices.
- **Sentences:** 12–18 words sweet spot; 6–8 words for emphasis beats. Read aloud yourself first — if you stumble, the TTS will too.
- **Never:** Māori words (see §4), back-to-back `-tion` words (liaison → decision → compensation = unnatural liaison).

Full research: [docs/rd/edge-tts-male-voices.md](docs/rd/edge-tts-male-voices.md).

### Stock assets — Pixabay scrape (no key) > paid APIs for prototypes
- `scripts/fetch-pixabay-photo.mjs` and `fetch-pixabay-video.mjs` use Playwright to navigate the public site. Selectors that work:
  ```js
  page.locator('a[href^="/photos/"]:visible')
      .and(page.locator('a[href*="-"][href$="/"]'));
  ```
  The `:visible` + slug-with-hyphen filter avoids hidden nav dropdown links (which match `a[href^="/photos/"]` and trap waitFor).
- For Unsplash/Pexels, the official APIs are cleaner once you have a key — see `fetch-unsplash.mjs` and `fetch-pexels.mjs`. Both report quota.

### Combining all asset types in one composition
A polished video uses every asset type at the right moment:
- **Brand SVG** (`assets/svg-animations/brand/*.svg`) as a hero scene — let its built-in SMIL play when shown via `<img>`.
- **Stock photo** with paper-toned filter (`grayscale(0.6) sepia(0.18)`) + HTML overlay headline. Keeps the photo on-brand instead of fighting the palette.
- **Stock video** as a section background with a gradient overlay so foreground text reads. Always credit (`PHOTO · PIXABAY` / `VIDEO · PEXELS`).
- **SVG icons** (Lucide via Iconify) inline in card layouts.
- **HTML/CSS** for typography, layout, motion that doesn't need GSAP.
- **GSAP timeline** for choreography — entrance only, no exits except final scene.

See `index.html` (current Claim Mate composition) for an end-to-end example.

### Icons — Iconify HTTP API is zero-friction
- `scripts/fetch-iconify.mjs` — no key, no install, works for 200+ icon sets (`lucide:`, `mdi:`, `simple-icons:`, etc.).
- Color via query string: `?color=%23ffb84d`.
- Presets baked in: `--preset=ui-essentials`, `--preset=social-brands`, etc.

### Pixabay fetchers — direct URL mode
- Both `scripts/fetch-pixabay-video.mjs` and `scripts/fetch-pixabay-music.mjs` accept a direct Pixabay URL in place of a search term.
- Detection regex (video): `/^https?:\/\/(?:www\.)?pixabay\.com\/videos\/[^\/]+-\d+\/?/i` — matches `pixabay.com/videos/<slug>-<id>/`.
- Music variant: `/^https?:\/\/(?:www\.)?pixabay\.com\/music\//i`.
- When a URL is detected, the script jumps straight to that page, skipping search entirely. Output filename is auto-derived from the URL slug.
- Use this when you've pre-screened an asset on the Pixabay site — deterministic, no result-index guessing.

### Asset content-addressed cache — `scripts/lib/asset-cache.mjs`
A re-run of any fetcher used to mean "spin up Playwright, navigate the site, click play, download" — ~10s minimum even for a result we'd already saved. The cache layer turns the second run into a local file copy.

**Library:** `scripts/lib/asset-cache.mjs` exports:
- `cacheKey(url)` — sha256 hex digest of the URL string.
- `cacheGet(key)` — returns absolute path to `assets/.cache/<key>.<ext>` if any extension matches, else null. Touches mtime on hit so LRU pruning keeps hot entries.
- `cachePut(key, buf, ext)` — writes the buffer (atomic via tempfile + rename) and returns the absolute path. Enforces a 500 MB cap by pruning oldest-by-mtime when exceeded.
- `cacheStats()` — `{ entries, totalBytes }` over loose files only (subdirs like `assets/.cache/luts/` are ignored).
- `cacheClear()` — deletes loose files only.

**Wired into:** `fetch-pixabay-photo.mjs`, `fetch-pixabay-music.mjs`, `fetch-pixabay-sfx.mjs`, `fetch-pixabay-video.mjs`. Each uses the **search URL + index** as the cache key (so re-running the same command is a hit; changing `--index=2` is a miss). On hit, it copies the cached file to the user-requested `outPath` and exits before launching Playwright.

**Pattern in a fetcher:**
```js
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";
const intentKey = cacheKey(`${searchUrl}#index=${opts.index}`);
const hit = await cacheGet(intentKey);
if (hit) { fs.copyFileSync(hit, outPath); process.exit(0); }
// ...network fetch produces `body`...
await cachePut(intentKey, body, ".jpg");
fs.writeFileSync(outPath, body);
```

**CLI:** `npm run cache:stats` (entry count + size + cap %), `npm run cache:clear -- --force` (refuses without `--force`). Direct: `node scripts/lib/asset-cache.mjs stats|clear`.

**Verified 2026-04-25:** photo fetcher cold-run = 11.6s, warm-run (cache hit) = 0.44s end-to-end (3ms inside the cache lib + ~430ms Node startup + import resolution). 96% of latency was Playwright launch + page navigation, all skipped on hit.

**Watch out for:**
- ✅ **(fixed 2026-04-26)** The `import.meta.url === "file://" + argv[1].replace(/\\/g,"/")` CLI-guard pattern was broken on Windows (`file:///C:/...` has three slashes). Now uses `fileURLToPath(import.meta.url) === path.resolve(process.argv[1])`. Use that pattern in any future CLI-guard.
- The cache key is the **user intent** (search URL + index), not the asset URL. This is intentional: we want `node scripts/fetch-pixabay-photo.mjs "blue sky"` to hit cache without a network round-trip to resolve the actual `cdn.pixabay.com/...` URL first. Trade-off: if Pixabay reranks results, the cached image will reflect what was first-place when first cached, not now. Run `npm run cache:clear -- --force` to refresh.

### Brand asset puller — `scripts/pull-assets.mjs`
Single command turns a brand URL into `assets/<slug>/{logo,favicon,hero,product}.{png,svg,jpg,webp}` plus a `manifest.json` the orchestrator can wire into a composition. Fills the gap between `new-comp.mjs` (palette + tokens only) and `fetch-assets.mjs` (search-driven stock media — wrong for brand-specific assets).

**Usage:**
```bash
node scripts/pull-assets.mjs <url> [--name=<slug>] [--max=4] [--force]
npm run pull:assets -- https://kindred-nz.org --name=kindred
```

**Pipeline:**
1. **Fetch HTML** via Node `https` (curl-style, no Playwright). Falls back to Playwright only if the body is empty/SPA-shell.
2. **Extract candidates per kind**, scored:
   - **logo** — `<img>` with `src/alt/class/id` matching `/logo|brand[-_]?mark|wordmark/`, `<meta property="og:logo">`, `srcset` largest entry.
   - **favicon** — `<link rel*="icon">` (apple-touch-icon scores +50, sized icons scale by `sizes` attr), plus well-known fallback paths `/apple-touch-icon.png`, `/favicon.png`, `/favicon.ico`, `/icon.png`.
   - **hero** — `og:image` (score 100), `twitter:image` (90), `<img>` matching `/hero|banner|cover/`, fallback to first 8 `<img>` tags.
   - **product** — `twitter:image:src`, second-ranked hero candidate, `<img>` matching `/product|device|screenshot/`.
3. **Resolve relative → absolute** + decode HTML entities (`&amp;` → `&` matters for Contentful/Sanity URLs that entity-encode query strings; otherwise the raw `&amp;` produces HTTP 400).
4. **Safety filter** — drop `data:`/`javascript:`/off-domain URLs unless host matches a brand-trusted CDN regex (cloudfront, cloudinary, contentful, ctfassets, sanity, shopifycdn, b-cdn, framerusercontent, …) OR the registrable-root brand label appears as a substring in the host (catches Stripe → `stripeassets.com`).
5. **Download** via `https` with content-addressed cache (uses `scripts/lib/asset-cache.mjs` — `cacheKey(absoluteUrl)`). The cache stores even rejected non-image responses so the second run skips the network entirely.
6. **Validate** — magic-byte sniffer for PNG/JPEG/GIF/WebP/ICO/SVG, dimensions parsed from headers (PNG IHDR, JPEG SOF, WebP VP8X/VP8L/VP8, ICO entry, SVG `viewBox`), reject < 50px (16px for favicons — 16/32/48 are legitimate sizes) or > 2 MB. Also rejects `Content-Type: text/html` (SPA hosts return 200 + index.html for unknown paths).
7. **Fallback chain** — if no separate favicon validates, mirror the logo as favicon (the contract requires both at minimum). On candidate fetch fail (HTTP 4xx, validation reject), the script walks up to 5 candidates per kind before giving up.
8. **Write** `assets/<slug>/<kind>.<ext>` + `manifest.json`:
   ```json
   {
     "slug": "kindred-test-assets",
     "url": "https://kindred-nz.org",
     "extractedAt": "2026-04-25T12:11:27.621Z",
     "assets": [
       { "kind": "logo", "path": "assets/kindred-test-assets/logo.png", "src": "https://kindred-nz.org/icon.png", "width": 1024, "height": 1024, "bytes": 84929, "format": "png" },
       { "kind": "favicon", "path": "...", "src": "...", "width": 1024, "height": 1024, "bytes": 84929, "format": "png" },
       { "kind": "hero", "path": "...", "src": "...", "width": 390, "height": 844, "bytes": 36945, "format": "png" }
     ]
   }
   ```

**Constraints baked in:**
- Reuses `scripts/lib/asset-cache.mjs` — no second cache implementation.
- No new npm deps. Built-in `https` + `zlib` (gzip/deflate/br) + `crypto` (via the cache lib).
- Won't pull copyrighted stock photos — `og:image`/`twitter:image` from the source domain itself is OK, but anything off-domain (and not on a brand CDN) is dropped.
- Stops at `--max=4` successful downloads. Order: logo first, then favicon, then hero, then product.

**Verified 2026-04-25:**
- Cold run on `https://kindred-nz.org` → 0.6s wall-clock, 3 assets pulled (logo + favicon mirrored from logo + hero from `app-activity.png`); product skipped (no candidates — Kindred is a single-page brand site with no product imagery beyond the hero).
- Warm run → 0.5–0.7s (every URL cache-hits, even the 4 SPA-catch-all 200 responses on `/apple-touch-icon.png` etc. are cached as rejected).
- Cold run on `https://stripe.com` (complex SPA, Contentful CDN, HTML-entity-encoded URLs) → 4 assets pulled across logo/favicon/hero/product, all from `images.stripeassets.com` (caught by brand-name CDN matcher).

**Known fuzziness:**
- Logo detection on sites with customer-testimonial sections can pick up partner logos (e.g. Stripe's customer-list `enterprise-accordion-hertz.png` outranked the actual Stripe wordmark, because the wordmark is inline SVG with no `<img>` tag). Workaround: pass `--max=2` and take only the favicon, or hand-curate `assets/<slug>/logo.png` after running. Cleanest fix in a future pass: prefer `<header>`/`<nav>` `<img>` candidates over body candidates, and detect inline-SVG wordmarks by class.
- HTML entity decoding is critical — Contentful/Sanity/imgix URLs commonly serve `?w=180&amp;h=180` in HTML, which the URL parser accepts but the server rejects with 400. The script decodes `&amp;|&lt;|&gt;|&quot;|&#39;|&#NN;|&#xHH;` before resolving.
- Fallback paths (`/favicon.ico`, `/apple-touch-icon.png`) on SPA-routed hosts return 200 + HTML for missing files. The Content-Type sniff catches this; if you skip the sniff (e.g. trust HTTP 200 alone), `inspectImage` correctly rejects HTML as "unrecognised format" but you waste the bandwidth.

### Music auto-pick — per-template shortlists + `pick-music.mjs`
Picking music by re-searching Pixabay each time is unreliable (search rerank, taste drift, quota burn). Curated shortlists per template + a thin picker script make the choice deterministic and reviewable.

**Files:**
- `assets/music-shortlists/<template>.json` — one JSON per stack template:
  - `warm-community.json`, `kinetic-pop.json`, `documentary.json`, `quiet-premium.json`
  - Each holds `template`, `vibe` (one-liner), `vibe_long` (paragraph), `bpm_range`, `default_volume`, `search_keywords[]`, and `tracks[]`.
  - Each track carries: `slug`, `title`, `url` (direct page URL preferred, CDN audio URL OK, search URL as fallback), `duration`, `bpm`, `tags[]`, `character`, `best_for`, optional `local_file` (relative path) once auditioned + downloaded.
- `scripts/pick-music.mjs` — reads the shortlist for `--template=<name>`, applies `--seconds=N` length filter (track must be ≥ `N + 5s` buffer), and prints the top N tracks (default 5) ranked.

**Ranking heuristic (deliberately simple):**
1. `local_file` exists on disk → +1000 (already auditioned and downloaded — strongest signal)
2. URL is `cdn.pixabay.com/audio/...` (direct CDN audio) → +500
3. URL is `pixabay.com/music/<slug>-<id>/` (direct page URL) → +250
4. URL is `pixabay.com/music/search/...` (search page) → +50 (last-resort, results rerank daily)
5. Curator order tiebreaker (earlier in JSON wins for ties)

The intent: re-running `--template=warm-community` always returns the same ranked list until the shortlist or filesystem changes. Avoids the "music search drifts" problem.

**No-auto-download by default.** The picker prints the list — it does NOT spend Pixabay quota. Pass `--download` to delegate the top pick to the existing `scripts/fetch-pixabay-music.mjs` (which is already cache-wired). The fetcher accepts direct-page URLs, CDN audio URLs, and search queries — all three URL types in the shortlist work as-is.

**API:**
```bash
node scripts/pick-music.mjs --template=warm-community
node scripts/pick-music.mjs --template=kinetic-pop --seconds=30 --top=3
node scripts/pick-music.mjs --template=documentary --download   # downloads top pick
node scripts/pick-music.mjs --template=quiet-premium --json     # machine-readable
npm run pick:music -- --template=warm-community
```

**Adding a track to a shortlist:** append to the `tracks[]` array in the matching `<template>.json`. Best fit lands first. After downloading + auditioning a candidate, set its `local_file` so the next picker run floats it to position 1.

**First seeded 2026-04-25:** 5 tracks per template (4 fresh from Pixabay search + 1 already-downloaded audition). Verified `node scripts/pick-music.mjs --template=warm-community` returns 5 tracks ranked with `kindred-bed` (downloaded + CDN URL) first; `--seconds=120` correctly drops the 120s `acoustic-guitar-music` candidate; all four templates return ≥ 3 tracks. The richer playbook lives in [docs/playbooks/music-shortlists.md](docs/playbooks/music-shortlists.md) — the JSONs are the executable mirror of that doc.

### VTT word-anchoring for visual reveal timings
- Edge TTS `.vtt` files carry per-word `start` and `end` timestamps.
- Read the VTT, find the word that should cue a visual (e.g. "denied" → DENIED stamp, "ninety" → big 90, "days" → DAYS word), use its exact start time as the GSAP `tl.fromTo` position.
- Eliminates guess-and-check for narration-driven entrances. Works for any composition where audio is produced first.
- Already established for scene cuts (§3 "TTS — edge-tts-universal"); this extends it to sub-scene element reveals within a scene.

### Track layering — `data-track-index` vs `z-index` are separate concerns
- `data-track-index` is exclusively for HyperFrames timeline-conflict detection (lint same-track-overlap). It has no effect on visual depth.
- Visual stacking is controlled entirely by CSS `z-index`.
- When two overlapping clips need to coexist (e.g. DENIED stamp ending at 4.2s and 90 DAYS overlay starting at 3.4s), give them different `data-track-index` values AND set appropriate `z-index` on their containers. Neither attribute substitutes for the other.

### Frame extraction as close-out ritual
- After every render, extract frames at scene midpoints AND critical reveal moments: `ffmpeg -ss <t> -i renders/<file>.mp4 -frames:v 1 renders/verify/t-<t>.jpg`.
- Read the JPGs (multimodal). Catches layout bugs (clipping, typography overflow, wrong asset) that lint and metadata checks miss.
- More reliable than preview playback. Should be the default last step on any render, not an optional one.
- `renders/v5-verify-final/` shows the discipline applied: 11 frames extracted at 0.80, 1.40, 2.40, 3.40, 4.00, 12.50, 16.50, 20.80, 22.50, 24.50 + scene entries.

### HyperFrames composition rules (the ones that bite)
- **Root composition** must have `data-start="0"` and `data-duration="N"` — without these, lint warns and runtime infers Infinity for looping animations.
- **No two `<img>` tags can have the same `src` AND inherit the same `data-start/duration`** — lint warns about "duplicate media discovery". Use distinct icon paths or wrap one in a `<use>` from a `<symbol>`.
- **Overlapping GSAP tweens on the same property** require `overwrite: "auto"`. The lint catches this.
- **Render `<video>` with sparse keyframes** triggers a re-encode warning. Pre-encode bg videos with `ffmpeg -c:v libx264 -r 30 -g 30 -keyint_min 30 -movflags +faststart`.

### Background scrapes — fire and forget while you build
- Long-running Playwright fetches go in `run_in_background: true` and the composition uses `<img onerror="this.style.display='none'">` so missing assets degrade gracefully to gradient backgrounds.

### Brand extraction recipe — from public URL to design tokens in ~60s
For any cold-pitch / external-brand video where the only input is a URL:
```bash
curl -sL <url> > /tmp/raw.html
# Tokens — palette + custom properties
grep -nE '--[a-zA-Z][a-zA-Z0-9-]+:[^;]+;' /tmp/raw.html | head -40
# Fonts — direct + imported
grep -nE 'font-family|@import' /tmp/raw.html | head -10
# Imagery — png/svg/jpg/webp references
grep -oE 'src="[^"]+\.(png|jpg|svg|webp)"' /tmp/raw.html | sort -u
# Verbatim copy — title + meta + headlines (h1/h2/h3)
grep -oE '<(title|h1|h2|h3)[^>]*>[^<]+</\1>' /tmp/raw.html
```
This beats WebFetch when the site is server-rendered HTML — WebFetch summarises text and drops `--var: #hex` lines that read as "boilerplate" to the model. Only fall through to WebFetch if `curl` returns mostly empty body (JS-rendered SPA). Then write the extracted values into `DESIGN.md` (palette table + typography list + verbatim copy + assets) and a brand-overlay token CSS — see "Two-file token system" below.

### Two-file token system — base + brand overlay
Layered CSS architecture so re-skinning to a new brand = swap one file:
- **`design/cards.css`** owns structural tokens (radii, padding scales, type sizes, shadows, surface variants `.card--dark-glass`, `.card--brand-navy`, `.card--feature-row`, `.card--wordmark`, etc.) + content layouts. Generic — never edit per-brand.
- **`design/tokens-<brand>.css`** loaded AFTER cards.css. Overrides brand-specific tokens at `:root` (palette, fonts) and re-tints surface variants (e.g. `.card--dark-glass` becomes the brand's hero surface, `.card--brand-navy` becomes the brand's CTA solid). Imports the brand's web-fonts via Google Fonts `@import`.

Verified on Kindred 2026-04-25 — same `cards.css` rendered first as Claim Mate (navy/JetBrains-Mono) then as Kindred (cream-and-teal/Fraunces+Nunito) by swapping only the tokens file. Composition HTML stayed structurally similar; only copy and IDs changed.

### Generate TTS BEFORE building the composition
The narration's measured duration is the master clock. Generate first → read VTT → size scenes to actual word boundaries. Building the comp first and then "fitting" the narration into it always drifts.

Verified on Kindred 2026-04-25: planned 22.5s comp, narration came back 29.088s, re-mapped scene boundaries to VTT word-times in <2 min. Scene-3 row entrances at 8.05s/10.4s/12.95s aligned with "Give...", "Ask...", "Find..." sentences — zero iteration needed.

### Cinematic post-pass — LUT grade unifies the look
Apply a 3D LUT to the rendered MP4 as the final step. Single ffmpeg `lut3d=path.cube` filter; per-frame look-up; turns "browser-rendered animation" into "graded footage". [scripts/post-grade.mjs](scripts/post-grade.mjs) bakes 6 built-in LUTs procedurally (no external assets):
- `teal-orange` — Hollywood default (cyan shadows, warm highlights)
- `noir` — high-contrast desat with blue-shadow lift
- `warm` / `cool` — temperature shifts for mood
- `pop` — punchy contrast + sat, no hue shift (safe default)
- `vintage` — lifted shadows, cream highlights (film fade)

Usage: `node scripts/post-grade.mjs renders/foo.mp4 --lut=teal-orange [--strength=0..1]`. Output: `renders/foo-graded.mp4` alongside source. Original untouched, so re-runs A/B different grades cheaply. The single highest-impact one-line change to a render.

**Default render command is now [scripts/render.mjs](scripts/render.mjs)** — bundles `hyperframes render` → post-grade in one step so every shipped MP4 ships graded by default. `node scripts/render.mjs` (defaults to `pop`); `--lut=teal-orange` for cinematic; `--no-grade` to skip; `--replace` to delete the raw and keep only the graded MP4. Pass-through args: `node scripts/render.mjs -- --gpu -w 4`.

**Watermark stage (post-grade, opt-in):** add `--watermark` to stamp the project mark onto every render without touching any composition HTML. Defaults: text "aivideomaker", bottom-right, 16-20px inset, white@0.6 + soft black shadow, fontsize=h/30 (~3% of frame). Custom modes: `--watermark=path/to/logo.png` (image overlay scaled to 6% of frame width via `scale2ref`), `--watermark-text=...`, `--watermark-pos=bottom-right|bottom-left|top-right|top-left`, `--watermark-opacity=0..1`, `--watermark-font=path/to/font.ttf`, `--no-watermark` (explicit disable for the day the default flips). Output suffix: `-graded-wm.mp4` alongside `-graded.mp4` (or `-wm.mp4` when combined with `--no-grade`); `--replace` collapses everything onto the raw filename. Verify the spawn args without rendering: `node scripts/render.mjs --watermark --print-args [--input=renders/foo.mp4]`.

Two ffmpeg pitfalls bit this and were worked around inside the script:
- **Windows + drawtext + `font=Arial` segfaults** when the gyan/winget ffmpeg has no fontconfig.cfg. Fix: lazy-copy `C:\Windows\Fonts\arial.ttf` (or `/System/Library/Fonts/Supplemental/Arial.ttf` on macOS) into `assets/.cache/fonts/arial.ttf` on first watermark run, then pass `fontfile=assets/.cache/fonts/arial.ttf` (project-relative, no drive-letter colon — same trick as `lut3d` per §4). On systems with fontconfig the script falls back to `font=Arial`.
- **`drawtext` text= values must escape `:`, `\`, `'`** because `:` is the filter-arg separator. The script's `escapeDrawtextValue()` handles all three.

[scripts/render-queue.mjs](scripts/render-queue.mjs) forwards watermark/grade flags verbatim so `npm run render:queue -- --watermark "compositions/*.html"` stamps every queued render.

### Per-scene LUT — declarative `data-scene-grade` overlay
The post-grade pass ([scripts/post-grade.mjs](scripts/post-grade.mjs)) applies one LUT to the whole render. When a single scene needs a different feel (e.g. a warm testimonial inside an otherwise-cool comp), use the per-scene scaffold instead of running two render passes.

```html
<div class="scene clip" data-start="3" data-duration="3" data-scene-grade="warm">
  …
</div>
```

[design/effects-batch-08.css](design/effects-batch-08.css) maps `[data-scene-grade="<preset>"]` to a `::before` pseudo-element overlay (mix-blend-mode tint) for `teal-orange | warm | cool | noir`, plus a filter pass on the scene root for `pop | soft`. No extra DOM, no class collisions — coexists with the standalone `.fx-grade-*` classes if a scene needs both. Mirrors the post-grade preset names so per-scene overrides read the same as the global pass.

When to use which:
- **teal-orange** — Hollywood default, cyan shadows + warm highlights. Hero / interview / cinematic moments.
- **warm** — sunset radial, lifts skin tones. Testimonial scenes, organic / human moments.
- **cool** — twilight radial, drops temperature. Tech / data / clinical reveals.
- **noir** — vignette + multiply blend, high contrast. Tension beats, "before" half of a before/after, dramatic stat drops.
- **pop** — contrast/saturation lift, no hue shift. Safe punch-up when the comp already feels right.
- **soft** — slight desat + brightness lift. Quiet narration, premium / spacious vibes.

Verified 2026-04-25 on [compositions/effect-fx-demo.html](compositions/effect-fx-demo.html): scene-b (warm) and scene-c (noir) showed 44% / 73% pixel-diff vs ungraded baseline at scene midpoints, while scene-a and scene-d (no `data-scene-grade`) diffed 0.00% — confirming the grade is fully scoped to the declaring element and doesn't leak.

### Procedural sound-design library — ffmpeg lavfi, no Tone.js needed
Sound design accounts for ~50% of perceived production value. Amateur work tends to ship silent transitions or cheap stock SFX. [scripts/gen-sfx.mjs](scripts/gen-sfx.mjs) synthesizes 12 presets (whoosh-up/down/soft, tick, tick-soft, impact, impact-deep, ding, sweep-rise/fall, pad-warm/cool) entirely via ffmpeg `lavfi` audio sources (`sine`, `anoisesrc`) plus standard filters (`bandpass`, `tremolo`, `aecho`, `afade`). No npm deps, deterministic, full library generates in <2s into `assets/sfx/`.

Standard usage rule of thumb per scene: 1 whoosh on transition, 1 tick on each stat reveal, 1 impact on logo/wordmark land, optional pad-warm bed under quiet narration. Mix into the audio track via ffmpeg `amix` at the right offsets, OR drop as `<audio>` elements with `data-start` / `data-volume` (HyperFrames supports multiple audio tracks).

### Audio-reactive visuals — bake offline, drive CSS vars at render time
Web Audio's `AnalyserNode` runs in real time, which is non-deterministic at frame-capture time. Solution: pre-compute a per-frame amplitude envelope offline, write JSON keyed by frame index, set CSS custom properties (`--amp-bass`, `--amp-mid`, `--amp-high`) on `tl.set` keyframes during composition build.

[scripts/extract-amp.mjs](scripts/extract-amp.mjs) uses ffmpeg `astats` per band (bass 20-250Hz / mid 250-4000Hz / high 4-16kHz), normalises each band to its own 0..1 range (visualisations want relative dynamics), and resamples to exact `fps × duration` slots via linear interpolation (astats's per-buffer emission rate doesn't match `reset` parameter in practice). Output schema: `{fps, frames, bands:["bass","mid","high"], data:[[b,m,h], ...]}`.

[design/effects-batch-08.css](design/effects-batch-08.css) ships ready-made bindings: `.fx-amp-scale` (scale with bass), `.fx-amp-glow` (glow with mid), `.fx-amp-wobble` (rotate with high). Three log bands is enough for almost any audio-reactive use; full FFT is overkill for promo video.

Wire it from a composition with the [scripts/lib/amp-bind.js](scripts/lib/amp-bind.js) helper — `<script src="scripts/lib/amp-bind.js">` exposes `window.ampBind(timeline, ampJson, target, opts)`. It walks the JSON and emits `tl.set(target, {"--amp-bass":..., ...}, t)` per frame. Optional `stride` (skip frames), `smooth` (EMA), `gate` (floor noise to 0), `offset` (delay onto timeline), `scale` (multiply). Keyframes are deterministic — values fire at exact frame times, no AnalyserNode jitter.

```js
const amp = await fetch("assets/amp/bed.json").then(r => r.json());
ampBind(tl, amp, ".scene", { smooth: 0.6, gate: 0.05 });
```

### Cinematic primitives via SVG filters + CSS perspective
[design/effects-batch-08.css](design/effects-batch-08.css) ships five primitives the prior batches lacked:
- **Multiplane camera** (`.fx-multiplane` + `.plane-{bg,far,mid,base,near,fg}`) — CSS `perspective` + `preserve-3d` with depth-compensated scale per plane. Animate stage `translateZ` to dolly. `data-focus="far|near"` flips depth-of-field. Converts static title cards into dimensional shots.
- **SVG displacement filters** (`#fx-liquid`, `#fx-ink`, `#fx-ripple`, `#fx-glass`) — `feTurbulence` + `feDisplacementMap` for ink-bleed reveals (animate `scale` 0→60 with GSAP `attr:`), liquid-glass refraction (pair with `backdrop-filter:blur`), water ripple, heat-haze.
- **Chromatic-aberration glitch** (`#fx-rgb-shift` + `.fx-scanlines` + `.fx-vhs-jitter`) — RGB-channel separation for ≤200ms impact moments. Continuous glitch reads amateur; sub-second bursts at scene transitions read broadcast.
- **LUT-style overlays** (`.fx-grade-{teal-orange,warm,cool,noir}` + `.fx-grade-{pop,soft}` filter passes) — in-composition equivalent of the post-pass LUT, useful per-scene.
- **Cinemagraph background** (`.fx-cinemagraph-bg`) — slow-rotating conic-gradient blob behind frosted-glass `backdrop-filter`. Apple-hero-style perpetual motion that reads as "alive footage" without competing for attention.

SVG filter `<defs>` go in an inline `<svg width="0" height="0">` at the bottom of `<body>` (filters need a real document root) — full HOW-TO at the bottom of [effects-batch-08.css](design/effects-batch-08.css).

### Scene scaffold — multiplane stage + SFX track slot per scene
[design/cards.css](design/cards.css) defines a five-slot scene scaffold so multiplane + SFX wiring is a copy-paste template, not a per-scene re-invention:

```html
<section class="scene scene--multiplane clip" data-start=… data-duration=…>
  <div class="scene__bg"></div>     <!-- cinemagraph / gradient backdrop -->
  <div class="scene__stage">         <!-- transform-style:preserve-3d host -->
    <div class="plane-bg">…</div>
    <div class="plane-mid">…</div>
    <div class="plane-near">…</div>
  </div>
  <div class="scene__overlay"></div> <!-- LUT, grain, vignette -->
  <div class="scene__sfx">           <!-- audio elements only, no layout -->
    <audio id="sfx-1" src="assets/sfx/whoosh-up.wav" data-start="0.0" data-track-index="20" data-volume="0.4"></audio>
    <audio id="sfx-2" src="assets/sfx/tick.wav"      data-start="0.6" data-track-index="21" data-volume="0.3"></audio>
  </div>
</section>
```

**Track-index convention (corrected):** every `<audio>` needs a unique `id` AND a unique `data-track-index`. The renderer treats one track as one channel — overlapping clips on the same track error out, and SFX inherently overlap at scene boundaries (one scene's outro whoosh and the next scene's intro whoosh). Reserved tracks in this project: 0–7 scene clip tracks · 8 music bed · 9 narration · 10 persistent header · 13 film grain · **20+ SFX, one per audio element, sequential**. Standard SFX-per-card recipes (1 whoosh on transition / 1 tick per stat / 1 impact on logo land / pad-warm under quiet narration) live in the cards.css scaffolding section as commented templates. `.scene--multiplane` adds `perspective: 1500px` + `transform-style: preserve-3d` on the stage so `.plane-*` z-translation produces real depth.

### Hot-reload preview via Server-Sent Events
[scripts/preview.mjs](scripts/preview.mjs) is a 200-line static server on `:3003` that doubles as a hot-reload bus. Two pieces:

**Server side** — `fs.watch` on `index.html`, `compositions/`, `design/`, `scripts/lib/`. Each change broadcasts a `change` event to all connected clients via SSE at `/__hf-changes`. 150ms debounce coalesces editor save bursts.

**Client side** — `design/preview.html` opens an `EventSource("/__hf-changes")`. On `change`, it cache-busts the iframe src (`?t=${Date.now()}`). The existing iframe `load` handler re-attaches to the new timeline, so play/pause/scrub state cleanly resets.

```bash
npm run preview:simple   # spawns server, opens browser, hot-reloads on save
```

Removes the manual "alt-tab to browser, ctrl-shift-R" cycle. Edit a CSS or HTML file → see the change in <300ms. Coexists with `npx hyperframes preview` (which uses :3002).

### Deterministic Playwright captures — block resources + pause CSS animations
Two interventions in [scripts/smoke.mjs](scripts/smoke.mjs) make playwright-driven screenshots stable across runs:

1. **Resource blocking (non-screenshot mode)** — `context.route("**/*", ...)` short-circuits image/font/media requests with `route.fulfill({ status: 204 })` (NOT `route.abort()` — abort triggers console errors). Drops nav from ~600ms to ~300ms when only the runtime checks matter.

2. **Pause CSS animations + transitions before screenshot** — `page.addStyleTag({ content: "*, *::before, *::after { animation-play-state: paused !important; transition-duration: 0s !important; }" })` injected once, before any per-scene seek. Pseudo-elements covered. Without this, glitter sparkle / cinemagraph rotation / any CSS-keyframe loop drifts 2-5% per run because the animation runs on wall-clock time and the screenshot moment varies. With it, sparkle scenes diff at ~1.5% (positions vary but per-particle scale/opacity is locked); flat scenes diff at 0.00%.

Combined with a 5% diff threshold default (real regressions are 10-30%+), `npm run smoke:diff` is reliable in CI without per-scene tuning.

### Module bundle — concatenate all design modules into one CSS + one JS file
[scripts/build-bundle.mjs](scripts/build-bundle.mjs) reads `design/modules/text-fx.{js,css}`, `effect-fx.{js,css}`, `glitter-fx.{js,css}`, and `scripts/lib/amp-bind.js`, concatenates each into [design/modules/all.js](design/modules/all.js) + `all.css`. Run after editing any source module:

```
npm run build:bundle
```

In compositions, two tags replace 4-6:
```html
<link rel="stylesheet" href="design/modules/all.css">
<script src="design/modules/all.js"></script>
```

The IIFE structure of each source preserves through concatenation — globals (`textFx`, `effectFx`, `glitterFx`, `ampBind`) stay exposed exactly as before. Verified 2026-04-25: every composition migrated; `npm run check` reports all 4 modules loaded; bundle is 30.5 KB JS + 7.4 KB CSS.

### Brand extraction in one command — `npm run new:comp -- <url>`
[scripts/new-comp.mjs](scripts/new-comp.mjs) is the URL→working-composition shortcut:

```bash
npm run new:comp -- https://kindred-nz.org
npm run new:comp -- https://acme.com --template=kinetic-pop --name=acme
npm run new:comp -- https://example.com --orient=portrait
npm run new:comp -- https://example.com --mode=headless          # Playwright sampling
```

The script:
1. `curl`s the URL, extracts palette (CSS custom properties + frequency-ranked hex), font imports, `<title>`, `<h1>`/`<h2>` candidates for copy, and a logo `src` if obvious.
2. Writes `design/tokens-<slug>.css` with the extracted palette mapped to `--card-*` tokens.
3. Generates `compositions/<slug>.html` — 14s, 3 scenes, wired with the chosen base template + module bundle + standalone autoplay guard. Default scenes: hero cascade → brand block with ambient sparkle + ink-bleed → three-up stagger.
4. Reports next steps (review tokens, edit copy, render).

**Two extraction modes** (the curl pass always runs; `headless` adds a Playwright pass on top):
- `--mode=curl` (default, ~200ms) — static fetch, regex over CSS custom properties + hex literals + `<h1>`/`<h2>`. Fast, zero browser. Misses CSS-in-JS (styled-components/emotion), Tailwind utility classes, post-load fonts, and dark-mode toggled themes.
- `--mode=headless` (~3-6s) — launches headless Chromium, navigates with `waitUntil: "networkidle"`, then `page.evaluate(() => …)` samples `getComputedStyle` on `body`, every `h1`/`h2`/`a`/`nav a`/`header a`/`button`/`.btn`/`[class*="btn"]`, and the first 60 elements with non-transparent backgrounds. Converts `rgb()`/`rgba()` → hex (`#RRGGBB` uppercase, drops alpha < 0.05). Frequency-ranks per role (bg / fg / accent / cta). Pulls logo from `img[src*="logo" i]` with favicon fallback.

**Merge order when picking each `--card-*` token (highest signal wins):**
1. Source CSS custom-property whose name matches the role (`brand`/`primary`/`accent`/`main` → `--card-accent`; `bg`/`background`/`paper`/`canvas` → `--card-paper`; etc.). The brand told you the answer in their own var names — trust that first.
2. Headless rendered sample for that role, frequency-ranked.
3. Curl frequency-ranked hex from anywhere in the page.
4. Hardcoded sensible default.

That ordering means headless mode is **strictly additive**: when source CSS-vars are well-named, headless and curl agree; when source vars are missing or named generically (`--font-display`, `--surface-1`), headless picks up the rendered color that curl couldn't see. Verified 2026-04-25 against [https://kindred-nz.org](https://kindred-nz.org): curl produced `--card-paper: #FBF9F6` (default fallback — no `--bg-*` var on the page), headless picked up `--card-paper: #F4C96B` (the actual rendered hero gold) and surfaced `Nunito` + `Fraunces` as concrete font names plus `https://kindred-nz.org/icon.png` as the logo, all of which curl missed entirely.

Best-effort extraction — palette and copy are starting points, not finals. Hand-tune `tokens-<slug>.css` and the placeholder copy before rendering. But the boilerplate is gone.

### Copy generation — `npm run new:copy -- <url>` produces a structured `<slug>.copy.json`
[scripts/extract-copy.mjs](scripts/extract-copy.mjs) is the URL→video-copy shortcut. Where `new:comp` extracts the **brand layer** (palette, fonts, logo), `new:copy` extracts the **script layer** (TTS-ready narration + per-scene on-screen text):

```bash
npm run new:copy -- https://kindred-nz.org
npm run new:copy -- https://acme.com --template=kinetic-pop --seconds=15 --name=acme
npm run new:copy -- https://example.com --template=documentary --seconds=60
```

Templates set tone + lexical bias; seconds set narration target band + beat count (mapped to the structural template scene count):
| Seconds | Target words | Beats | Matches structural template |
|---|---|---|---|
| 15 | 25–40 | 4 | `social-reel-15s.html` |
| 30 | 60–90 | 4 | `hero-promo-30s.html` |
| 60 | 120–160 | 5 | `case-study-60s.html` |

**Pipeline** (deterministic, offline — no LLM call):
1. `scrapeWorker` — curl the URL, extract `<title>`, `<meta name="description">`, h1/h2/h3 (in document order), first ~14 paragraphs, list items, primary on-domain CTA `<a>`.
2. `summarizeWorker` — rank candidate sentences (meta > h1 > paragraph > h2), pick until target word band hit, dedupe and stitch with periods.
3. `beatStructuringWorker` — bucket sentences into N roughly-equal beats matching the template's scene count; supplement empty buckets from h2/list-items/h3.
4. `toneTuningWorker` — per-template lexical adjustments (kinetic-pop strips "very/simply", documentary strips second-person, quiet-premium strips exclamations + intensifiers, warm-community strips corporate jargon like "leverage/synergy/stakeholders").
5. `ttsSafetyWorker` — applied to **narration only** (visual beats keep te reo): replaces Māori place names with English (Aotearoa→New Zealand, Tāmaki Makaurau→Auckland, etc.), swaps inline te reo with English equivalents (whānau→family, mahi→work), spells out integers ≤12, splits 3–5-letter ALL-CAPS acronyms with periods (`A.C.C.`), strips parenthetical asides. Detects numeric stat patterns (`%`, `$X`, `12,500`) and logs them so the user can verify against the source page (per §4 — never invent stats).

**Re-dispatch loops** (supervisor's charter — don't accept sparse output):
- If narration < 70% of the low band, the supervisor re-runs the summarizer with a **widened** source pool (paragraphs + list items + h3) before settling.
- If any beat ends with no headline, beat-structuring re-runs with the full supplement pool; final fallback is the brand title's first segment.
- If the final word count is **below** the floor (e.g., 114 words for a 60s target), the script writes the JSON anyway but exits with code 2 and a `⚠` so the orchestrator can decide: thin source page → either pick a content-richer URL or hand-edit the JSON. Refuses to fabricate.

**Output schema** (`compositions/<slug>.copy.json`):
```json
{
  "slug": "kindred-test-copy",
  "url": "https://kindred-nz.org",
  "title": "Kindred — Share with neighbours. Find local help within 100km.",
  "template": "warm-community",
  "seconds": 30,
  "narration": "Find local help. Share with neighbours. Post it. Just local. ...",
  "beats": [
    { "kicker": "WHO WE ARE",  "headline": "Find local help.",   "body": "Share with neighbours. Post it." },
    { "kicker": "WHAT WE DO",  "headline": "Just local.",        "body": "One free app, two sides to it." },
    { "kicker": "HOW IT FEELS","headline": "Nearby neighbours will see it first.", "body": "Ask — someone a few doors down probably has it." },
    { "kicker": "WHY IT MATTERS","headline":"One free app for your street — a place to give, ask, and find.", "body": "Two things, really." }
  ],
  "cta": { "verb": "Visit", "url": "https://kindred-nz.org", "tagline": "Share with neighbours. Find local help." },
  "meta": { "generatedAt": "2026-04-25", "wordCount": 70, "beatCount": 4, "sourcedFrom": { "metaDescription": false, "h1Count": 1, "paragraphCount": 14 } }
}
```

**Verified 2026-04-25** against [https://kindred-nz.org](https://kindred-nz.org): 30s warm-community → 70 words narration (target 60–90), 4 beats with kickers + headlines + bodies, CTA verb "Visit", zero invented stats, all sentences traceable back to the page. 15s kinetic-pop → 29 words (target 25–40), 4 beats with INTRO/PROOF/PUNCH/PAYOFF kickers. 60s documentary → 114 words (target 120–160) → exit code 2 + warning (page is genuinely too thin for 60s of distinct copy — correct refusal).

The orchestrator pairs `<slug>.copy.json` with `tokens-<slug>.css` (from `new:comp`) → both layers are URL-derived → the structural template + vibe template + brand tokens + copy doc combine into a renderable comp without per-video hand-authoring. Scene-to-beat mapping convention: `s1` → `beats[0]`, `s2` → `beats[1]`, etc.; CTA always lands in the final scene.

### Composition versioning manifest — sha256 snapshot of every shared resource at creation time
Compositions reference shared resources (`design/cards.css`, `design/templates/<vibe>.css`, `design/tokens-<brand>.css`, `design/modules/all.{js,css}`, `design/effects-batch-*.css`, `design/vendor/gsap.min.js`). When any of those files change, an old comp can render *differently* than it did at creation time — same HTML, different dependencies, different output frames. There's no warning; the render just drifts silently.

[scripts/comp-manifest.mjs](scripts/comp-manifest.mjs) snapshots a per-comp manifest at creation time so future renders can be reproduced deterministically. Three subcommands:

```bash
npm run comp:write -- <slug>     # snapshot shared-resource sha256s into compositions/<slug>.meta.json
npm run comp:check -- <slug>     # diff current hashes vs manifest — exit 1 on any drift
npm run comp:list                # table of all manifests + drift status (CI gate)
```

The script scans the `<head>` of `compositions/<slug>.html` for every `<link href=…>` and `<script src=…>`, resolves relative paths (`../design/cards.css` from `compositions/<slug>.html` → `design/cards.css` from project root), skips remote refs (`https://`, `//`, `data:`), and writes a sorted-by-path manifest:

```json
{
  "slug": "text-fx-demo",
  "writtenAt": "2026-04-25T11:47:19.472Z",
  "comp":   { "path": "compositions/text-fx-demo.html", "sha256": "45ef…" },
  "sharedResources": [
    { "path": "design/cards.css",                "sha256": "6de3…" },
    { "path": "design/effects-batch-08.css",     "sha256": "5cce…" },
    { "path": "design/modules/all.css",          "sha256": "00aa…" },
    { "path": "design/modules/all.js",           "sha256": "c9be…" },
    { "path": "design/templates/kinetic-pop.css","sha256": "d3f0…" },
    { "path": "design/tokens-kindred.css",       "sha256": "ec96…" },
    { "path": "design/vendor/gsap.min.js",       "sha256": "92bb…" }
  ],
  "renderedAt": null
}
```

[scripts/new-comp.mjs](scripts/new-comp.mjs) auto-writes the manifest after generating a new comp — every brand-extracted composition ships with its dependency snapshot baked in.

**Manifest is a creation snapshot — render is read-only against it.** The render path doesn't auto-stamp `renderedAt` (deliberate: keeps the manifest as the comp's *contract*, not a render log). To re-baseline after intentional shared-resource updates, run `comp:write` again. Manifest files are checked into git — they're part of the comp.

Verified 2026-04-25: wrote manifests for `text-fx-demo`, `effect-fx-demo`, `kindred-recut`. Added a one-line CSS comment to `design/cards.css` → `comp:check` reported `✗ design/cards.css changed since manifest (expected 6de3…, got 89de…)` and exit 1; `comp:list` flagged `1 dep drift` on every comp using cards.css. Reverted the change → all clean again, exit 0. Drift detection is per-byte exact (sha256), so even whitespace edits surface.

### Local GSAP via `design/vendor/`
Don't depend on the GSAP CDN at render time. The headless browser may flake on jsdelivr, and offline renders die.

```bash
npm install gsap                                    # adds to dependencies
cp node_modules/gsap/dist/gsap.min.js design/vendor/
```

In compositions:
```html
<!-- ❌ Don't -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<!-- ✅ Do -->
<script src="design/vendor/gsap.min.js"></script>
```

Same pattern works for any vendored runtime. ~73 KB of gsap min is a small price for deterministic offline-capable renders.

### Pre-render smoke test via Playwright — `npm run check` catches runtime bugs in <1s
[scripts/smoke.mjs](scripts/smoke.mjs) runs the active composition in headless Playwright and verifies: page loads, timeline registered with non-zero children, expected module globals present (`textFx`, `effectFx`, `glitterFx`, `ampBind`), root dims match `data-width`/`data-height`, no console/runtime errors. Fails non-zero so it can gate a render. Optional `--screenshots` saves a PNG of each scene midpoint to `smoke/`. Optional `--contrast` runs a WCAG AA audit per scene midpoint.

`npm run check` now runs **three** stages — `lint` (HyperFrames CLI) → `lint:strict` (the §4 detectors from [scripts/fix.mjs](scripts/fix.mjs)) → `smoke` (Playwright). [scripts/lint-strict.mjs](scripts/lint-strict.mjs) wraps `fix.mjs --json` and exits non-zero on any **error-severity** finding only (warn/info still allow the gate through), so CI gets the deterministic catches (`</script>` in JS comments, audio without `id`, audio-track overlap) without warning noise from advisory pitfalls (`tl.from(opacity:0)`, redundant `.scene` overrides). Runs in <0.1s on top of the existing chain.

```
npm run check           # lint + lint:strict + smoke (~5s typical)
npm run lint:strict     # strict §4 detectors only (<0.1s, error-gated)
npm run smoke           # smoke only (0.9s typical)
npm run smoke:shots     # smoke + per-scene PNGs
npm run smoke:contrast  # smoke + WCAG AA contrast audit per scene
```

The 1s feedback loop catches all the bugs lint can't see — `</script>` in JS comments breaking inline-bundled modules, dimension overrides from `cards.css` on landscape comps, GSAP `from()` tweens stuck at opacity:0, missing module globals from script errors, console errors at load. **Edit → `npm run check` → render only when green.** A render takes 5+ minutes; this check takes 1s.

### WCAG contrast audit baked into the smoke test — `npm run smoke:contrast`
The Kindred recut tripped the same teal-on-cream trap §4 captured: brand `#1A9E8F` accent on cream `#FBF9F6` lands at 2.9:1 — under the 3:1 large-text WCAG AA bar. Caught manually post-render twice. Now the smoke test catches it before any render.

**How it works:** `--contrast` adds a per-scene-midpoint pass that injects a pure-JS audit via `page.evaluate`. For each visible leaf-text element under the active scene's clip window:
1. Read computed `color` and walk parents for first non-transparent `background-color`.
2. Compute relative luminance `L = 0.2126*R + 0.7152*G + 0.0722*B` after sRGB linearization, then ratio = `(L1 + 0.05) / (L2 + 0.05)` with brighter = L1.
3. Threshold = 3:1 if large text (`font-size ≥ 24px && font-weight < 700` OR `font-size ≥ 18.66px && font-weight ≥ 700`), else 4.5:1.
4. Skip elements with `aria-hidden="true"`, `display:none`, zero size, or that fall outside the active scene's `data-start`/`data-duration` window — this is critical because the upstream HyperFrames `validate` tool false-positives by sampling hidden inactive scenes (see §4 entry).

**Output:**
- `pass`: `contrast s2: 8 elements ≥ threshold`
- `warn`: `contrast s2: 1 element no background detected (skipped)` (e.g. video-only background)
- `fail`: `contrast s2: #s2-url 2.90:1 < 3:1 (large text)` — exact element + measured ratio + threshold + size class.

**Why it beats the upstream `hyperframes validate` tool:** the validator (a) doesn't gate by clip window so reports 20-30 false-positives per multi-scene comp, and (b) doesn't tell you the size class. This audit clip-gates first, then reports the per-element ratio against the right threshold. On the current `index.html` (Kindred recut): 4 scenes, 25 passes, 1 real fail on `#s2-url` (the same teal-on-cream trap). Audit logic also confirmed catching a deliberate `#aaa` on `#fff` injection (2.32:1) before reverting.

**Workflow:** `npm run smoke:contrast` after any styling change to brand-token files or scene templates. Cheap (~3.5s incl screenshots), zero-config, no library dep.

### Auto-fix common pitfalls — `npm run fix` scans for the §4 patterns we keep tripping over
[scripts/fix.mjs](scripts/fix.mjs) is a static scanner that walks `index.html` + `compositions/*.html` looking for the recurring pitfalls captured in §4. Dry-run by default — prints findings with line numbers and suggestions. `--apply` writes the safe mechanical rewrites with timestamped backups (`<file>.backup-<iso-ts>`).

The detectors are now part of the standard `npm run check` gate via [scripts/lint-strict.mjs](scripts/lint-strict.mjs) — that wrapper runs `fix.mjs --json` and exits non-zero only on **error-severity** findings (the deterministic ones: `script-close`, `audio-id`, `audio-track`). Warn/info findings stay advisory and don't block CI. When strict fails, the output points at `npm run fix:apply` for the auto-fixable ones (`script-close`, `autoplay-guard`, `cdn`).

```
npm run fix           # dry-run report (errors + advisories)
npm run fix:apply     # write fixes (creates .backup-<ts>)
npm run lint:strict   # CI-gateable strict pass — error-severity only, <0.1s
node scripts/fix.mjs --ignore=cdn,bundle    # skip specific pitfall ids
node scripts/fix.mjs --json                 # machine-readable for CI
```

**Detectors (id → pitfall):**

| id              | severity | auto-fixable | what it catches |
| --------------- | -------- | ------------ | --------------- |
| `script-close`  | error    | yes          | literal `</script>` on a JS-comment line that ends `<script>` prematurely |
| `from-opacity`  | warn     | no           | `tl.from(..., { opacity: 0 })` brittle on paused/seek timelines |
| `scene-override`| warn     | no           | `.scene { width: 1080px; height: 1920px }` redundant under cards.css 100%/100% default |
| `autoplay-guard`| warn     | yes          | timeline registered without the `if (window === window.top) tl.play(0)` guard |
| `cdn`           | warn     | yes          | GSAP from a CDN — replaces with `design/vendor/gsap.min.js` |
| `bundle`        | info     | no           | 4+ individual `design/modules/*.css` link tags — suggest the `all.css` bundle |
| `audio-id`      | error    | no           | `<audio data-start>` without `id` — renderer silently drops it |
| `audio-track`   | error    | no           | overlapping `<audio>` on the same `data-track-index` — channel collision |
| `gsap-set-loop` | info     | no           | `for` loop with timeline.set() over many iterations — bloats timeline |

**Why dry-run by default:** half the findings are advisory (semantics-dependent rewrites that need human judgement — `tl.from` → `tl.fromTo` end values are ambiguous; module-bundle collapse may break a partial-include opt-in; audio-track reassignment needs a global plan). Only three deterministic mechanical rewrites flip on with `--apply`. Backup-before-write is always required — if no fix actually applies, the backup is removed so we don't litter.

**File scope is narrow on purpose:** only `index.html` + `compositions/*.html`. Doesn't touch `archive/`, `plans/`, `docs/`, or anything outside the active comp set. Same scope as `npm run lint` and `npm run smoke`.

**Status:** captured 2026-04-25. Catches the pitfalls before they bite. Run as part of `npm run check` cycle when you're about to render.

### Templates × modules — pick one base template per video, mix any modules per scene
The composition system separates **vibe** from **per-scene effects**:
- **Base templates** ([design/templates/](design/templates/)) define pacing tokens, motion easing, type scale, shadow vibe, and a recommended LUT. Pick **ONE** per video. Currently: `warm-community` (organic/serif/slow), `kinetic-pop` (loud/condensed/fast), `documentary` (cinematic/editorial/slow), `quiet-premium` (spacious/light/mid-tempo).
- **Brand tokens** ([design/tokens-<brand>.css](design/tokens-kindred.css)) overlay palette + fonts. Auto-extracted from website or hand-written.
- **Modules** ([design/modules/](design/modules/)) ship per-scene effects with one-line GSAP wrappers — `textFx.{explode,stamp,cascade,stagger,typeOn,counter}`, `effectFx.{multiplaneDolly,inkBleed,glitchBurst,cinemagraphRotate}`, `glitterFx.{burst,fall,ambient}`. Mix **any** modules under any template.
- **Combining vibes:** if a single scene needs a different feel (e.g. warm-community base + kinetic-pop hit on scene 4), DON'T load two templates — scope the override on a wrapper class: `.vibe-override-kinetic-pop { --pace-fast: 0.7s; --card-font-display: "Bebas Neue"... }`. See [design/templates/README.md](design/templates/README.md).

Verified 2026-04-25: warm-community + Kindred tokens + 3 text modules + 4 effect modules + 3 glitter modules = the recut at [archive/index-v13-pre-recut-preview.html](archive/index-v13-pre-recut-preview.html) (reference) and current `index.html`.

### Combined effect recipes — `combo-fx.js`
[design/modules/combo-fx.js](design/modules/combo-fx.js) ships ten **choreographed** multi-primitive recipes for moments where one primitive isn't enough. Each combo composes 3-5 existing primitives in a sequenced timeline (not parallel soup) and owns a single named "moment" — entrance, impact, transition, ambient, exit. The motivation: 1+1=3. A stamp alone reads "loud" but flat; a stamp + glitch + glitter reads "the number landed."

Loaded automatically through [design/modules/all.js](design/modules/all.js). Plan + design rationale lives in [docs/effect-combos-plan.md](docs/effect-combos-plan.md).

| Combo | Owns the moment of… | Stacks (in order) |
|---|---|---|
| `comboFx.superImpact(tl, "#stat", { at, duration:1.2, intensity, seed, from })` | hero stat / number land | inkBleed → counter → stamp → glitchBurst → glitterFx.burst → grade-pop pulse |
| `comboFx.cinematicReveal(tl, "#stage", { at, duration:1.6, headline, intensity, seed })` | headline entrance through depth | multiplaneDolly → inkBleed → textFx.stagger → drop-shadow trail |
| `comboFx.hyperGlitch(tl, "#word", { at, duration:0.6, intensity, bursts })` | sub-second signal-break impact | scanlines → vhs-jitter → glitchBurst ×N → optional stamp re-anchor |
| `comboFx.dreamSequence(tl, "#scene", { at, duration:4.0, cinemagraph, headline, intensity, seed })` | ambient hero / pause-and-feel | cinemagraphRotate → shimmer-clip wipe → glitterFx.ambient → glitterFx.fall → cool-grade |
| `comboFx.kineticBurst(tl, "#title", { at, duration:1.0, intensity, seed })` | one-word emphasis pop | textFx.explode (in) → glitterFx.burst (small) → micro glitchBurst |
| `comboFx.slamCut(tl, "#scene", { at, duration:0.9, content, intensity })` | hard scene-break transition | noir-flash overlay → glitchBurst → multiplaneDolly snap-back → textFx.cascade → grade-pop fade-in |
| `comboFx.signalPulse(tl, "#beacon", { at, duration:1.6, caption, counter, ringCount, intensity, seed })` | "look-here" beacon / data callout | 5 expanding radio rings → textFx.typeOn → glitterFx.ambient → optional textFx.counter |
| `comboFx.paperTear(tl, "#scene", { at, duration:1.4, outgoing, incoming, stage, intensity, seed })` | scene swap with a pulled-back camera | textFx.explode (out) + reverse inkBleed → multiplaneDolly back → textFx.stamp on incoming → warm-grade pulse |
| `comboFx.confettiFinale(tl, "#scene", { at, duration:2.4, lockup, rule, tagline, cinemagraph, intensity, seed })` | end-card / outro crescendo | multiplaneDolly settle → textFx.stamp lockup → rule scaleX → glitterFx.burst + .fall combined → cinemagraphRotate idle |
| `comboFx.holoFlash(tl, "#sticker", { at, duration:1.4, lockup, intensity, seed })` | brand-chip / sticker arrival | holo gradient drift → multiplane near-pop → textFx.stamp → glitchBurst → glitterFx.burst → long-shadow drop |

**Constraints baked into every combo:**
- Deterministic — `mulberry32(seed)` for any randomness; no `Math.random` / `Date.now`
- `tl.fromTo()` only (paused/seek-safe); `tl.from()` is banned per §3
- Glitch / jitter windows ≤ 0.25s — continuous glitch reads amateur (§3)
- Filters cleared on combo end (`clearAfter` mirrors `effectFx.inkBleed`)
- Returns `{ duration }` so callers can chain follow-ons

**Visual identity check** — every combo produces a distinct dominant signature (radial energy / depth push / chromatic chaos / soft drift / granular scatter / hard cut / ripple-out / stage-up exit / crescendo / iridescent badge). Verified by peak-frame thumbnails in [docs/effects-catalog.html](docs/effects-catalog.html) under the "Combos" section.

Demo composition: [compositions/combo-fx-demo.html](compositions/combo-fx-demo.html) (1920×1080, 30s — one combo per 3-second scene with label-chip).

#### Batch-2 combos (2026-04-26) — census-driven additions

After the original ten combos shipped, a 25-template usage census ([docs/combo-fx-batch-2-plan.md](docs/combo-fx-batch-2-plan.md)) revealed that 22/25 templates were still wiring 4-7 bare-primitive calls per scene that matched recurring named-moment patterns. Six combos were added to consolidate the most-repeated sequences and own moments the original ten left uncovered. Each one survived the same "≥3 templates would adopt + composes existing primitives (or surfaces a new primitive worth shipping)" gate.

| Combo | Owns the moment of… | Adopters | Why distinct from existing combos |
|---|---|---:|---|
| `comboFx.glitchStamp(tl, "#hook", { at, duration:0.9, bursts, burstSpacing, fromScale, glitter, intensity, seed })` | "stamp the word/headline/price/date with snap-of-energy" — the most-repeated 4-call sequence in the library | 9 templates (~25 invocations) | `superImpact` requires a number; `kineticBurst` is letter-explosion; `hyperGlitch` is sub-second disruption. None is "stamp + double-glitch" exactly. |
| `comboFx.pricePop(tl, "#price", { at, duration:1.2, currency, strikethrough, particleHost, intensity, seed })` | price reveal — currency entrance, optional strikethrough wipe on "before" price, scale + glitch + glitter on "now" | 4 templates | `superImpact` runs a counter from 0 (wrong for prices — `$49` doesn't tick up). pricePop is currency-fade + strike-wipe + stamp + glitter. |
| `comboFx.testimonialReveal(tl, "#stage", { at, duration:1.8, avatar, name, role, quote, ambient, intensity, seed })` | name + role + avatar + quote choreography — the "real human said this" moment | 7 templates | `cinematicReveal` is one-headline; `dreamSequence` is ambient. Nothing today choreographs four element types (avatar / name-cascade / role-typeOn / quote-stagger) into one beat. |
| `comboFx.focusPull(tl, "#stage", { at, duration:1.4, foreground, background, fromBlur, toBlur, dolly, intensity })` | depth-of-field rack from background to foreground — the "lens just refocused" moment | 5 templates | `multiplaneDolly` is Z-translation, not focus shift. `cinematicReveal` uses dolly + ink-bleed but never blur. No combo today reads as "the lens just refocused". |
| `comboFx.statGroup(tl, "#grid", { at, duration:2.0, stats:[…], stagger, ambient, punchLast, intensity, seed })` | 3-5 stat numbers count up together with shared shimmer — the stat-grid moment | 7 templates | `superImpact` is *one* hero number. `statGroup` is N counters with staggered starts and a single ambient blanket. |
| `comboFx.spotlight(tl, "#answer", { at, duration:1.6, host, radius, feather, centerX, centerY, auto, dim, dimAmount, intensity, seed })` | circular vignette focus on a key element while dimming everything else — the "this is the answer" moment | 4 templates | No combo today owns "isolate one element with a soft halo + dim siblings". `signalPulse` is rings; `dreamSequence` is cool grade — neither isolates a single element. Depends on the new `effectFx.radialMask` primitive. |

Same constraints as the original ten (deterministic / `tl.fromTo` only / glitch ≤ 0.25s / filters cleared / returns `{ duration }`). Demo composition extended from 10 → 16 scenes; catalog regenerated. Two combos (`focusPull`, `spotlight`) depend on new effect-fx primitives — see next section.

### New effect-fx primitives (2026-04-26) — `rackFocus` + `radialMask`

Two new primitives shipped alongside batch-2 to unblock `focusPull` and `spotlight`. Both follow the same Windows-safe pattern as `effectFx.inkBleed` (lock filter at start, clear on completion). Loaded via the standard module bundle.

| Primitive | API | What it does |
|---|---|---|
| `effectFx.rackFocus(timeline, target, { at, duration:0.6, from:8, to:0, ease:"power2.out", clearAfter:true })` | `effectFx.rackFocus(tl, el, { at, duration, from, to, ease, clearAfter })` | Tweens `filter: blur(<from>px → <to>px)` on the target. Drops the filter on completion to free render cost and prevent stacked blurs bleeding into later tweens. Used by `focusPull` (sharp→blurred on bg, blurred→sharp on fg). |
| `effectFx.radialMask(timeline, target, { at, duration:0.5, from:0, to:50, centerX:50, centerY:50, feather:8, ease, clearAfter:true })` | `effectFx.radialMask(tl, el, { at, duration, from, to, centerX, centerY, feather, ease, clearAfter })` | Opens a soft-edged spotlight mask on the target by tweening `--rm-radius` (consumed by an injected `mask-image: radial-gradient(...)` rule). Center + feather pinned with `tl.set(...)` at `at` so overlapping calls don't fight. Cleans up the host class on completion. Used by `spotlight` (open then close). |

Both are pure CSS-variable bridges (no DOM mutation per frame), so they're cheap and seek-safe. `radialMask` injects its rule once via `ensureRadialMaskRule()` mirroring the `cinemagraphRotate` / `inkBleed` pattern.

### CSS animation budget — use `@keyframes` for repetitive motion, GSAP for state changes
The studio iframe hangs around ~1000-2000 GSAP timeline children. The renderer itself is fine with thousands, but eager script execution in the studio's iframe wrapper is the bottleneck. **Rule of thumb:**
- **Use GSAP** for: scene entries/exits, one-shot reveals, slide-on tweens, anything timeline-relative or position-aware.
- **Use CSS `@keyframes`** for: repetitive pulses, sparkles, ambient spins, bounces, anything that loops in place. The renderer evaluates CSS animations at frame time, so they stay deterministic.

Bridge pattern when you need both: GSAP sets the initial position + opacity once, then a CSS class with `animation: pulse <period> ... infinite` takes over for the loop. Pause/resume the animation via `tl.set(el, { className: ... }, t)` to start/stop. Verified 2026-04-25: `glitterFx.ambient` dropped from 1500 GSAP set() calls → 0 (pure CSS) — total timeline went 2250 → 601 children. Studio iframe load went from "hangs forever" to "<1s".

### Pseudo-element transforms via CSS-variable bridge
GSAP can't tween a pseudo-element (`::before`/`::after`) directly — they're not in the JS-accessible DOM. But pseudos DO read CSS custom properties from their host element. So:

```css
.fx-cinemagraph-bg::before {
  transform: rotate(var(--cg-rotation, 0deg));
}
```

```js
tl.fromTo(".fx-cinemagraph-bg",
  { "--cg-rotation": "0deg" },
  { "--cg-rotation": "360deg", duration: 24, ease: "none" });
```

Used in [design/modules/effect-fx.js](design/modules/effect-fx.js) `cinemagraphRotate`. Same pattern works for any pseudo property that references a custom property. The CSS rule is auto-injected on first call so consumers don't have to copy it into every comp's `<style>`.

### Standalone autoplay guard — same comp plays in a tab AND stays paused under the studio/renderer
Append to the inline composition script after the timeline is built:

```js
// Auto-play when loaded directly in a top-level browser tab. The studio
// and the renderer both wrap the comp in an iframe and drive seek themselves
// (via postMessage) — we stay paused there so they remain in control.
if (window === window.top) {
  setTimeout(() => tl.play(0), 250);
}
```

Why useful: the studio iframe occasionally hangs on hot-reload races (see §4). The bypass URL `http://localhost:3002/api/projects/<name>/preview?fresh=1` returns the same composition file but at top-level, so the autoplay guard kicks in and the user can preview without depending on the studio shell. Doesn't affect renders — the renderer drives seek on a paused timeline.

### Prefer `tl.fromTo()` over `tl.from()` on paused/seek timelines
`tl.from(target, { opacity: 0, ... })` with default `immediateRender: true` applies the from state at script load, then captures the "natural" CSS state when the tween starts at its scheduled time. Under paused/seek timelines, the natural state can be polluted by an earlier tween's residue, so the tween ends up animating 0→0 — element stuck invisible.

**Fix:** use explicit start AND end values:
```js
// Brittle:
tl.from("#title", { opacity: 0, scale: 0.96, duration: 0.5 }, 14.2);
// Robust:
tl.fromTo("#title",
  { opacity: 0, scale: 0.96 },
  { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
  14.2);
```

Caught 2026-04-25 on the recut's scene-4 closer line — playwright screenshot showed glitter exploding around an invisible "Just local, just helping." `from()` resolved at opacity:0 even after seeking past the tween end. `fromTo` made it explicit and the line appeared.

### Deterministic particles via seeded `mulberry32` PRNG
HyperFrames captures frames in a headless browser at non-realtime cadence. `Math.random()` produces different values per call regardless of frame time, breaking determinism. Use a seeded PRNG instead:

```js
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const dx = (rand() - 0.5) * 800;   // same dx across renders for seed 42
```

Used in `textFx.explode` (scatter angles), `glitterFx.burst` (radial particle field), `glitterFx.fall` (start positions + wobble), `glitterFx.ambient` (positions + phase offsets). Each recipe accepts an `opts.seed` so two consecutive calls with the same seed produce the same pattern, but you can stagger seeds to vary patterns.

### Parallel research-agent fan-out for open R&D questions
For broad "how could we do X better" or "what alternatives exist" questions, fan out 3-4 angle-specific research agents in parallel rather than driving exploration sequentially in main context. Each agent gets a focused brief (current state inventory, industry-best techniques, alt tech stacks, specific high-impact additions) and returns ~1000-2000 words of source-cited findings. Synthesis happens in the main thread once all return.

Verified 2026-04-25 — single round of 4 parallel agents (Explore + 3 general-purpose) returned ~5000 words covering current effects inventory, motion-design state-of-the-art 2025-26, 12 alternative tech stacks (Remotion, Motion Canvas, AE+Lottie, Cavalry, Three.js, Rive, Lottie, Houdini, Unreal/Unity/Notch, AI video gen, generative-image-to-animate, specialized libs), and 15 specific techniques (audio-reactive FFT, displacement filters, flow fields, type-as-mask, multiplane, match-cuts, datamosh, 3D-from-2D, procedural illustration, smart easing, procedural sound, LUT grade, frame interpolation, cinemagraphs, AI b-roll). Sharper than serial probing — parallel agents don't duplicate work because the briefs partition the question space.

---

## 4. Pitfalls (read me first)

### ❌ Inventing facts for real brands (DO NOT DO THIS)
- **Symptom:** Wrote a Claim Mate promo containing "1 in 3 ACC claims declined", "MBIE review 2024", "2,400 Kiwis helped", "twelve thousand dollar average outcome". User caught it. None were verified.
- **Cause:** Filled scenes with statistics that "sounded right" instead of asking the user for verified data or designing copy without numeric claims.
- **Fix:** For real brands, ask for verified stats first. If unavailable, replace numbers with brand voice ("A decline isn't the end") rather than invented evidence.
- **Status:** Hard rule, captured in cross-session memory `feedback_no_invented_facts`.

### ❌ Māori / te reo words in TTS narration
- **Symptom:** "Built in Aotearoa" in narration sounded wrong even with the en-NZ voice.
- **Cause:** Edge TTS (and most neural TTS) butcher Māori pronunciation, undermining the brand authenticity the words were meant to add.
- **Fix:** Use English place names in TTS — "New Zealand" not "Aotearoa", "Auckland" not "Tāmaki Makaurau". Visual on-screen text can still use te reo.
- **Status:** Hard rule, captured in cross-session memory `feedback_tts_no_maori`.

### ❌ Wrong Claim Mate logo (cadastral mark + lowercase wordmark)
- **Symptom:** Used the cadastral-frame-with-arrow SVG as a logo lockup next to a lowercase `claim/mate` wordmark.
- **Cause:** Trusted a stale local README without checking the live site. Real brand on `claim-mate/landing-page/index.html` uses **wordmark-only**, **UPPERCASE**, JetBrains Mono, navy slash. The cadastral SVG is a **favicon only**.
- **Fix:** For any real brand, read the canonical source file (live site index.html) before designing. The brand README in `assets/logo/README.md` is now corrected with explicit "Do NOT use" guidance.
- **Status:** Fixed 2026-04-24.

### ❌ Project-scoped subagents need a Claude Code restart
- **Symptom:** `Agent type 'composition-doctor' not found. Available agents: claude-code-guide, Explore, general-purpose, Plan, statusline-setup`
- **Cause:** New `.claude/agents/*.md` files are loaded at Claude Code startup, not at runtime.
- **Fix:** Tell the user to restart Claude Code after creating new agents. Do the work inline this session.
- **Status:** Fixed by documentation 2026-04-24.

### ❌ Pixabay selector matched a hidden dropdown
- **Symptom:** `locator.waitFor: Timeout 10000ms exceeded` even though results clearly load.
- **Cause:** `a[href*="/photos/"]` matches a hidden `<a href="/photos/">` in the nav dropdown. Its `:first` is hidden → never visible → timeout.
- **Fix:** Use `a[href^="/photos/"]:visible` plus a slug filter (URL must contain `-` and end with `/`). See [scripts/fetch-pixabay-photo.mjs](scripts/fetch-pixabay-photo.mjs).
- **Status:** Fixed 2026-04-24.

### ❌ FFmpeg not on bash PATH after winget install — RESOLVED 2026-04-26
- **Symptom:** `npx hyperframes render` reports "FFmpeg not found".
- **Cause:** winget updates the Windows user PATH, but bash sessions inherit the parent process env. Newer cmd.exe shells see it; bash often doesn't.
- **Fix:** Project scripts now use `@ffmpeg-installer/ffmpeg` via [scripts/lib/ffmpeg-path.mjs](scripts/lib/ffmpeg-path.mjs) — the binary ships in `node_modules/`, no PATH dependency (§3 "Bundled ffmpeg"). The HyperFrames CLI itself still uses system PATH; if it complains, the PATH-export workaround in §2 still applies as a fallback (or `npm run render` via `scripts/render.mjs` which also handles its own ffmpeg shell-out via the bundled binary).
- **Status:** Resolved by bundling 2026-04-26. Original workaround (export PATH each session) preserved in §2 as fallback. Historical context for any future sessions that hit it via a non-routed path.

### ❌ ffmpeg filter parser breaks on Windows `C:\` absolute paths
- **Symptom:** `[AVFilterGraph] No option name near '/Users/...'` then `Error parsing filterchain`. Hits any filter that takes a path arg — `lut3d=path`, `ametadata=file=path`, `movie=filename`, etc.
- **Cause:** ffmpeg filter syntax uses `:` as the option-pair separator within a filter (`option1=val:option2=val`). A Windows path like `C:/Users/...` makes the parser treat `/Users/...` as a new option name.
- **Fix:** Spawn ffmpeg with `cwd` set to a base directory (project root or a cache dir) and pass the path as a colon-free **relative** path inside the filter. Inputs/outputs through `-i` / output args still tolerate absolute paths — only filter-internal paths are affected. Backslash-escaping (`C\:/...`) does NOT work in current ffmpeg.
- **Verified pattern:** [scripts/post-grade.mjs](scripts/post-grade.mjs) (LUT path) and [scripts/extract-amp.mjs](scripts/extract-amp.mjs) (ametadata file path) — both use `spawn(... { cwd: projectRoot })` + `path.relative()`.
- **Status:** Captured 2026-04-25. Applies to any new ffmpeg filter usage on Windows.

### ❌ One `data-track-index` = one audio channel — overlapping SFX must use different tracks
- **Symptom:** Lint reports `overlapping_clips_same_track: Track 3: clip ending at 3s overlaps with clip starting at 2.85s`. Then `duplicate_audio_track: Multiple <audio> elements on track 3 overlap`. 8 errors / 6 warnings from one render setup.
- **Cause:** The previous SFX scaffold convention put all sound effects on `data-track-index="3"`. The HyperFrames renderer treats one track as one channel — clips on the same track must not overlap. SFX inherently overlap (an outgoing scene's whoosh runs into the next scene's whoosh; a pad bed on track-3 runs underneath all scene-internal SFX). The "all SFX share track 3" idea was a wrong analogy from how an NLE timeline lane treats audio.
- **Fix:** Each `<audio>` SFX gets a unique `data-track-index`, sequential from 20 upward (well clear of reserved tracks 0-13). Each also needs a unique `id` (the renderer requires it to discover media — without `id`, audio is silently skipped). Update [design/cards.css](design/cards.css) §`.scene__sfx` and the recipes in [LEARNINGS.md §3 scene scaffold pattern](LEARNINGS.md) to reflect this.
- **Status:** Fixed 2026-04-25. Reserved track ranges in this project: 0-7 scene clips · 8 music · 9 narration · 10 header · 13 film grain · 20+ SFX (one per audio element).

### ❌ HyperFrames `preview` has an internal esbuild path bug
- **Symptom:** `Could not resolve "...hyperframes/runtime/entry.ts"` in the studio output, then exit.
- **Cause:** Path resolution issue in HyperFrames CLI 0.4.15 with npx cache locations on Windows.
- **Workaround:** Skip `preview`, render directly with `npx hyperframes render`. Live preview not essential if your composition lints clean.
- **Upstream:** Worth filing an issue if it bites again.

### ❌ Two `<img>` with same src in different scenes triggered duplicate-media lint warning
- **Symptom:** `duplicate_media_discovery_risk: Detected 2 matching img entries`.
- **Cause:** HyperFrames media discovery hashes `src` + computed timing; if two scenes use the same icon at any point, lint complains.
- **Fix:** Use a different file in one location, or define the icon once as an SVG `<symbol>` and `<use>` it twice.

### ❌ Sub-composition `document.currentScript` is null + multi-instance collides on `window.__timelines[id]`
- **Symptom:** 11 script errors at render, then `video metadata not ready after 45000ms` as the media src never got assigned. Happened with 4 ken-burns sub-comp instances in v3-attempt-1.
- **Cause:** HyperFrames compiler wraps every sub-comp `<script>` in an IIFE (`__run()`) and calls it separately. Inside the wrapper, `document.currentScript` returns `null`, so the pattern `document.currentScript.closest('[data-composition-id="..."]')` fails. Also, every instance of the same sub-comp writes to the **same** `window.__timelines[id]` key — the last one wins, so only one instance animates.
- **Fix:** For multi-scene promos where the same component appears many times (ken-burns per scene, step-badge per step), **inline the HTML/CSS/GSAP into the root `index.html`** with unique element IDs per instance. Keep the `compositions/` library files as copy-paste references, but don't load them as runtime sub-comps.
- **When sub-comps ARE safe:** a singleton overlay used once (e.g., the end-card wordmark), IF the script uses `document.querySelector('[data-composition-id="..."]')` instead of `currentScript.closest(...)`.
- **Status:** Captured 2026-04-24, v3.

### ❌ `<video>` element bleeds through earlier scenes even when its clip is hidden
- **Symptom:** Scene 1 (supposed to show `denied-letter.jpg`) and scene 2 (supposed to show `workspace.jpg`) both rendered the hands-on-laptop `working.mp4` video instead. Frame-verified at t=0.5, 2.0, 4.5, 6.5 — the expected photos never appeared. Undetected across v3 AND v3.2 renders because the bleeding content (hands typing) was thematically plausible for those beats.
- **Cause:** `<video muted playsinline>` elements autoplay from t=0 and paint a frame as soon as metadata loads, **bypassing** the HyperFrames `class="clip"` visibility system. `<img>` tags don't have this problem — only `<video>`. The framework hides the containing `<div class="clip">` but the browser already composited the video pixels on top.
- **Fix:** Hard-gate video opacity in CSS AND drive it via GSAP:
  ```html
  <video id="bg-3-vid" ... preload="metadata" style="opacity:0;"></video>
  ```
  ```js
  tl.set("#bg-3-vid", { opacity: 1 }, SCENE_START);  // activate at scene entry
  tl.fromTo("#bg-3-vid", {scale:1.0}, {scale:1.06, duration: SCENE_LEN}, SCENE_START);
  tl.set("#bg-3-vid", { opacity: 0 }, SCENE_END);    // kill after scene exit
  ```
  The inline `opacity:0` prevents the flash before GSAP takes control; the `tl.set()` pairs bracket the clip's active window.
- **Prevention:** **Frame-verify EVERY background video clip** at t = SCENE_START + 0.2 (just after entry) AND at t = earlier_scene + 0.2 (should NOT show the video). If the video shows up where it shouldn't, bleed is happening.
- **Status:** Fixed 2026-04-24 in v3.3. Hid undetected from v3.0 → v3.2 because hands-on-laptop was plausible under "ACC said no" narration. Frame verification discipline would have caught it.

### ❌ Pre-render asset preview is non-optional
- **Symptom:** v5 calendar video (`v5-calendar.mp4`) was wired into the composition without being viewed. Cartoon green-chroma art style only detected post-render during frame audit — required a re-render pass.
- **Cause:** Assumed the downloaded video was usable without checking its content.
- **Fix:** After EVERY fetch, extract a single preview frame before placing the asset: `ffmpeg -ss 0.5 -i <file> -frames:v 1 preview.jpg` then Read the JPG. If it's wrong, swap the asset, not the render.
- **Status:** Captured 2026-04-24, v5.

### ❌ Stock filenames lie about content
- **Symptom:** `phone-doc.jpg` was used for a CTA/resolution scene — it's actually a stressed woman with hand on forehead (wrong emotional beat). `denied-letter.jpg` in the library is a "SPECIAL OFFER" stamp, not a denial letter.
- **Cause:** Filename chosen by uploader, not standardised.
- **Fix:** Never trust a stock filename. Read the asset (or extract a frame) and verify content before placing. Especially dangerous for emotionally-coded scenes where the wrong beat undermines the message.
- **Status:** Captured 2026-04-24, v5.

### ❌ Typography width overflow before render
- **Symptom:** `.wm-mark` CTA at `font-size: 190px` in JetBrains Mono — "CLAIM ✓ MATE" computed ~1200px wide inside a 1080px frame, clipping both edges. Only visible post-render.
- **Cause:** No pre-flight width estimate before choosing font size.
- **Fix:** Before first render, compute: `char_count × 0.6 × font_size + special_char_width` and compare to `frame_width − (panel_padding_x × 2)`. Do the math; don't eyeball.
- **Status:** Captured 2026-04-24, v5.

### ❌ `repeat: N` on pulse animations can end on a hidden keyframe
- **Symptom:** Brandmark chip used a pulse cycle with `repeat: 6`. Animation ends mid-invisible — chip renders as an empty rectangle during Scene 6.
- **Cause:** The `repeat` count ends the animation at whichever keyframe happens to align with N complete cycles. If that keyframe is the "invisible" phase, the element stays hidden.
- **Fix (option a):** Calculate exactly how many repeats land on a visible keyframe: `Math.floor(sceneEndTime / cycleDuration) - 1` then verify. **Fix (option b — simpler):** After the repeat block, add `tl.set(".chip", { opacity: 1 }, sceneEndTime - 0.01)` to force the visible state regardless of where the cycle ends. Option b is the safe default.
- **Status:** Captured 2026-04-24, v5.

### ❌ Stale variable reference after rename in fetcher scripts
- **Symptom:** After patching direct-URL support into `scripts/fetch-pixabay-music.mjs`, variable `searchUrl` was renamed to `startUrl`. One stale `Referer: searchUrl` remained on line 122 → `ReferenceError` on the direct-URL code path.
- **Cause:** Partial rename — missed one reference.
- **Fix:** After any variable rename in a script, run `grep -n '<old-name>' <file>` before declaring done. One command, prevents a runtime crash in a code path that only triggers on specific input.
- **Status:** Fixed before v5 shipped. Confirmed line 122 of `fetch-pixabay-music.mjs` now reads `Referer: startUrl`.

### ❌ HyperFrames `validate` contrast tool reports false-positives for hidden inactive-scene elements
- **Symptom:** `npx hyperframes validate` returns 20–30 contrast warnings on a clean multi-scene comp, many with `null:1` ratio or impossible 1:1 matches. The warnings list elements from scenes that are NOT visible at the sample timestamp.
- **Cause:** The validator seeks to N timestamps, screenshots, samples background pixels behind every text element in the DOM, and computes contrast — but the framework hides inactive clips via display/opacity. Hidden elements still exist in the DOM with their stylesheet color, so the validator picks up the CSS color and a "fallback" background reading, producing meaningless ratios. `null:1` means no background could be sampled (element has zero rendered area).
- **Fix:** Triage the report by element-vs-active-scene. **Ignore** any warning where the element belongs to a scene that is NOT active at the sample timestamp (cross-reference the `id` like `#s2-wordmark` or `#s3-row-3` against the `scene-N` start/duration). **Address only** ratio-numbered failures whose element IS active at the sample timestamp. On Kindred 2026-04-25 the validator returned 32→29 warnings, all 29 confirmed false-positive after triage.
- **Status:** Captured 2026-04-25. Worth filing upstream — the validator should respect `class="clip"` visibility windows from `data-start`/`data-duration`.

### ❌ HyperFrames compiler doesn't resolve `var(--font-*)` for deterministic font embedding
- **Symptom:** `[Compiler] No deterministic font mapping for: var(--card-font-display), var(--card-font-mono), var(--card-font-ui)` warning at render time. Render still succeeds.
- **Cause:** The compiler scans CSS source statically for `font-family:` values and matches against a known mapping table to embed fonts deterministically. It doesn't follow `var(...)` references, so a stylesheet using design-token vars for fonts gets zero deterministic embedding.
- **Fix:** If reproducibility matters, use **direct font names** in `font-family:` declarations (the mapping table includes `nunito`, `jetbrains-mono`, `inter`, `montserrat`, `playfair-display`, `eb-garamond`, etc.). Fonts not in the map (e.g., Fraunces) need an explicit `@font-face` block with a hosted font URL. If reproducibility doesn't matter (one-off render with network), the Google Fonts `@import` in the brand-token file loads at render time and the warning is cosmetic.
- **Status:** Captured 2026-04-25 on Kindred. Worth filing upstream — compiler should follow `var()` chains to a non-var value before declaring "no mapping".

### ❌ Brand teal `#1A9E8F` on cream `#FBF9F6` is 2.9:1 — under WCAG AA large-text threshold
- **Symptom:** Validator reports `2.9:1 (need 3:1)` on kicker labels and italic accent spans using the brand's primary teal on the cream canvas.
- **Cause:** WCAG AA requires 3:1 for large text (≥18pt regular OR ≥14pt bold). Standard 24–28px Nunito 500 is "large" in WCAG terms. Mid-saturation teals on warm cream sit just under the threshold.
- **Fix:** Switch kicker / accent-em colors from `--card-accent` (#1A9E8F) to `--card-slate` (#14806F teal-deep). Measured 4.6:1 on cream — clears AA easily. Visual brand reading stays "teal accent on warm canvas"; reads slightly more authoritative.
- **Prevention:** Any new brand using a mid-saturation teal/green/aqua as primary on a light canvas — pre-flight check the contrast before authoring kickers/accents. Default kicker color = the brand's deep variant, not the primary.
- **Status:** Captured 2026-04-25 on Kindred. Reusable for any community/healthcare/eco brand using teal palettes.

### ❌ `</script>` literal in JS comments breaks the studio's inline-bundled scripts
- **Symptom:** `textFx`, `effectFx`, `glitterFx` not on `window` after page load. Inline composition script throws `textFx is not defined`. Timeline registered but with 0 children. Play button does nothing.
- **Cause:** The studio's preview proxy inlines `<script src="design/modules/foo.js">` by replacing the tag with `<script>...content...</script>`. The HTML parser ends a `<script>` element at any literal `</script>` — even one inside a JS line comment (`//   <script src="...">/script>`). Everything after that line gets parsed as plain HTML, including the `global.foo = ...` assignment that exposes the IIFE's exports.
- **Fix:** Write `<\/script>` in JS comments (and strings). The backslash is ignored by the HTML parser's script-data-end-tag-open state (it's not a `/`, so it doesn't trigger script-tag close), and is just an extra character in JS strings — works in both contexts.
- **Detection:** [scripts/smoke.mjs](scripts/smoke.mjs) catches this — if a referenced module isn't on `window`, it fails with "module foo referenced but not on window — check for </script> in JS comments".
- **Status:** Fixed 2026-04-25. Pattern: any IIFE-style browser module loaded by the studio. Now part of the smoke check.

### ❌ `cards.css` hardcodes `.scene { width: 1080px; height: 1920px }` — landscape comps lay out wrong
- **Symptom:** 1920×1080 landscape comp shows scenes as 1080×1920 portrait, content positioned wrong, half the screen empty/clipped.
- **Cause:** `cards.css` was authored for vertical 9:16 social videos. The default `.scene` rule sets explicit width/height. `inset: 0` doesn't override because the explicit pixel values win.
- **Fix:** In landscape comps, override in the inline `<style>`:
  ```css
  .scene {
    /* Override cards.css default 1080×1920 portrait — this comp is landscape. */
    position: absolute; inset: 0;
    width: 1920px; height: 1080px;
    ...
  }
  ```
- **Detection:** [scripts/smoke.mjs](scripts/smoke.mjs) catches it — compares `data-width`/`data-height` on the root composition vs actual `getBoundingClientRect()`. Mismatch fails with "root dims X×Y but actual A×B — likely cards.css portrait override".
- **Status:** Fixed 2026-04-25. Long-term fix would be to make `cards.css` use `100%` and let the root element drive size, but the current scene-stamp implies portrait by default.

### ❌ GSAP `tl.from()` stuck at "from" state on paused/seek timelines
- **Symptom:** Element appears at opacity:0 (or whatever the from state is) even after the tween end-time has passed. Inline style: `opacity: 0; transform: scale(0.96)`. Seeking the timeline forward past the tween makes no difference.
- **Cause:** With `immediateRender: true` (GSAP default for `from()`), the from values are written to the element at script load. When the tween scheduled at `t=N` runs, GSAP captures the "natural" state for the tween's end value — but if anything has polluted the inline style by then (or the immediateRender effect itself), the natural state equals the from state. So the tween animates 0→0.
- **Fix:** Use `tl.fromTo()` with explicit start AND end values:
  ```js
  // ❌ Brittle
  tl.from("#title", { opacity: 0, scale: 0.96, duration: 0.5 }, 14.2);
  // ✅ Robust
  tl.fromTo("#title",
    { opacity: 0, scale: 0.96 },
    { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
    14.2);
  ```
- **Status:** Caught 2026-04-25 on recut scene-4 closer. Promoted to project default. Detection via playwright screenshot at scene midpoint — if the expected element shows opacity:0 in `getComputedStyle`, suspect a stuck `from()`.

### ❌ Discretized GSAP `tl.set()` per particle frame bloats timeline + hangs studio iframe
- **Symptom:** Timeline has 2000+ children. Studio iframe loads but `body` never appears (`bodyExists: false`, only HEAD parsed). Comp works fine in headless playwright (smoke test passes) but studio shell hangs forever. User sees blank player.
- **Cause:** Sampling a continuous animation (e.g. sparkle pulse) by emitting one `tl.set(particle, {opacity, scale}, t)` per frame slot per particle scales O(particles × steps × duration). 50 particles × 30 steps × 5s = 1500 sets, multiplied by the rest of the timeline → 2250 GSAP children. The studio's iframe wrapper executes tweens eagerly and chokes; the render path is fine.
- **Fix:** Hand the per-frame sampling to CSS `@keyframes` instead. JS only sets the initial position + opacity + animation-delay (for phase offset) once. Total cost: 1 set per particle for position, 1 timeline.set to fade-in batch all particles, 1 to fade them out.
  ```js
  // ❌ Bloats timeline:
  for (let s = 0; s <= steps; s++) timeline.set(p, { opacity: ..., scale: ... }, t);
  // ✅ Hand to CSS:
  p.style.setProperty("--p-period", "1.6s");
  p.style.setProperty("--p-delay", `-${phase}s`);
  p.classList.add("glitter-particle--ambient");  // CSS: animation: glitter-pulse var(--p-period) ease-in-out infinite;
  ```
- **Budget:** Keep total timeline children under ~1000 for studio compatibility. Renderer can handle more.
- **Status:** Caught 2026-04-25. `glitterFx.ambient` was the offender — refactored to CSS animation, timeline went 2250 → 601, studio loads in <1s.

### ❌ Studio iframe can hang on hot-reload race or postMessage handshake stall
- **Symptom:** `iframeReady: "complete"` per `readyState` but `bodyExists: false`. Timeline never registers. Play button is unresponsive. Same comp loads fine via direct nav (`http://localhost:3002/api/projects/<name>/preview`) — only the studio's iframe wrapper is broken.
- **Cause(s):**
  1. **Hot-reload race** — saving multiple files in quick succession aborts in-flight iframe loads (`net::ERR_ABORTED`). Each save triggers a refetch. If saves happen faster than parse-time, the iframe never settles.
  2. **postMessage handshake stall** — runtime.js (loaded inside the iframe) waits for the parent shell to send `{type:"control", action:"play"}` etc. If the parent isn't responding (or the iframe is somehow detached from the parent's listener), runtime.js sits idle and the play button does nothing.
- **Fix workflow:**
  1. Pause editing, wait for the file system to settle (~3-5s).
  2. `npx hyperframes preview --kill-all` → restart, OR `preview_stop` + `preview_start` via the MCP if managed there.
  3. If still broken, **bypass the studio**: navigate to `http://localhost:3002/api/projects/<name>/preview?fresh=1`. The standalone autoplay guard makes the comp play. No play UI but it works.
- **Detection:** [scripts/smoke.mjs](scripts/smoke.mjs) bypasses the studio (uses direct nav), so it confirms the comp is healthy when smoke passes but the studio is broken.
- **Status:** Worked around 2026-04-25 via bypass URL + autoplay guard. Underlying studio bug worth filing upstream — `iframeReady: "complete"` should mean `body` is parsed.

### ❌ Don't use `taskkill //F //IM node.exe` to free a port — kills every Node process on the box
- **Symptom:** Killed 80+ Node processes including the user's other dev tools. User sees their tooling die mid-task.
- **Cause:** Wanted to free port 3002 so the MCP could rebind it; reached for a global `node.exe` kill. Massive collateral damage.
- **Fix:** Targeted kill only.
  - Find PID: `netstat -ano | findstr :3002` (Windows) or `lsof -i :3002` (Mac/Linux).
  - Kill PID: `taskkill //F //PID <pid>` or `kill -9 <pid>`.
  - For MCP-managed servers: `mcp__Claude_Preview__preview_stop({ serverId })`. For HyperFrames preview: `npx hyperframes preview --kill-all` (only kills HF-tracked servers).
- **Status:** Burned 2026-04-25. Hard rule going forward: never global-kill a runtime by name.

### ❌ Render crashes at 58% with `Page.captureScreenshot` protocol error on `-w 4`
- **Symptom:** `Worker 1: Protocol error (Page.captureScreenshot): Unable to capture screenshot; Worker 2: ...`. Capture fails around frame 600/810.
- **Cause:** Chrome worker memory pressure on this 16GB box when comp has >10 clips + video + ken-burns + many tweens.
- **Fix:** Drop workers. On wirihere's box, anything with 11+ clips + a video renders clean at `-w 2 --gpu`. Cost: ~12:40 vs would-be ~6:30 at `-w 4`.
- **Status:** Confirmed twice (Claim Mate v2, v3). Proven preset captured in playbook §3.

---

## 5. Free-tier quotas in this project

Centralised in `scripts/lib/usage.mjs`. Run `node scripts/lib/usage.mjs report` to see current usage with progress bars.

| Service              | Limit                       | Mechanism                |
| -------------------- | --------------------------- | ------------------------ |
| Iconify              | self-imposed 60/min         | public CDN, no real cap  |
| unDraw scrape        | 200/day self-imposed        | Playwright               |
| Pixabay scrape       | 1000/day, 200/hr, 20/min    | Playwright               |
| gTTS (Google trans.) | 1000 chunks/day             | aggressively rate-limited |
| StreamElements TTS   | 500/day                     | no published cap         |
| Edge TTS             | 2000/day self-imposed       | no published cap         |
| Unsplash             | 50/hr (demo) / 5000/hr prod | needs `UNSPLASH_ACCESS_KEY` |
| Pexels               | 200/hr, 20,000/month        | needs `PEXELS_API_KEY`     |
| ElevenLabs           | 10,000 chars/month          | needs `ELEVENLABS_API_KEY` |
| Freesound            | 60/min, 2000/day            | needs Freesound API key    |

Each fetcher calls `check()` before the request and `record()` after success. Approaching 80% of any window prints a warning; exceeding it refuses the call.

---

## 5.5 User preferences (standing directives)

> These are not patterns or anti-patterns — they are the user's explicit standing preferences. Future sessions should default to these without re-deriving them from first principles. Override only if the brief explicitly contradicts them.
>
> **Process note (2026-04-26):** the canonical workflow is now [docs/PROCESS.md](docs/PROCESS.md). It supersedes the breadth-first "spawn many parallel subagents" pattern that earlier directives in this section assumed. The directives below have been edited inline where they clashed with the new loop-until-perfect mode. The 18 durable user-feedback rules (in user memory under `~/.claude/projects/.../memory/`) are the canonical source for behaviour — this section is a project-local mirror.

### Hybrid composition — HTML overlays + real stock footage/photos (not one or the other)

The user prefers compositions that mix real-world visuals with HTML/CSS information layers:
- **Stock footage/photos** carry the human/emotional/real-world layer (stressed person, hands typing, phone in hand, workspace, exterior shot).
- **HTML/CSS overlays** carry information and brand cues (DENIED stamp, step cards 01/02/03, data reveals like "90 DAYS" / "$0", brandmarks, CTA wordmarks, legal strips).

The v5 "Ninety Days" composition confirmed this: neither pure-stock ("just a montage") nor pure-HTML ("motion-graphics explainer with no soul") — the blend is what landed. Default to this hybrid approach unless the brief explicitly calls for something else (e.g. "cinematic montage only" or "pure type-driven brand film").

**Rule of thumb:** every scene should have at least one real-world visual grounded in stock AND at least one HTML overlay carrying the information or brand cue. If a scene is all one or all the other, flag it as intentional or fix it.

### Commit regularly + in logical chunks (standing directive — 2026-04-26)
Don't let work pile up uncommitted across a long session. Drop a commit after each meaningful chunk — tooling pass, template batch, supervisor return, etc. — so the git history mirrors the increment log in §6. The 2026-04-25 streamline session went 12 supervisors + 92 file changes before the user asked for a commit; that's too late. Going forward:

- **After every meaningful chunk:** if `git status -s` shows >10 changed files, commit. If a single chunk delivers a coherent feature (a new script + its npm wiring + its LEARNINGS entry), commit just that.
- **Logical groupings:** tooling/scripts together, templates/modules together, compositions+docs together. Don't mix unrelated changes in one commit.
- **Before committing:** clean cruft (`*.backup-*`, debug screenshots, mid-session test scaffolds). Update `.gitignore` if a new class of throwaway file appeared.
- **Sign every commit** with the project's standing co-author trailer.
- **Don't push without asking** — committing locally is safe; pushing to GitHub needs the user's say-so.

The git log should read like a story: each commit a single beat. Future me reads `git log --oneline` and can reconstruct what happened.

### Always plan for long-term task completion + surface more as you go (standing directive — 2026-04-25)
The parking lot in §8 is the project's roadmap, not a wishlist. Every session, before responding "done", scan for new follow-ups the work just surfaced — bugs that need a §4 entry, automations that would have saved time, primitives one step away from useful. Add them to §8 with one-line context so they cross sessions without needing to be re-derived.

**Discipline:**
- After every meaningful chunk: pause, ask "what would be 10x easier next time, and what's standing in the way?". Capture both directions — the streamline wins AND the new ideas they surface.
- Don't archive an idea just because it's "later" — keep it in §8 with enough context that a cold reader can pick it up.
- When closing a parking-lot item, append a line under "Recently closed" with the npm command or file path that delivered it.
- When the user signals batch mode ("do all you can", "in parallel"), default to dispatching a fan-out across ALL open parking-lot items that fit available agent slots.
- §8 is now organised into Near-term / Mid-term / Long-term tiers — keeps it scannable and surfaces the highest-leverage next step.

The 2026-04-25 streamline pass closed 19 parking-lot items in one extended session AND surfaced 18+ new ones (composition versioning, render progress, animation lint, asset tracker, voice library, render farm, WCAG audit, telemetry, AI-assisted comp, etc.). Both directions matter — the lot grows even as it shrinks.

### Recursive supervisor agents (2026-04-26 — proven at scale)
For complex domains (URL→video pipeline, vertical-template library, effect-combination work), dispatch a **supervisor** agent that owns a charter end-to-end and is given explicit permission to spawn its own workers. The supervisor coordinates internally — main thread sees one self-contained result.

**Architecture:**
```
ME (vision + integration + final QA)
  └─ SUPERVISORS (own a domain end-to-end, may spawn workers)
       └─ WORKERS (focused tasks, return to supervisor)
```

**Verified 2026-04-26:** The streamline session dispatched 13 supervisors in parallel waves — 5 base (copy + assets + music + scaffolders + orchestrator), 6 verticals (e-commerce, trades, real estate, SaaS, hospitality, wellness), 1 effect combinator, plus a follow-up batch of 4 (README, lint sweep, baselines, music pre-fetch). Each shipped a coherent unit. Main thread did integration + QA only.

**How to brief a supervisor (vs a single-task worker):**
- Give a CHARTER, not a task ("you own X end-to-end" vs "do Y").
- List acceptance criteria + verification command.
- Explicitly grant spawning authority ("you may spawn sub-agents for...").
- Provide enough context that the supervisor can make judgment calls (template list, project conventions, existing primitives).
- Define failure modes ("if a worker returns sparse output, re-dispatch with...").

**File-conflict rule for fan-outs:**
- Each supervisor's deliverables should target NON-OVERLAPPING files (different scripts, different folders).
- `package.json` is shared — instruct each agent to add only its own npm script, never re-format the file.
- `index.html` is hot — supervisors that swap+restore must use try/finally; main thread restores from `archive/.queue-backup-*.html` if anything escapes.

The Effect Combinator was the deepest test: it ran a 7-phase internal pipeline (audit → plan → 3 implementor workers in parallel → demo → catalog → bundle → docs) and returned a single self-contained increment. The pattern scales.

### Always use as many subagents as possible (standing directive — 2026-04-25) — SUPERSEDED 2026-04-26
**Replaced by the loop-until-perfect process in [docs/PROCESS.md](docs/PROCESS.md).**

The "fan out as much as possible" pattern shipped a lot of infrastructure in 2026-04-25 → early 2026-04-26 (16 parallel subagents in three waves), but it produced shipped-but-mediocre rendered videos because no one stayed on a single piece long enough to make it model-quality. Replaced with the loop-until-perfect workflow in `docs/PROCESS.md`.

The text below is kept for historical context — the dispatching mechanics it describes are still correct *when* you're dispatching agents — but the "fan out for the sake of fanning out" defaulting is no longer the operating model.

**When to fan out (revised):**
- The work is genuinely independent (different files, no shared state, no sequential dependency).
- The result will be CONSUMED by the loop-until-perfect process, not shipped without review.
- Each task has a clear acceptance criterion (verifiable command output).

**How to brief them well:**
- Goal in one sentence + acceptance criteria + files to touch.
- "Don't break X" rules upfront.
- A verification command they should run before reporting done.
- Brief them like a smart colleague who hasn't seen this conversation — give context, don't push synthesis onto them.

**File conflict rule:** package.json edits across multiple agents work in practice (each agent does atomic read-edit-write) but be aware of races — instruct each to add only their own npm script, never re-format the whole file.

### Always be looking for more stack improvements (standing directive — 2026-04-25)
After every meaningful chunk of work, do a brief streamline pass: where did time get burned, what could become a one-liner, what could be deleted entirely. Surface promising ones proactively in the response, capture them in §8 parking lot so they cross sessions, and convert the highest-leverage ones into ship-now tasks.

The 2026-04-25 streamline pass landed 4 wins (local GSAP, module bundle, `.scene` responsive, `npm run new:comp`) plus 3 agent-fanned-out upgrades (visual regression, effects catalog, standalone preview). Each removed a category of papercut. The pattern is reproducible: every session that doesn't surface at least one improvement is leaving slack on the table.

**Where to hunt:**
- Repeated copy-paste boilerplate → make it a script.
- "I always forget to..." → make the smoke test catch it.
- "It works on my machine but..." → vendor the dep, drop the CDN.
- "I had to manually..." → CLI it.
- Manual checks that fail later → assert in `npm run check`.

### Music curation — ask user first, search second

The user prefers to supply the music URL themselves rather than delegating entirely to the music-supervisor agent. In v5, the user handed over `https://pixabay.com/music/adventure-inspirational-513432/` directly — it was right immediately, no iteration.

**Default flow:**
1. Ask the user "Do you have a music track in mind? If so, drop the URL." — before kicking off any music-supervisor search.
2. If yes → use `scripts/fetch-pixabay-music.mjs "<URL>" <out-name>` directly (direct-URL mode, see §3 "Pixabay fetchers — direct URL mode").
3. If no → fall through to the music-supervisor agent to search.

Don't treat music as a pure capability-agent task. The user has taste on music and wants to exercise it.

---

## 6. Increment log (chronological)

> Append a new entry at the **top** of this section after every meaningful chunk
> of work — a new feature, a bug fix, an asset library expansion, a render.
> Promote anything that bit you into §4. Leave the "next time" field even if
> small — the discipline is the value.

### Template (copy-paste)
```markdown
### YYYY-MM-DD · Short title
- **What:** one sentence describing what was attempted/built.
- **Outcome:** done / partial / blocked.
- **Worked:** what went smoothly first try.
- **Friction:** what cost time. Be specific (selector, error message, env quirk).
- **Next time:** the smallest thing future-you would do differently. May be a
  one-liner. Even "remember X exists" counts.
- **Promoted to §4 / §3?** yes / no — anything reusable should be lifted upward.
```

---

### 2026-04-26 · Combo-fx batch-2 — 6 combos + 2 primitives
- **What:** Shipped the second wave of `comboFx.*` recipes after a 25-template usage census revealed that 22/25 templates still wired 4-7 bare-primitive calls per scene that matched recurring named-moment patterns. Six new combos (`glitchStamp`, `pricePop`, `testimonialReveal`, `focusPull`, `statGroup`, `spotlight`) and two new effect-fx primitives (`rackFocus`, `radialMask`) that unblocked `focusPull` and `spotlight`. Plan + verdict in [docs/combo-fx-batch-2-plan.md](docs/combo-fx-batch-2-plan.md). `5 files changed, 1335 insertions(+), 3 deletions(-)`.
- **Outcome:** done — combo-fx-demo composition extended 10→16 scenes (one combo per ~3-second scene with label-chip), [docs/effects-catalog.html](docs/effects-catalog.html) regenerated via `npm run catalog`, lint clean.
- **Worked:**
  - **Census-driven prioritisation.** The combo with the highest adoption (`glitchStamp` — 9 templates / ~25 invocations) wasn't on the prior gap doc at all; it surfaced from grepping bare-primitive sequences across `compositions/templates/*.html`. The two highest-adoption combos in batch-2 (`glitchStamp` and `statGroup`, 7+ adopters each) both came from the census, not the gap doc. Lesson: when shipping a batch of combos, run the bare-primitive grep before drafting the candidate list — usage density beats armchair gap analysis.
  - **Primitive-first sequencing.** `rackFocus` and `radialMask` shipped before any combo that depended on them, so each combo could be developed against a working primitive instead of stubs. Took ~90 minutes for both primitives (close to the 30+60min plan estimate).
  - **CSS-variable bridge for `radialMask`** — same pattern as `cinemagraphRotate` (inject a `.fx-radial-mask { mask-image: radial-gradient(circle at var(--rm-cx) var(--rm-cy), transparent var(--rm-radius), black calc(...)); }` rule once on first call, then tween `--rm-radius` via `tl.fromTo`). Pinning the static positioning vars (`--rm-cx`, `--rm-cy`, `--rm-feather`) with `tl.set(...)` at `at` so overlapping calls on the same host don't fight each other.
  - **Auto-center for `spotlight`** — `opts.auto: true` reads target + host bounding rects and computes `centerX`/`centerY` as % of host. Lets templates spotlight an element without hand-measuring positions.
- **Friction:**
  - **Latent `pick()` bug found mid-batch.** Several existing combos called `pick(o, "duration", default)` — the helper returned the default even when `o.duration` was a number (truthy-check vs `!= null`). Caught when `pricePop` was passing `1.2` and the helper still applied the inner default `0.9`. Fixed inline (now `o[key] != null ? o[key] : default`); affects all sixteen combos so worth a regression sweep next render. Filing under §3 (pick-helper semantics).
  - **`statGroup` API requires `opts.stats` as an array of selectors** — early dev pass had it traverse `target.querySelectorAll(".stat-num")` automatically; reverted to explicit selectors so templates with mixed-purpose grids don't accidentally animate non-stat children. Console-warns with a clear message when missing.
- **Next time:**
  - **Run the bare-primitive grep before the next combo batch.** `grep -rE "textFx\.\w+\(|effectFx\.\w+\(|glitterFx\.\w+\(" compositions/templates/` partitions the call sites; group by 2-3-call windows to surface candidate combos. Use the gap doc as a sanity check, not a primary source.
  - **Smoke-test combos against 2 templates each before declaring done** — the plan's Day-3 step (retrofit the bare-primitive sequence to the combo call, render, diff) is the real validation. Skipping it means the combo "works" in the demo but might miss a quirk only real-template scenes hit. Park as a follow-up.
  - **When a combo depends on a new primitive, ship the primitive first** with a unit demo in `compositions/effect-fx-demo.html`. Saves the "is this combo bug or primitive bug?" question.
- **Promoted to §4 / §3?** Yes — §3 updated with the batch-2 combos table + the new `rackFocus` / `radialMask` primitives section. No new §4 pitfall (the `pick()` bug is fixed; documenting the option-default-helper semantics in §3 is enough).
- **Parking-lot updates:** see §8 "Recently closed (2026-04-26)" — combo-fx batch-2 closes the gap-doc / batch-2 work item; eight Tier-2/Tier-3 candidates from the gap doc explicitly deferred-with-reason.

---

### 2026-04-25 (late night) · Tech-stack streamline pass — 8 wins shipped (4 main + 3 agent-fanned + 1 follow-up)
- **What:** Massive streamline pass triggered by user direct ask "do all you can auto mode" + "use as many subagents as possible". Combined main-thread work with 3 parallel general-purpose agents touching non-overlapping files. Eight deliverables:

  **Main thread (sequential):**
  1. **Local GSAP** ([design/vendor/gsap.min.js](design/vendor/gsap.min.js)) — `npm install gsap` + copied to vendor dir. Replaces the CDN script tag in all 4 compositions. Network-free renders, no jsdelivr-flake at headless capture time.
  2. **Module bundle** ([design/modules/all.js](design/modules/all.js) + `all.css`) — single concatenation of `text-fx`/`effect-fx`/`glitter-fx`/`amp-bind`. Built by [scripts/build-bundle.mjs](scripts/build-bundle.mjs) (`npm run build:bundle`). Compositions now load **one CSS link + one script** in `<head>` instead of 4-6. Eliminates the "did I forget to load a module" bug class.
  3. **`.scene` responsive** — [design/cards.css](design/cards.css) `.scene` rule changed from hardcoded `width: 1080px; height: 1920px` to `width: 100%; height: 100%`. Scenes fill the parent `.comp` wrapper, which declares the actual dims. The §4 portrait-override pitfall is now structurally impossible.
  4. **`scripts/new-comp.mjs` scaffolder** — `npm run new:comp -- <url>` extracts brand palette + fonts + headlines from a URL, writes `design/tokens-<slug>.css` + a 14s 3-scene composition. Closes URL→video pipeline to one command.
  5. **`scripts/watch-bundle.mjs`** — `npm run watch:bundle` watches `design/modules/` + `scripts/lib/`, rebuilds bundle on save (200ms debounced, no chokidar dep). Removes the manual "did I rebuild?" step.

  **Agent-fanned (parallel, non-overlapping files):**
  6. **Visual regression in smoke test** ([scripts/smoke.mjs](scripts/smoke.mjs) extended) — `npm run smoke:diff` compares each scene screenshot against `smoke/.baseline/<id>.png`, fails if pixel delta > 2%. `npm run smoke:baseline` promotes current shots to baseline. Pure-JS pixel diff via canvas — no SSIM dep. Smoke now reports 18 passes with diffs (was 10).
  7. **Effects catalog page** ([scripts/build-catalog.mjs](scripts/build-catalog.mjs) + [docs/effects-catalog.html](docs/effects-catalog.html)) — `npm run catalog` renders each of the 13 module recipes at its peak timestamp, saves a 480×270 PNG to `docs/effects/`, generates a dark-mode browseable HTML index with thumbnail + recipe name + one-line API call. Visual reference instead of reading source.
  8. **Standalone preview page** ([design/preview.html](design/preview.html) + [scripts/preview.mjs](scripts/preview.mjs)) — `npm run preview:simple` spawns a zero-dep static server on `:3003`, opens browser to a vanilla iframe wrapper around `index.html` with play/pause/scrub/restart/reload UI. Bypasses the studio's flaky shadow-DOM iframe + postMessage handshake. Keyboard shortcuts: Space/R/←→/0.

- **Outcome:** done — `npm run check` reports 10 passes; `npm run smoke:diff` reports 18 passes (with visual regression); 13 effect thumbnails generated; standalone preview verified via playwright (timeline advances under play, scrubs accurately).
- **Worked:**
  - **Module bundle generator** is just `fs.readFileSync` + concat — no bundler, no transforms. The IIFE structure of each source preserves through concatenation; globals stay exposed exactly as before. Promoted to §3.
  - **Brand extraction via curl + RegExp** is good enough for prototypes — frequency-rank hex colors, scan `--*-color` / `--*-bg` / `--brand-*` custom properties, capture `@import` font URLs and `<title>`/`<h1>` for copy. The generated `tokens-<slug>.css` is a starting point, hand-tunable, not a final deliverable. Promoted to §3.
  - **Scaffolder writes a 3-scene 14s default** that already exercises text-fx (cascade + stagger), effect-fx (inkBleed), glitter-fx (ambient), and the autoplay guard. The user gets a working preview in one command with placeholder copy to overwrite. The structure is correct from minute zero, freeing the user to focus on copy + visuals not wiring.
  - **Subagent fan-out for streamlines** worked — visual regression layer, effects catalog generator, and standalone preview page were all dispatched as independent parallel agents because they touched non-overlapping files (smoke.mjs ext, scripts/build-catalog.mjs new, design/preview.html new). Each agent returned a self-contained increment.
- **Friction:**
  - **`package.json` is shared across all three agents** — visual-regression / catalog / preview each want to add an npm script. Mitigated by serial coordination in main thread, but in future fan-outs ensure agents either (a) write a small JSON patch file that main-thread merges, OR (b) each appends to a different config section that doesn't conflict. Filing as a sub-pattern under "parallel agents".
  - **Cards.css portrait default mis-sized landscape comps** for many sessions before being caught by playwright inspection. Lesson: sentinel rules (`width: 1920px` literally in a project-wide stylesheet) age badly when the project's intended canvas changes. Default to `100%`+ wrapper-driven sizing for anything that can be repurposed.
- **Next time:**
  - **Run `npm run build:bundle` after editing any module source.** The bundle is regenerated, not auto-tracked. Could add a chokidar watcher if it becomes painful.
  - **Use `npm run new:comp -- <url>` for any new brand.** Cuts the "set up tokens + comp" busywork to one command. Hand-tune the generated tokens-<brand>.css (palette extraction is heuristic, not perfect).
  - **Subagent fan-out for streamline batches** — independent file targets means parallel speedup. Brief each agent like a smart colleague: goal, files-to-touch, acceptance criteria, verification command. Don't share package.json edits across agents.
- **Promoted to §4 / §3?** Yes — 4 new §3 patterns (local GSAP via npm + vendor, module bundle generator, brand extraction one-command via curl + Grep, agent fan-out for parallel streamline work).
- **Parking-lot updates:** "Module bundle file" CLOSED. "Brand auto-extract → tokens-<brand>.css one-command" CLOSED. ".scene responsive" wasn't on the list but is now structural.

---

### 2026-04-25 (night) · Templates × modules + playwright smoke test — system makes glitter explosions in 1s, catches the studio bugs that used to cost a render
- **What:** Built the next layer on top of the integration pass: a **two-axis composition system** (one base template per video × any number of scene-level modules) plus a **playwright pre-render smoke test** that catches every runtime bug we hit by hand in <1s. Concrete deliverables:
  1. **4 base templates** ([design/templates/](design/templates/)) — `warm-community.css`, `kinetic-pop.css`, `documentary.css`, `quiet-premium.css`. Each defines pacing tokens (`--pace-fast/mid/slow`), motion easing (`--ease-in/out/inout`), type scale (display weight/size/tracking/leading), shadow vibe, and a recommended LUT for the post-grade pass. Pick ONE per video.
  2. **6 text recipes** ([design/modules/text-fx.js](design/modules/text-fx.js) + `.css`) — `explode`, `stamp`, `cascade`, `stagger`, `typeOn`, `counter`. Each is one-line GSAP-timeline integration: `textFx.cascade(tl, "#title", { at: 0.4, stagger: 0.08 })`. All deterministic (seeded mulberry32, no `Math.random`).
  3. **4 effect recipes** ([design/modules/effect-fx.js](design/modules/effect-fx.js)) — `multiplaneDolly`, `inkBleed`, `glitchBurst`, `cinemagraphRotate`. Same API shape as text-fx so they're swap-friendly.
  4. **3 particle recipes** ([design/modules/glitter-fx.js](design/modules/glitter-fx.js) + `.css`) — `burst` (radial explosion), `fall` (continuous gentle), `ambient` (in-place pulse via CSS animation, not GSAP — see §3 "CSS animation budget"). Container CSS vars `--glitter-tint-1..4` pick brand-matching palette; cross-shaped + radial-dot variants for visual variety.
  5. **[scripts/smoke.mjs](scripts/smoke.mjs)** + npm scripts — playwright-driven pre-render smoke test. `npm run check` (lint + smoke) runs in **0.9-3.2s** and catches: `</script>` in JS comments breaking inline bundles, missing module globals, dimension override mismatches, empty timelines from script errors, console errors at load. Optional `--screenshots` saves PNG of each scene midpoint to `smoke/`. New scripts: `smoke`, `smoke:shots`, `preview`, `lint`, `render`, `check`.
  6. **Index.html re-cut** — applied warm-community + Kindred tokens + every new module. 4 scenes (kitchen-table multiplane → wordmark with cinemagraph + ambient sparkle + ink-bleed → three-up GIVE/ASK/SUPPORT with stagger → "Just local" closer with glitter explosion + double glitch). 18s @ 1920×1080. Lint 0/0, smoke 9 passed.
- **Outcome:** done — system is validated end-to-end. User can drop a brand+template+modules into `index.html`, run `npm run check`, render. Previous Kindred (production-Q) archived to `archive/index-v13-pre-recut-preview.html`.
- **Worked:**
  - **Playwright as the iteration loop** — taking screenshots at seeked timestamps lets you eyeball animations without rendering. The whole "edit → smoke (1s) → render only when confirmed" cycle replaces "edit → render (5min) → discover bug → repeat". Promoted to §3.
  - **Templates × modules separation** — when the user asked "can you combine templates", the right answer wasn't "load two templates" (palette/typography clash) but "templates set vibe, modules ship per-scene effects, mix modules freely under one template". Promoted to §3.
  - **Seeded PRNG for particles** — `mulberry32(seed)` produces identical scatter patterns across renders. Critical for deterministic frame capture. Same PRNG used in text-fx.explode and glitter-fx.{burst,fall,ambient}. Promoted to §3.
  - **CSS animation for repetitive pulses** — first ambient pulse impl used `tl.set(particle, {opacity, scale}, t)` per discretization step (50 particles × 30 steps × 5s = 1500 set calls). Loaded fine in headless smoke but hung the studio iframe (timeline of 2250 children took too long to instantiate). Refactored ambient to set initial position via JS, hand the pulse to a CSS `@keyframes` driven by `--p-period` and negative `--p-delay`. **Tween count: 2250 → 601** (-73%). The renderer evaluates CSS animations at frame time, so it stays deterministic. Promoted to §3.
  - **Pseudo-element transforms via CSS variable bridge** — `::before` can't be tweened directly by GSAP, but it CAN read CSS custom properties from its host. So in `effectFx.cinemagraphRotate`: inject `.fx-cinemagraph-bg::before { transform: rotate(var(--cg-rotation)); }` once on first call, then `tl.fromTo(host, {"--cg-rotation": "0deg"}, {"--cg-rotation": "360deg", duration})`. Promoted to §3.
  - **Standalone autoplay guard** — `if (window === window.top) setTimeout(() => tl.play(0), 250)` lets the same comp play in a directly-loaded browser tab while staying paused under the studio iframe / renderer (which drive seek themselves via postMessage). Promoted to §3.
- **Friction (each promoted to §4):**
  - **`</script>` in JS comments breaks inline-bundled scripts.** Studio inlines local `.js` files into `<script>...</script>` blocks. The HTML parser ends the script element at any literal `</script>` — even one inside a JS line comment (`//   <script src="..."></script>`). Caused `textFx`/`effectFx` to never reach `window`, leaving the timeline empty, leaving the play button doing nothing. Fix: write `<\/script>` in the JS comments. The backslash is ignored by HTML parser tokenization but is just a stray char in JS strings — works in both contexts.
  - **`cards.css` forces `.scene` to 1080×1920 portrait.** Cards.css was authored for vertical 9:16 social videos. Landscape 16:9 comps need an explicit `width: 1920px; height: 1080px` override on `.scene` in the inline `<style>`, otherwise content layouts in 1080×1920 even though the comp is 1920×1080.
  - **GSAP `tl.from()` gets stuck at the "from" state on paused/seek timelines.** With `immediateRender: true` (default), the from values are applied at script load. When the timeline is later seeked, the natural state captured for tween-end can equal the from state, so the tween animates 0→0. Fix: use `tl.fromTo(target, {fromState}, {toState, duration}, at)` with explicit start AND end values. This is now the project default for any opacity/scale entry tween.
  - **Timeline tween budget — keep under ~1000.** 2250 tweens hung the studio iframe load. 601 tweens loads in <1s. The renderer itself is fine with thousands; the studio's eager script execution is what suffers. Use CSS animations for repetitive pulse/spin/sparkle and reserve GSAP for state changes.
  - **Studio iframe can hang on hot-reload race.** Saving multiple files in quick succession aborts in-flight iframe loads. Symptoms: `iframeReady: "complete"` but `bodyExists: false`, only HEAD parsed. Fix: `npx hyperframes preview --kill-all` then restart, OR bypass the studio entirely by navigating directly to `http://localhost:3002/api/projects/<name>/preview?fresh=1`. The standalone autoplay guard makes the bypass URL playable.
  - **Don't kill all `node.exe` processes.** I ran `taskkill //F //IM node.exe` to clear port 3002 — it killed every Node process on the box, including the user's other tools. Use targeted kills (`netstat -ano | findstr :3002` then `taskkill /PID <pid>`) or the MCP `preview_stop` for managed servers.
- **Next time:**
  - **Run `npm run check` after every edit.** 1s pre-render check is cheap insurance against runtime bugs that lint can't see.
  - **For new compositions:** scaffold from a base template + tokens-<brand>.css, then add modules per scene. Don't author scene CSS from scratch unless the modules genuinely don't fit.
  - **For animations of repetitive things (sparkle, pulse, spin loops):** start with CSS `@keyframes`, only fall through to GSAP if the timing must be timeline-relative.
  - **Document the bypass URL** — when the studio iframe inevitably hangs, the user needs a path forward that doesn't require restarting infra. The bypass URL + autoplay guard is now that path.
- **Promoted to §4 / §3?** Yes — 7 new §3 patterns, 6 new §4 pitfalls, 4 new tooling entries.
- **Parking-lot updates:** "Per-scene LUT overlay scaffold" still open. "Render-time watermark overlay" still open. "Pre-render visual smoke test" CLOSED (= `npm run smoke`). Added: "Studio iframe robustness — investigate why same comp loads via direct nav but hangs in iframe wrapper".

---

### 2026-04-25 (late evening) · Integration pass — primitives wired into the default flow so future videos use them by default
- **What:** The previous pass shipped 4 standalone primitives (LUT post-grade, SFX library, audio-reactive bake, effects-batch-08.css). User asked: "will full videos actually USE these most of the time?" Honest answer: only the LUT would, the rest were "things you can do" not "things you do." Fixed by wiring them into the default surface area:
  1. **[scripts/render.mjs](scripts/render.mjs)** — new go-to render command. Bundles `hyperframes render` → auto post-grade with `pop` LUT default. Detects new MP4 by diffing `renders/` before/after. Flags: `--lut=name` (default `pop`), `--strength=0..1`, `--no-grade`, `--replace`. Pass-through args via `--`: `node scripts/render.mjs -- --gpu -w 4`. From now on, every shipped MP4 ships graded unless explicitly opted out.
  2. **[design/cards.css](design/cards.css) scene scaffolds** — added `.scene` / `.scene__bg` / `.scene__stage` / `.scene__overlay` / `.scene__sfx` slots, `.scene--multiplane` modifier with `perspective: 1500px` + `preserve-3d`, and SFX wiring recipes per card type (stat-reveal, feature-row, quote, end-card) as commented templates. Standardised: SFX track-index = 3, volume 0.30-0.50. Multiplane + sound-design now copy-paste, not re-invent-per-scene.
  3. **[scripts/lib/amp-bind.js](scripts/lib/amp-bind.js)** — browser-loadable helper that converts the baked amp envelope JSON into deterministic `tl.set` keyframes setting `--amp-bass`/`--amp-mid`/`--amp-high` CSS vars on a target. `<script src="scripts/lib/amp-bind.js">` exposes `window.ampBind(timeline, ampJson, target, opts)`. Options: channel mapping, `stride` (skip frames for long clips), `smooth` (EMA), `gate` (kill floor noise), `offset` (delay onto timeline), `scale`. Closes the loop from `scripts/extract-amp.mjs` → composition.
- **Outcome:** done — primitives are now in the path of "make a video", not in a "things to consider" list. Lint clean, no regressions on the prior render flow (raw `hyperframes render` still works directly).
- **Worked:**
  - **Naming the integration pass as a separate task** instead of folding it into the deep-research pass let us be honest about which primitives were and weren't getting used. The "ships in the default flow" bar is what actually matters — anything below it is a research artefact.
  - **`shell: true` for spawning `npx hyperframes render`** is required on Windows (npx is `npx.cmd`). Without it: `ENOENT`. Same pattern used in [scripts/render.mjs](scripts/render.mjs) for the `node scripts/post-grade.mjs` chained step.
  - **Diffing `renders/` before/after** to find the just-rendered MP4 sidesteps having to parse `hyperframes render` stdout for the output filename. Robust to log format changes.
  - **`<audio>` elements have no layout impact** — the `.scene__sfx { display: none }` slot is documentation/intent only. The actual mixing happens via HyperFrames' `data-track-index` audio bus. Means SFX wiring is purely declarative inside the scene HTML.
  - **`ampBind()` deferring to GSAP for timeline mutation** instead of building its own keyframe array means the helper inherits whatever timeline behavior is configured (paused/auto-played, `defaults`, etc.) and stays trivially debuggable in the studio editor.
- **Friction:**
  - None worth promoting — wiring was straightforward once primitives existed. The hard work was upstream (Windows path escaping, astats sample-rate mismatch — both already in §4 / §3).
- **Next time:**
  - When a feature lands, ask "is this in the default flow?" before declaring done. Primitives that need 5 lines of integration to be useful are 5 lines short of being useful.
  - The next under-used lever is **per-scene LUT overlays** (`.fx-grade-*` from effects-batch-08.css) for moments where the global post-grade is wrong (e.g., one warm-tone testimonial scene inside a cool-grade comp). Worth scaffolding into cards.css if it comes up twice.
  - Consider a `node scripts/render.mjs --preview` mode that renders, grades, and opens the result — closes the iteration loop further.
- **Promoted to §4 / §3?** Yes:
  - §3 updated: "Cinematic post-pass" now references `scripts/render.mjs` as the default; "Audio-reactive visuals" now references `ampBind()`; new "Scene scaffold — multiplane stage + SFX track slot per scene" pattern.
  - §4: nothing new — Windows ffmpeg path pitfall already documented from prior pass.
- **Parking-lot updates:** "Audio-reactive visuals integration" closed (was implicit in "things to try next" — now in the default surface). "Render-time watermark overlay" still open. "Per-scene LUT overlay scaffold" added.

---

### 2026-04-25 (evening) · Deep-research pass on "best videos from our effects" — 5 cinematic primitives shipped
- **What:** User asked "deep research into how we make the best videos from the effects we have, think outside the box — including alternative tech stacks." Spawned 4 parallel research agents (current-effects inventory, best-in-class motion-design 2025-26, alternative tech stacks, specific high-impact techniques). Synthesised findings and shipped 5 production-value primitives:
  1. [design/effects-batch-08.css](design/effects-batch-08.css) — multiplane camera (`.fx-multiplane` + `.plane-{bg,far,mid,base,near,fg}` with `transform-style:preserve-3d` and depth-of-field via `data-focus`), SVG `feDisplacementMap` filters (`#fx-liquid`, `#fx-ink`, `#fx-ripple`, `#fx-glass`), chromatic-aberration glitch (`#fx-rgb-shift` + `.fx-scanlines` + `.fx-vhs-jitter` step-eased), four LUT-style overlays (`.fx-grade-{teal-orange,warm,cool,noir}` + `.fx-grade-{pop,soft}` filter passes), conic-blob cinemagraph background (`.fx-cinemagraph-bg` with `backdrop-filter:blur` frosted glass), long-shadow text extrusion, audio-reactive bindings via CSS custom properties.
  2. [scripts/post-grade.mjs](scripts/post-grade.mjs) — final-pass color grade. Bakes 17×17×17 .cube LUTs procedurally (no external assets), six built-ins (`teal-orange`, `noir`, `warm`, `cool`, `pop`, `vintage`), `--strength` blend control, `--lut=path/to/custom.cube` for external grades. Verified: `node scripts/post-grade.mjs renders/foo.mp4 --lut=teal-orange` produces `renders/foo-graded.mp4`.
  3. [scripts/gen-sfx.mjs](scripts/gen-sfx.mjs) — procedural sound-design library. 12 ffmpeg-synthesized presets (whoosh-up/down/soft, tick, tick-soft, impact, impact-deep, ding, sweep-rise, sweep-fall, pad-warm, pad-cool) using `lavfi` audio sources (sine, anoisesrc) + bandpass + tremolo + aecho. No npm deps. Verified: full library generates in <2s, 12 .wav files in [assets/sfx/](assets/sfx/).
  4. [scripts/extract-amp.mjs](scripts/extract-amp.mjs) — bakes RMS amplitude envelope JSON for audio-reactive visuals. Runs ffmpeg `astats` per band (bass 20-250Hz / mid 250-4000Hz / high 4-16kHz), normalises, resamples to exact `fps × duration` slot count via linear interpolation. Verified on `claim-mate-v2.mp3`: 807 frames @ 30fps, 17.9 KB JSON, peak normalised to 1.0.
  5. Research synthesis stored in conversation. Top tech-stack additions (not yet wired): **Rive** (state-machine character animation embeddable as `<canvas>` driven from GSAP), **Veo 3 / Kling 3** (AI b-roll via API for shots we can't author), **Cavalry** (newly free as of April 2026 Canva acquisition — procedural data-driven design exported as transparent video).
- **Outcome:** done — 1 effects batch CSS + 3 pipeline scripts + dependency-free SFX library, all verified working on Windows. No render attempted (effects are unused in the current `index.html` until pulled in by a composition).
- **Worked:**
  - **4 parallel research agents** (Explore + 3 general-purpose) returned ~5000 words of grounded, source-cited findings in a single round. Sharper than serial probing would have been. Promoted: "for open-ended R&D questions, fan out 3-4 angle-specific research agents in parallel rather than driving exploration sequentially in main context."
  - **ffmpeg `lavfi` for procedural SFX** is a complete substitute for Tone.js — every primitive (sine, noise, bandpass, tremolo, echo, fade) needed for whoosh/tick/impact/pad is built-in. No npm install, deterministic output, runs in <2s. Promoted to §3.
  - **3D LUTs as a final pass** are the cheapest cinematic lift available. 17³ = 4913 entries is small enough to bake at runtime (~5 KB .cube file). The teal-orange grade is the single highest-impact one-line change to a render.
  - **astats per-band amplitude extraction** sidesteps the determinism trap of Web Audio's runtime AnalyserNode — bake the envelope offline, drive CSS vars from JSON at render-time keyframes. Three log bands (bass/mid/high) is enough for almost any audio-reactive use; full FFT is overkill.
- **Friction:**
  - **ffmpeg filter parser breaks on Windows `C:\` absolute paths** in `ametadata=file=...` and `lut3d=...` because `:` is a filter-arg separator. Tried backslash escape (`C\:/...`) — also fails. Fix: chdir spawn to a base directory and pass colon-free relative paths. Both `extract-amp.mjs` and `post-grade.mjs` use this pattern (`spawn(... { cwd: ... })` + `path.relative()`). **Promoting to §4.**
  - **`astats` does not emit one window per `reset` second** in practice — emission frequency is decoder-buffer-dependent (24kHz mp3 produced ~41 samples/sec for `reset=0.0333`). Fix: linear-interpolate to exact `fps × duration` slots. **Promoting to §3 as a recipe.**
- **Next time:**
  - When wiring Rive: use Remotion's `<RemotionRiveCanvas>` source as the reference pattern — it's the proven approach for headless capture of Rive runtime canvases.
  - When wiring AI b-roll: Veo 3 via Vertex AI / Replicate has the cleanest API in April 2026 (Sora was shut down March 2026). Treat AI clips as ≤3s accent shots only — longer reveals AI artefacts. Always pass through the same LUT grade as the rest of the comp to unify the look.
  - **Sound design is the single biggest underused production-value lever.** Future renders should include at least: 1 whoosh per scene transition, 1 tick on each stat reveal, 1 impact on the logo/wordmark land, 1 pad bed under quiet narration. The library is now in place — use it.
- **Promoted to §4 / §3?** Yes:
  - §3: ffmpeg lavfi for procedural SFX, 3D LUT post-pass via `lut3d`, offline-baked amplitude JSON for audio-reactive visuals, parallel research-agent fan-out for R&D questions.
  - §4: ffmpeg filter parser breaks on Windows drive-letter colons (use cwd + relative paths), astats emission frequency is decoder-bound (downsample to target).
- **Parking-lot updates:** "Audio-reactive visuals" moved out of §8 — primitive shipped. "Render-time watermark overlay" still open. "Asset cache layer" still open (but `assets/.cache/luts/` is now precedent for content-addressed cache directories).

---

### 2026-04-25 (afternoon) · Website-to-Video method built out: stacks, cards, effects, Claude Design integration, 600-effect bundle landed
- **What:** Massive session that turned the Kindred PoC into a full **Website-to-Video method** with reusable templates as the goal. Concrete deliverables:
  1. **Stacks playbook** ([docs/playbooks/stacks.md](docs/playbooks/stacks.md)) — 4 coordinated stacks (Warm Community / Kinetic Pop / Documentary / Quiet Premium), each pre-defining transitions + atmospheric layers + music + copy tone + TTS voice + pacing. Solves the "whip + cinematic strings + corporate copy = clash" problem.
  2. **Cards library** ([docs/playbooks/cards-library.md](docs/playbooks/cards-library.md)) — 5 cards shipped on Kindred (Persistent Brand Header, 3-Up Feature with Lucide icons, Per-Letter Wordmark Reveal, Kinetic Proof + Phone Frame + Notification Ping, CTA with Glow Pulse + URL Underline). Replaced earlier emoji-icon rows with brand-agnostic SVG line-icons.
  3. **Music shortlists** ([docs/playbooks/music-shortlists.md](docs/playbooks/music-shortlists.md)) — per-stack curated track lists (4 fetched for Warm Community batch).
  4. **Atmospheric polish playbook** ([docs/playbooks/atmospheric-polish.md](docs/playbooks/atmospheric-polish.md)) — vignette + film grain + particles + paper-grain drift + light beam + camera push-in. Generic discovery loops auto-apply via `[data-particles]` / `data-scene-mode` / `.paper-grain` selectors — drop-in for any composition.
  5. **Transitions playbook** ([docs/playbooks/transitions.md](docs/playbooks/transitions.md)) — soft cross-dissolve, color wash, whip+whoosh, match cut. Each with energy fit per stack.
  6. **394 ready-to-paste briefs** ([docs/playbooks/claude-design-card-briefs.md](docs/playbooks/claude-design-card-briefs.md)) — transitions T01-T08, effects E01-E240, cards BRIEF 01-146. Each is a tight prompt-block to send to Claude Design.
  7. **Claude Design integration** — workflow doc, contract spec, brand-neutral upload bundle (`claude-design-upload/`). Sent the full library brief; got back a handoff bundle with **600 effects across 15 batches + 4 designed cards** (`docs/design-bundles/consentmate/`). 5 effects + 1 card already integrated into the Kindred render.
  8. **Git repo created and pushed** — `https://github.com/wirihere/aivideomaker` (private). 310 files in initial commit; large binaries (renders, music, videos) gitignored.
  9. **Multiple Kindred render iterations** — went from baseline (lint 0/0 with 5 atmospheric layers) → stacks-aligned removing whips → minimalist text (no kickers, narration-supporting only) → highlighted-list pattern → strike-through pattern → zoom transitions → bigger typography → with Phone-In-Hand from Claude Design + concentric pulse + soft em-glow. Latest: [renders/aivideomaker_2026-04-25_17-58-49.mp4](renders/aivideomaker_2026-04-25_17-58-49.mp4) · 9.0 MB · 29.5s · lint clean.
- **Outcome:** done — pipeline operates end-to-end. Method is defensibly brand-agnostic. Claude Design loop works. Kindred render is polished.
- **Worked:**
  - **Stacks-as-coherent-units** — picking a stack first then deriving everything from it eliminated the "feels off" that comes from mixing-and-matching (e.g., whip transitions + warm-community brand). User flagged whips on Kindred mid-session; removing them and going all-soft-cross fixed the dissonance immediately. Promoted to §3 as the "stack as constraint" pattern.
  - **Brand-neutral upload bundle** — first attempt at Claude Design was flagged for brand-recreation policy because every file referenced "Kindred" / "kindred-nz.org". Stripped all brand mentions (`Kindred → Brand X`, copy verbatims → `[Tone bites]` placeholders, dropped `DESIGN.md` + `index.html` from the upload). Replaced `tokens-kindred.css` with neutral `tokens-example.css`. Claude Design accepted the cleaned bundle immediately. Lesson: **design-system bundles should ship token-shape + contract, not brand instances**. Promoted to §3 + new §4 pitfall.
  - **Handoff bundle = bulk transfer** — Claude Design's "share with Claude Code" produced a 508 KB gzip tar containing 600 effects + 4 cards + chat transcripts in one shot. Way more efficient than chat-pasting summaries. Saved at `docs/design-bundles/consentmate/`. Lesson: when Claude Design offers handoff, use it; don't ask for chat-paste.
  - **Token contract is real** — every card from Claude Design's batch-01-cards.html dropped into our codebase via `var(--card-*)` substitution. The contract (defined in `claude-design-card-workflow.md`) was honoured and the integration was minutes, not hours. Validates the brand-agnostic-by-construction approach.
  - **Kindred-as-template emerged naturally** — by the end, the user reframed the work as building a TEMPLATE library for future business videos. The Kindred render is now the first instance of "Template 01: Community App", with the structure ready to extract into `templates/community-app/`.
- **Friction:**
  - **Kindred stripping was painful** — multiple sed passes to remove all literal Kindred references from playbooks (4801-line briefs file alone had 14+ specific copy mentions). Should have authored playbooks brand-neutral from the start. Promoted to §3.
  - **`background-clip: text` broke inline word-wrap** — chromatic shimmer on Scene 1 italic em caused "useful things" to overflow the canvas. The browser treats inline + background-clip:text as inline-block, blocks the natural space-break. Reverted to text-shadow glow. Promoted to §4.
  - **Claude Design pushed back on prescriptive workflows** — first attempt was a maximalist "READY → 394 briefs" auto-march prompt. Claude Design refused (legitimately) — too prescriptive, brand-specific. Lesson: brief Claude Design like a designer, not a queue worker. Promoted to §3.
  - **`.fx-concentric-pulse` had hardcoded 1080×1080 dimensions** — pulse rings centered at top-third of scene instead of canvas centre. Override `width:100%; height:100%` inline solved it. Lesson: ported effects from Claude Design need dimension-fit checks against scene size.
  - **Render time inflated 1m → 5m** when adding atmospheric layers (particles, light beam, push-ins). Worth it for finished renders; consider toggling layers off during iteration. Promoted to §3.
- **Next time:**
  - **Author playbooks brand-neutral from the start** — use `[Brand]` / `[Tagline]` / `var(--card-*)` from day 1; only the per-render `index.html` and `tokens-<brand>.css` should hold brand-specific content.
  - **For Claude Design pivots in same session, request handoff bundle FIRST before context fills up** — old batches get snipped from working memory; lock specs in via the share button, then continue.
  - **Skip surgical effect integration** — when the user says "make it amazing", they mean visible quantity, not subtle quality. Integrate 5-8 effects in one pass; the bundle has hundreds, use them.
  - **For new brands, stack-pick before extraction** — gut-call which of the 4 stacks fits, then extract brand into the matching template. Saves backtracking.
  - **For high-earning vertical templates, prioritize: real estate listings → DTC product hero → SaaS landing-page hero** (per-video revenue ranking established this session).
- **Promoted to §4 / §3?** Yes — 4 new §3 patterns (stacks-as-coherent-units, brand-neutral bundles for design tools, handoff-bundle-as-bulk-transfer, brand-neutral playbook authoring), 3 new §4 pitfalls (background-clip:text breaks word-wrap, prescriptive prompts to Claude Design get refused, ported effects need dimension-fit checks).

### 2026-04-25 · URL→video pipeline PoC (Kindred), agent framework removed, R&D plan for brand-agnostic template library
- **What:** Three threads in one session.
  1. **R&D plan** for a brand-agnostic HyperFrames template library: agnostic-by-construction tokens, brand extractor (URL → palette/fonts/copy/imagery), media-in-cards as first-class slot, end-to-end URL→video pipeline. Captured at [docs/rd/html-template-library.md](docs/rd/html-template-library.md). Iterated through 4 user pivots (agnostic → adaptable → media → end-to-end).
  2. **End-to-end PoC** to test the pipeline on a real public site: `kindred-nz.org` (Kindred — community-app NZ). Cold-pitch scenario, no internal access. Extracted full brand (palette `--teal #1A9E8F`, `--cream #FBF9F6`, `--ink #1B2A3D`, etc., Fraunces+Nunito+JetBrains Mono fonts, verbatim hero/tagline/three-actions copy), pulled icon and app screenshot, generated 29.088s en-NZ-MollyNeural narration with VTT, built 5-scene 1080×1920 vertical comp, rendered to `renders/aivideomaker_2026-04-24_11-53-53.mp4` (2.8 MB · 29.5s). Created [DESIGN.md](DESIGN.md) and [design/tokens-kindred.css](design/tokens-kindred.css) as the brand-overlay layer on top of [design/cards.css](design/cards.css). Old composition archived to [archive/index-v11-claim-mate-v5.html](archive/index-v11-claim-mate-v5.html).
  3. **Agent framework removed.** User decided the crew-chain overhead wasn't worth it. Deleted all 16 agents under `.claude/agents/`. Saved cross-session memory `project_no_agent_framework.md`. §7 of this file is now archival — leave as-is per memory directive but don't dispatch.
- **Outcome:** done — Kindred promo rendered clean (lint 0/0, contrast warnings all confirmed false-positives from inactive-scene sampling). R&D plan landed. Framework deleted. Scope memory saved (`project_scope_claude_code_only.md`) — this whole pipeline is a Claude-Code-internal capability, not a productionised tool.
- **Worked:**
  - **Brand extraction via `curl + Grep`** beat WebFetch for getting the actual CSS values. WebFetch returned a textual summary that abstracted away `--var-name` values; raw HTML grep for `--[a-z][a-z-]+:`, `font-family:`, and `@import` surfaced the entire token system in seconds. Promoted to §3.
  - **Two-file token system** ([design/cards.css](design/cards.css) + [design/tokens-kindred.css](design/tokens-kindred.css)) — base file owns structural tokens (radii, padding, type sizes, shadows), brand overlay re-tints `:root` palette + fonts + re-skins surface variants (`.card--dark-glass`, `.card--brand-navy`). Swapping brands = swap one file. Promoted to §3.
  - **TTS-first sizing** — generated narration before composition, measured 29.088s, sized scenes to it (29.5s) instead of to a script word-count budget. Scene-3 row entrances at 8.05s/10.4s/12.95s cued to VTT word-times for "Give...", "Ask...", "Find...". Zero drift.
  - **Lint warnings clean-up loop** caught: root composition missing `data-start`/`data-duration`, overlapping GSAP tweens on `#s1-title` (entrance 0.45–1.30s vs drift starting 1.0s — staggered drift to 1.35s), duplicate `<img src=kindred-icon.png>` across scenes 2 and 5 (replaced scene 5's icon with a kicker line — already a known §4 pitfall, confirmed re-bite).
- **Friction:**
  - **Domain-guessing rabbit hole.** `kimdred.org.nz`, `kindred.nz.org`, `kindered-nz.org` all bounced before user copy-pasted `kindred-nz.org`. Cost ~5 min of WebSearch + WebFetch noise. Lesson: when a domain guess fails twice, ask for the URL — don't keep iterating.
  - **WebFetch summarised away the brand tokens** — the model abstracts to text and drops `--var-name: #hex` lines that don't read as "content". Switched to `curl <url> > raw.html` + Grep, found the full palette in 30s.
  - **HyperFrames `validate` contrast tool returns false-positives for hidden inactive-scene elements.** 32 → 29 warnings after fixes; the remaining 29 all sample elements that are not visible at the test timestamp (clip system has hidden them but the validator picks up CSS color and a "current" background, often producing `null:1` or 1:1 ratios). Real failures appear with actual ratio numbers AND when the element is in an active scene. Need to triage the report by cross-referencing element scene vs sample timestamp. Promoted to §4.
  - **HyperFrames compiler doesn't resolve `var(--card-font-display)`** for deterministic font embedding — warns "No deterministic font mapping". Google Fonts `@import` in [design/tokens-kindred.css](design/tokens-kindred.css) loads over network at render time, so the one-off render works but reproducibility is network-dependent. For offline-deterministic renders, use direct font names in `font-family:` (Nunito, JetBrains Mono are mapped; Fraunces is not). Promoted to §4.
  - **WCAG kicker-color trap.** `--card-accent` (#1A9E8F teal) on `--card-paper` (#FBF9F6 cream) measures **2.9:1** — just under AA's 3:1 large-text threshold. Switched s1-kicker, s3-kicker, and accent `<span class="em">` to `--card-slate` (#14806F teal-deep) which clears at ~4.6:1. Visual brand intact, accessibility cleared. Promoted to §4.
- **Next time:**
  - Brand extraction = `curl <url> > /tmp/raw.html` + `grep -E '(--[a-z][a-z-]+:|font-family|@import|<title>)' /tmp/raw.html` first. Only fall through to WebFetch if the site is JS-rendered. Image references: `grep -E 'src=\"[^\"]+\\.(png|jpg|svg|webp)\"' /tmp/raw.html`.
  - Generate TTS first, build comp duration to measured audio length. Don't budget scenes from the script.
  - On any new brand using teal/green accents on cream/light backgrounds, **don't use the brand teal as kicker color without checking contrast** — go one shade darker (deep variant) by default.
  - Accept that `validate`'s contrast warnings are noisy on multi-scene comps. Triage: ignore `null:1` and elements outside their active scene; address only ratio-numbered failures whose element IS in the active scene at the sample timestamp.
  - For deterministic offline renders, use direct font names in `font-family` (Nunito / JetBrains Mono) — leave var() refs only for tokens the compiler doesn't scan for embedding.
  - When a `<img src>` appears in two scenes at different times, treat the duplicate-media warning as a real signal to either consolidate to one element or replace one usage with text (already known pitfall — bit me again, validating the §4 entry).
- **Promoted to §4 / §3?** Yes — 2 new §3 patterns (brand extraction recipe, two-file token system), 3 new §4 pitfalls (validator contrast false-positives, compiler doesn't resolve `var(--font-*)`, WCAG kicker-color trap on cream).

### 2026-04-24 · Promoted v5 user feedback to standing preferences
- **What:** Two pieces of explicit user feedback from the Claim Mate v5 session ("I like the mix of html and real images and videos" and "me choosing the music worked well") promoted from the session log into §5.5 as standing directives.
- **Outcome:** done — §5.5 "User preferences" added to LEARNINGS.md.
- **Worked:** User's own words were unambiguous — both preferences were already latent in v5 practice but not codified as defaults.
- **Friction:** No existing section for standing user preferences; §3 (patterns) and §4 (pitfalls) don't fit this category. Created §5.5 between quotas and the increment log to keep it visible on a cold read without renumbering live references in §6/§7/§8.
- **Next time:** When a user flags something as "worked well" at session end, treat it as a preference capture candidate immediately — don't wait for it to be re-derived in a later session.
- **Promoted to §4 / §3?** No — promoted to new §5.5 (standing directives, not reusable patterns or pitfalls).

### 2026-04-24 · Claim Mate v5 "Ninety Days" — NZ ACC 90-day appeal promo, 26.5s vertical
- **What:** Built a 1080×1920 26.5s promo for Claim Mate's NZ ACC appeal service. Scenes: DENIED stamp hero → 90 DAYS overlay → letter/pen photo → typing video → woman-on-phone video → wordmark CTA. Edge TTS narration (WilliamNeural -12%), Pixabay music bed, three Pixabay videos, two stock photos. Patched both Pixabay fetchers with direct-URL support. Used VTT word timings to anchor DENIED stamp, 90 number, DAYS word, and subtitle entrances exactly to narration. A replacement calendar video (`v5-calendar-flipping.mp4`) arrived from the user after the render was already complete — archived for v6 rather than forcing a re-render.
- **Outcome:** done — `renders/aivideomaker_2026-04-24_15-42-59.mp4` · 8.1 MB · 26.5s · frame-verified at 11 timestamps in `renders/v5-verify-final/`.
- **Worked:**
  - Direct-URL mode in both Pixabay fetchers eliminated result-index guessing. When the user hands over a URL, skip the search path entirely. See §3 "Pixabay fetchers — direct URL mode".
  - VTT word-anchoring on sub-scene reveals (stamp/90/DAYS/subtitle) produced frame-accurate sync with zero iteration. See §3 "VTT word-anchoring for visual reveal timings".
  - Separating `data-track-index` (lint conflict) from `z-index` (visual depth) resolved the same-track-overlap lint error on the DENIED/90-DAYS coexistence without touching visual layout. See §3 "Track layering".
  - Frame verification ritual (`renders/v5-verify-final/`, 11 frames) caught the green-chroma calendar video before a second re-render of the full comp was attempted.
- **Friction:**
  - First calendar video (`v5-calendar.mp4`) was a cartoon with green-chroma style — only caught during post-render frame audit. A 30-second pre-fetch preview frame check would have caught it. Now §4 "Pre-render asset preview is non-optional".
  - `phone-doc.jpg` (stressed woman) and an earlier `denied-letter.jpg` (SPECIAL OFFER stamp) were wrong emotional beats — filenames were misleading. Now §4 "Stock filenames lie about content".
  - CTA wordmark at 190px in JetBrains Mono overflowed the 1080px frame (~1200px computed width). Had to reduce font-size post-first-render. Pre-flight width formula now in §4 "Typography width overflow before render".
  - Brandmark chip with `repeat: 6` ended on a hidden keyframe, rendering as an empty rectangle in Scene 6. Fixed with a trailing `tl.set(".chip", { opacity: 1 }, ...)`. Now §4 "`repeat: N` on pulse animations".
  - Stale `Referer: searchUrl` in `fetch-pixabay-music.mjs` after renaming to `startUrl` — `ReferenceError` on direct-URL path. Fixed; confirmed line 122 now reads `Referer: startUrl`. Now §4 "Stale variable reference after rename".
  - User sent a better calendar video (`v5-calendar-flipping.mp4`) after render was done. Right call: archive for v6, don't re-render v5. File is at `assets/videos/v5-calendar-flipping.mp4`.
- **Next time:**
  - After every asset fetch: `ffmpeg -ss 0.5 -i <file> -frames:v 1 preview.jpg` + Read it. Non-negotiable. One command, prevents a wasted render.
  - Before setting font-size on a wide text element: `char_count × 0.6 × font_size ≤ frame_width − padding`. Do the math before the first render.
  - After any variable rename in a script: `grep -n '<old-name>' <file>` to catch strays before running.
  - For looping animations with finite `repeat`, default to option b: append `tl.set(el, { opacity: 1 }, sceneEnd - 0.01)` to guarantee the visible state wins.
  - When user signals "ship as-is, use new asset next time" — archive the new asset with a `v<N>-` prefix and move on.
- **Promoted to §4 / §3?** Yes — 5 new §4 pitfalls (pre-render preview, stock filenames, typography overflow, repeat-on-hidden-keyframe, stale-variable-after-rename). 4 new §3 patterns (direct-URL Pixabay, VTT word-anchoring for sub-scene reveals, track-index vs z-index, frame-extraction ritual).

### 2026-04-24 · Claim Mate v4 — scroll-stopping hook, male voice, tick-as-slash, brand pulse (+ v3.3 bleed fix)
- **What:** Two passes in one session.
  - **v3.3**: Chased down a video-bleed bug that had been hiding in v3 and v3.2, replaced the sepia grade with a modern saturate/contrast/brightness stack, switched from Molly (female, drab) to Natasha (AU female, warmer) at -10% +2Hz, dropped the silent FairWay beat to tighten to 26s. Frame-verified clean — scenes 1 and 2 finally showed the stamp+pen and coffee+marble photos they were meant to.
  - **v4**: User feedback "we want it to be scroll-stopping + more conversational + authoritative male voice". Rewrote narration with a text-first hook ("Did A.C.C. decline your injury treatment?"), regenerated TTS with en-AU-WilliamNeural @ -12% (24.94s audio). Added a new text-only bg-0 scene (0–3.4s) with stacked typography — ACC is the hero word at 280px. DECLINED stamp slams on it at t=1.15 and persists through the cut to the physical letter photo. Moved the corner brand mark top-LEFT per user request, replaced the `/` with an animated SVG ✓ tick in both the corner mark AND the big CTA wordmark. User then asked for a cycling brand pulse — CLAIM → tick draws → MATE → fade → repeat. Built as a GSAP sub-timeline with `repeat: 8` (1.8s cycles, 9 plays, 16.2s active) inside the main timeline. Also launched rd-scout to research Edge TTS male voices + optimization — findings at `docs/rd/edge-tts-male-voices.md`, promoted key bits to §3.
- **Outcome:** v3.3 shipped — `renders/aivideomaker_2026-04-24_12-18-57.mp4` · 10.7 MB · 26s · frame-verified. v4 rendering at session end.
- **Worked:**
  - **Frame verification caught the video-bleed bug.** Without it, v3 and v3.2 would both have shipped broken. The bug was invisible to lint (0/0) and thematically plausible (hands on laptop under "ACC said no" was narratively fine). Only pixel inspection exposed it.
  - **rd-scout agent paid off** — in ~3 min it produced a ranked voice shortlist with cite sources, an SSML-limit ceiling writeup, and a concrete recommendation. Saved me from hand-testing 5 voices.
  - **VTT-first retiming** (now standard) — William's audio clocked 24.94s and the scene timings snapped cleanly to word boundaries. No drift.
  - **GSAP sub-timeline with finite repeat** works cleanly for looping brand pulses. `tl.add(brandCycle, 3.55)` nests it at the right start time; `repeat: 8` keeps us inside the HyperFrames "no repeat -1" rule.
  - **Text-hook scene uses the canvas-centred DECLINED stamp as-is** — layout the word "ACC" dead centre of 1080×1920 and the existing overlay lines up on it without changing positioning.
- **Friction:**
  - **The video-bleed bug was a multi-session miss.** v3 shipped, frame-verified (but not specifically checking for bleed), was declared clean. v3.2 shipped with the same bug. v3.3 finally caught it because the new modern grade made the hands-on-laptop plate look obviously wrong in scene 1. Spent ~20 min diagnosing before realising `<video muted playsinline>` autoplays under clip hiding. Now in §4.
  - **Misread render timestamps** on one earlier attempt — thought a task was stalled when it was 1 minute old. Killed Chrome processes which nuked `nvcuda.dll`, forcing a CPU-encoder fallback. Render succeeded but cost 13 min vs ~5 on GPU. Future: read the log header for start time before assuming stall.
  - **First "A.C.C." vs "ACC" call** — v3 narrations wrote `ACC` and Natasha correctly read it as letters. For William, went with `A.C.C.` as the research recommended. No regression — William reads it fine with dots. Cheap insurance.
- **Next time:**
  - **Frame-verify EVERY background video** at t = SCENE_START + 0.2 AND at previous-scene + 0.2 — the second check is what catches bleed. Now a hard rule in §4.
  - **Research TTS voices ONCE, reuse** — the voice table in §3 is the answer to "which voice?" for the next 10 projects. Only re-run rd-scout if brief genuinely differs.
  - **For scroll-stopping hooks**, use a text-only opening scene (no photo) with bold stacked typography. The DECLINED/stamp/tick/etc. overlay anchored to canvas centre = instant pun. Reusable pattern.
  - **The brand-pulse micro-animation** is now a known pattern — CLAIM/tick/MATE looping in a corner. Save for next brand-heavy project.
- **Promoted to §4 / §3?** Yes — video-bleed pitfall into §4 with prevention recipe. Edge TTS voice table + copy-for-TTS rules + SSML ceiling into §3.

### 2026-04-24 · Claim Mate v3.1 — bigger blocks, snappier motion, persistent brand mark, varied exits, cards design system
- **What:** Second pass on v3 after user feedback. Bumped overlay sizes ~25% (DECLINED 140→180, step-num 120→150, step-label 44→54, ledger-fig 220→260, wordmark 170→190). Added persistent `CLAIM/MATE` brand mark in the top-right corner (64px, dark backdrop-blur pill) visible scenes 1–5, fades out at 21.5s before the big CTA. Tightened entrance durations (0.55→0.38) with harder eases (`back.out(1.6)`, `expo.out`, `back.out(2.2)`). Added exit tweens on every non-final overlay with VARIED directions: declined crumples down+right, step-01 right, step-02 up, step-03 down, step-04 left, ledger collapses center-up. Wrapped wordmark CTA in a dark backdrop-blur panel.
  Then, on user request for a card design system: shipped `design/cards.css` (design tokens + 6 surface variants + 8 content layouts + `.card-mark` for persistent corner), `compositions/cards/README.md` (full catalog with usage), and four card sub-comp templates (`stat-card`, `quote-card`, `image-underlay-card`, `feature-row-card`). Included an image-underlay pattern per user's "images that go in it" ask. Noted 10 new SVG animations to commission (approval-stamp, paper-plane-send, document-scan, etc.). All new sub-comps use `document.querySelector` not `currentScript.closest`, sidestepping the IIFE pitfall.
- **Outcome:** pending render (background task, previous render `renders/aivideomaker_2026-04-23_10-49-25.mp4` was the baseline v3 inline version, 11.3 MB, 27s, lint clean, frame-verified).
- **Worked:**
  - Frame-verification stage gate (new in playbook) caught that v3 was clean — no video-bleed regression from v2.
  - Inline architecture was the right call — adding the brand mark and exit tweens was 2 minutes of edits in one file, not hunting through 8 sub-comp files.
  - `back.out(1.6)` on card entrances reads noticeably snappier than `power3.out` for the same duration.
  - Exit variety is cheap: one `stepExit()` helper with (dx, dy, rotation) args → four directions for four steps.
- **Friction:**
  - First render attempted at `-w 4 --gpu` — crashed at 58% with the known `Page.captureScreenshot` signature. Wasted 5 min of render wall-time. **This confirms a rule: medium comps with >10 clips + video should START at `-w 2 --gpu` on this box, not the medium preset's `-w 4`.** Updating playbook.
  - Initial v3 attempt (pre-restart of this task) used sub-comps for backgrounds — 11 script errors at render. Root cause documented in §4 (sub-comp IIFE + multi-instance collision).
  - At frame-15 of v3 baseline, step-03 card appeared to have faded early despite clip being active until 16.2s. Possible cause: capture was in the tween-idle window and the overlay content was at final state, but positioned outside visible area due to a ken-burns scale interaction. Not reproduced once exits are explicit in v3.1. Will re-verify in new render.
- **Next time:**
  - For this machine, UPDATE the medium preset in the playbook: 11+ clips + any video → start at `-w 2 --gpu`. Don't let the "medium = -w 4" line mislead.
  - Persistent brand mark is now a known pattern — add to playbook under "Reusable patterns".
  - Exit-direction vocabulary (right/up/down/left/crumple/collapse) is a sibling to the camera-move vocabulary and belongs in the playbook.
  - Frame-verification should be a bash one-liner in the playbook, not a for-loop copy-paste. Consider shipping `scripts/frame-verify.mjs`.
- **Promoted to §4 / §3?** Yes — sub-comp IIFE pitfall + `-w 2 --gpu` preset into §4. Playbook gains persistent-brand-mark + exit-direction vocabulary.

### 2026-04-24 · Claim Mate v3 — inline rebuild after v2 video-bleed failure
- **What:** v2 (`renders/aivideomaker_2026-04-23_09-42-54.mp4`) shipped with lint 0/0 but was broken — the `working.mp4` video element bled through every scene because HyperFrames' clip visibility toggling doesn't occlude video like it does divs. User flagged it; post-mortem confirmed we shipped without watching output. Rewrote as v3: 459 lines inline (down from v2's 1180), with four distinct background clips (3 photos + 1 video), seven overlays (declined stamp, 4 step badges, ledger card, wordmark CTA), two audio tracks (narration + music bed), global grade filter applied via `.bg-media` class. Also authored a `compositions/` component library (backgrounds: ken-burns, crossfade-two, video-bg; overlays: declined-stamp, step-badge, ledger-card, wordmark-cta, lower-third, word-reveal) as copy-paste reference. Wrote `scripts/fetch-assets.mjs` for parallel manifest-driven asset fetching. Updated the cinematic-vertical-promo playbook with component architecture, parallel fetch pattern, and a mandatory frame-verification stage gate.
- **Outcome:** done — `renders/aivideomaker_2026-04-23_10-49-25.mp4` · 11.3 MB · 12m 42s wall time at `-w 2 --gpu` (first attempt at `-w 4` crashed at 58%). Lint 0/0. Frame-verified at t=0.5, 2.5, 4.5, 6.5, 9, 12, 15, 18, 21, 24, 26.5. v2 bleed bug dead.
- **Worked:**
  - Frame verification IS the new stage gate. Without it, v2 would have shipped again.
  - Inline root composition (459 lines) is faster to edit and debug than a 171-line root composing 9 sub-comps. Component library still useful as reference.
  - Parallel manifest fetcher cut asset-gather wall-time from ~3 min serial → ~40s concurrent.
  - `-w 2 --gpu` succeeded in 12:42 where `-w 4 --gpu` crashed. Same signature as v2.
- **Friction:**
  - First sub-composition attempt failed hard: 11 script errors + "video metadata not ready after 45000ms". Root cause: compiler IIFE wrapping breaks `document.currentScript`, and multi-instance sub-comps share one `window.__timelines[id]`. Documented in §4.
  - Sub-agents were slower than direct writes for mechanical file authoring (~5× slower per fresh context load). User flagged this mid-session — pivoted to all direct tool calls.
- **Next time:**
  - Default to inline for multi-scene promos. Reserve sub-comps for singleton end-cards.
  - For mechanical writing work (components, HTML, CSS), skip agents — use Write/Edit directly.
  - Run frame-verification EVERY render, not just on suspect ones. Treat render success + lint 0/0 as necessary-but-not-sufficient.
- **Promoted to §4 / §3?** Yes — see above v3.1 entry.

### 2026-04-24 · Rebuilt Claim Mate promo (no fake facts, all asset types)
- **What:** Rewrote the Claim Mate composition to remove invented stats and Māori words after user flagged both. New 25.5s version combines every asset type: brand SVG hero (scene 1), stock photo with paper-toned overlay (scene 2), pure typography (scene 3), 3-step Lucide icon process (scene 4), stock video background with trust signals (scene 5), wordmark CTA (scene 6). Also created the `video-director` orchestrator agent.
- **Outcome:** done — `renders/aivideomaker_2026-04-23_07-57-36.mp4` · 10.7 MB · 5m wall time on 4 workers · lint 0/0 first try.
- **Worked:**
  - Combining stock photo (filtered grayscale+sepia) with HTML headline overlay + strikethrough animation looked genuinely on-brand, not stock-photo-cheap.
  - Stock video as background (filtered + gradient overlay) made trust signals feel weighty without competing with the foreground text.
  - Both saved feedback memories (`feedback_no_invented_facts`, `feedback_tts_no_maori`) will inherit to future sessions.
  - The render upgraded HyperFrames to 0.4.16 mid-session (npm warn) — no breakage.
- **Friction:**
  - I made up statistics for a real product on the previous render. **Not OK.** Captured as a hard rule in cross-session memory + §4.
  - Stock video had sparse keyframes — render warned to re-encode. Rendered fine but quality could improve with `ffmpeg -c:v libx264 -r 30 -g 30 -keyint_min 30` pre-pass.
- **Next time:**
  - Before any real-brand video: ask the user for verified stats. Don't assume "plausible" numbers are OK.
  - Pre-encode bg videos for sparse-keyframe issue: `ffmpeg -i in.mp4 -c:v libx264 -r 30 -g 30 -keyint_min 30 -movflags +faststart -c:a copy out.mp4`.
  - Use the `video-director` agent for end-to-end builds once Claude Code is restarted.
- **Promoted to §4 / §3?** Yes — "no invented facts" + "no Māori in TTS" + "wrong Claim Mate logo" all into §4. "Combining all asset types" pattern into §3.

### 2026-04-24 · Built Claim Mate brand promo, 34s vertical
- **What:** Full Claim Mate (cadastral/ordnance-survey brand) promo at `index.html`, 1080×1920, 6 scenes, narrated by Edge TTS NZ voice (Molly Neural, -10% rate). Uses the brand SVG (`assets/svg-animations/brand/claim-mate-paper-tick.svg`) as the opening hero, navy Lucide icons for trust signals, and the canonical `CLAIM/MATE` wordmark for the CTA.
- **Outcome:** done — `renders/aivideomaker_2026-04-23_07-44-00.mp4` · 1.8 MB · 60s wall time on 4 workers · lint 0/0 first try.
- **Worked:**
  - Started with TTS to extract the 64-word VTT, then mapped scene starts to actual narration timing — every scene change lands on a natural pause. Right order of operations.
  - The brand SVG plays its own SMIL animation when shown via `<img>` — drop-in. No re-implementing the paper-DECLINED-tick choreography in GSAP.
  - JetBrains Mono "machinery" elements (top ledger, bottom case strip, scene counter) gave the whole video a quiet documentary feel that matches the brand.
  - Counter ticking 0 → 2,400 with `gsap.fromTo + snap + onUpdate` for `toLocaleString()` formatting.
- **Friction:**
  - Built composition with the wrong logo lockup first (cadastral mark + lowercase wordmark, copied from a stale brand README). User caught it. Had to verify against the live `claim-mate/landing-page/index.html` — actual brand is wordmark-only, UPPERCASE. **Captured in §4.**
  - Two embedded brand SVGs had lowercase wordmarks. Fixed both to UPPERCASE.
  - Tried to delegate lint+render to the `composition-doctor` subagent — Claude Code said "Agent type 'composition-doctor' not found." Project-scoped agents need a session restart to register. **Captured in §4.**
- **Next time:**
  - **Verify brand against the live source** before designing — read `claim-mate/landing-page/index.html` directly, don't trust any local README without checking.
  - Generate TTS first, read VTT, plan scenes off the actual word timings. Don't guess.
  - When introducing project-scoped subagents, prompt the user to restart Claude Code before relying on them.
  - The brand SVGs now live in `assets/svg-animations/brand/`. The old `assets/brand-animations/` folder is just a preview HTML — consider deleting it next session.
- **Promoted to §4 / §3?** Yes — "verify brand against live source" + "project-scoped agents need restart" into §4. "TTS-first scene timing" already in §3 (reinforced).

### 2026-04-24 · Added 4 specialised subagents
- **What:** Created `.claude/agents/{asset-hunter,improvement-scribe,composition-doctor,rd-scout}.md` to delegate three repeatable workflows (asset fetching, improvement-loop bookkeeping, lint+render hygiene) plus open-ended research.
- **Outcome:** done. Agents are project-scoped (`.claude/agents/`) so they auto-load for this project only.
- **Worked:** Each agent has a tight scope and an explicit "do not" list — they won't drift into design or composition work that needs main-thread context.
- **Friction:** None — Claude Code agents are just markdown with frontmatter.
- **Next time:**
  - Trigger `improvement-scribe` proactively after every lint-clean or render. That's the whole point of the loop.
  - When asked an open-ended "is there a better way?" question, default to spawning `rd-scout` rather than deep-diving in main thread.
  - Hold off on adding more agents until these earn their keep over a few sessions. Watch for drift.
- **Promoted to §4 / §3?** No new patterns yet — the agents themselves are the pattern.

### 2026-04-24 · Built AI Video Maker promo, 17.5s vertical
- **What:** End-to-end video using fetchers we just built (Edge TTS, Iconify icons, Pixabay scrape) + the SVG animation library, rendered to MP4.
- **Outcome:** done — `renders/aivideomaker_2026-04-23_07-12-10.mp4` · 3.8 MB · 3m 30s wall time on 4 workers.
- **Worked:**
  - `edge-tts-universal` synthesise + auto-VTT in one call.
  - Word-level VTT timings drove scene start times directly.
  - Pixabay scrape of photo + video succeeded once selector was fixed.
  - Lint caught real issues: missing root timing, dup `<img>`, overlapping tweens.
  - `hyperframes doctor` told me exactly what was missing (FFmpeg).
- **Friction:**
  - Pixabay selector matched hidden nav dropdown — wasted ~30s on first try. **Fixed in fetcher, captured in §4.**
  - FFmpeg not on bash PATH despite winget install — needed manual `export PATH=…`. **Captured in §4.**
  - HyperFrames `preview` server died on internal esbuild error — not a blocker, render works. **Captured in §4.**
- **Next time:**
  - Run `npx hyperframes doctor` BEFORE building anything; export FFmpeg path in shell init.
  - Start TTS first → read its VTT → only then design scene timing.
  - For background scrapes, structure the composition with graceful fallbacks (`onerror="this.style.display='none'"`) so the build keeps moving.
- **Promoted to §4 / §3?** Yes — Pixabay selector fix into §3 (Working pattern) and §4 (Pitfall). FFmpeg PATH and preview bug into §4.

### 2026-04-24 · Built SVG animation library + 11 free-asset fetchers
- **What:** ~95 SVG animations across 30 categories in `assets/svg-animations/`, plus fetcher scripts for Iconify, unDraw, Pixabay (photo/video/music), Unsplash, Pexels, Edge TTS, gTTS, StreamElements, ElevenLabs, Freesound.
- **Outcome:** done. Master gallery at `assets/svg-animations/index.html`.
- **Worked:**
  - SMIL animations (`<animate>`, `<animateTransform>`, `animateMotion`) — self-contained, deterministic, scale-friendly.
  - Pattern of `fill="freeze"` for one-shots, `repeatCount="indefinite"` for loops.
  - Iconify HTTP API is the cleanest possible icon source.
- **Friction:**
  - Wrote `fetch-tts-edge.mjs` with a hand-rolled WebSocket implementation, then immediately replaced it with `edge-tts-universal` after the GitHub-repo search recommended it. Lesson: search the ecosystem **before** writing protocol code.
- **Next time:**
  - Default to "is there an npm package for this?" before writing 200 lines.
  - Centralised `usage.mjs` was a good early investment — extend it (don't reinvent) for new fetchers.
- **Promoted to §4 / §3?** Yes — `edge-tts-universal` and Iconify HTTP API into §3.

---

## 7. Production approach (archival note — agents removed)

The project ran a 16-agent crew under `.claude/agents/` until 2026-04-25 (producer / video-director / screenwriter / cinematographer / editor / sound-designer / colorist / narrator / music-supervisor / animation-curator / html-composer / motion-designer / asset-hunter / composition-doctor / improvement-scribe / rd-scout). The user found the crew-chain overhead too costly — too many hand-offs for what's effectively a single-operator pipeline. **All agents deleted; do not dispatch.** Cross-session memory `project_no_agent_framework.md` records the directive.

**Current approach — direct pipeline:** the main thread does the work. Spawn an `Explore` agent for codebase searches, `Plan` agent when designing a complex change, `general-purpose` agents in parallel for genuine R&D fan-out (see §3 "Parallel research-agent fan-out"). That's it. No formal stage gates, no per-role plan files.

The pipeline order is still real and worth following — TTS first (narration is master clock), brand extraction → tokens, scene-by-scene comp build, lint, smoke (`npm run check`), render — but it's a checklist now, not a delegation chain.

## 8. Things to try next (parking lot)

Open ideas that aren't blocked but haven't been done. Move into a real task list when you start one.

### Currently open

**Near-term (ready to ship next session):**
- **Asset cache layer** — content-addressed (`assets/.cache/<hash>`) so re-runs of the same fetch don't re-hit the network.
- **WCAG contrast audit script** — extends `npm run smoke` to sample text-vs-background contrast at every scene midpoint, fail if below 3:1 (large) or 4.5:1 (body). Caught manually too many times.
- **Real-time render progress reporting** — current `scripts/render.mjs` runs silent for 5+ min. Tail `hyperframes render` stdout, parse "Frame N/M", emit a progress bar.
- **Composition versioning manifest** — write `compositions/<slug>.meta.json` with template/tokens/modules + version of cards.css used. Lets you re-render an old comp without surprise drift.
- **Auto-fix common pitfalls** — a `scripts/fix.mjs` that scans index.html for: hardcoded scene dims (now redundant), `tl.from()` on opacity (suggests `fromTo`), `</script>` literals in inline JS, missing autoplay guard. Apply with `--dry-run` flag first.

**Mid-term (multi-session):**
- ✅ **(fixed 2026-04-26)** `scripts/usage.mjs` now traces `fetch("...")` patterns (was missing). `assets/amp/kindred-bed.json` was a false-positive 0-reference (it's read at runtime by `ampBind` via fetch in `kindred-recut.html`). Static `import` patterns were already handled. Remaining unused: `assets/amp/claim-mate-v2.json` (legit orphan — only used in `archive/`).
- **Promote `font-var` lint detector to error-tier** — currently warn (482 hits across 44 HTML + design/*.css). Compiler emits `[Compiler] No deterministic font mapping for: var(--card-font-display), …` on every render. Once the 482 sites migrate to direct font names + `@font-face`, flip the detector to `error` and the runtime warning disappears for good.
- **Animation choreography lint rules** — extend `npx hyperframes lint` to warn when narration ends mid-tween, when scenes overlap visually, when `data-track-index` collides.
- **Asset usage tracker** — `scripts/usage.mjs` builds a graph of which compositions reference which assets/tokens/modules. Useful for "is this asset still needed?" cleanup.
- **Voice library curator** — `scripts/preview-voices.mjs` synthesises a fixed 4-second sample with each Edge TTS voice, writes them all to a folder for side-by-side audition. Currently the user picks blind.
- **Music library catalog** — Pixabay/Freesound search by mood/BPM/key, save metadata, auto-tag. Mirrors the effects catalog pattern.
- **Composition diff tool** — compare two comps' GSAP timelines structurally (tween count, scene durations, asset refs). Useful when iterating "v3 vs v3.1".
- **GitHub Actions render** — push to a branch, CI renders MP4, attaches to release. Free remote rendering, parallel to local.
- **Backup-and-restore CLI** — one command to checkpoint state (renders + index.html + tokens), one to rollback. Currently: archive/ folder by hand.
- **Auto-record memory entries** from this file's "Promoted to §3 / §4" items so they cross sessions.

**Long-term (research / explorations):**
- **Rive integration** — state-machine character animation embeddable as `<canvas>` driven from GSAP. Reference: Remotion's `<RemotionRiveCanvas>`. Captured 2026-04-25 evening.
- **AI b-roll via Veo 3 / Kling 3** — for shots we can't author. ≤3s accent only (longer reveals AI artefacts), pass through the same LUT as the rest of the comp.
- **Render farm distribution** — split frames across multiple machines via a shared queue. Dropping render time below 30s would change the iteration loop fundamentally.
- **Remotion or Motion Canvas evaluation** — alternative tech stacks captured 2026-04-25 evening. Current HyperFrames stack works but if friction grows, these are credible exits.
- **Telemetry for renders** — track which effects are used, which fail, which combinations produce the best visual results. Foundation for "auto-suggest effect for scene type".
- **AI-assisted composition** — feed a brief, get back a populated index.html with template + module choices. The current building blocks (templates, modules, scaffolders) are the substrate; this is the layer above.

### Recently closed (2026-04-26 wave-Q — first user-validated social-video template)

The user pushed back on the faq-quick iteration with "I see you are trying to use images maybe i dont think you understand what makes a good social media video" then "figure it out you are way off." That feedback redirected the work from CSS tweaks to **establishing the foundation knowledge** before continuing — exactly the lesson now codified in memory under `feedback_research_first_for_unknowns.md`.

- ✅ **`docs/social-video-patterns.md` — canonical reference.** Two halves: 15 platform-mechanical rules (TikTok / Meta / YouTube Shorts) with measurable targets + sources, and 7 community-app patterns from real benchmarks (Olio / Nextdoor / Buy Nothing / Karma / Trade Me NZ / Upworthy). Includes an audit table — current faq-quick scores 2 pass / 5 marginal / 15 fail out of 22 checks. The gap is structural, not a tweak gap.
- ✅ **`compositions/templates/community-app-tour-30s.html` — new template, locked v1** (commit `c7a7015`, tag `community-app-tour-v1`). Phone hero centered (600x1066, navy frame, real app screenshot inside), big emoji icons (📦 / 💬 / 🤝) flying in/out per step matching kindred's 3D-emoji aesthetic, INTRODUCING / 3 STEPS / MADE FOR LOCALS + "Be kind. Use Kindred." CTA. Glitter burst at t=0.1 kicks the wordmark into frame. Validated on kindred-nz: user reaction "*that was great… im surprised i liked it.*"
- ✅ **`docs/template-models.md` — locked-template index** created. Tracks which templates are user-approved + at which git tag. Lists what's load-bearing (CSS load order, phone-mockup specs, emoji-at-system-font choice) and what's open for the next iteration (real-world hook before brand reveal, real voice over Edge TTS, sticker-pill captions, CTA position vs platform overlay zone).
- ✅ **Verifier slug bug fixed** (commit `2ca9741`). `guessSlugFromIndex`'s sha256 step was matching stale per-brand `meta.json` files — reports landed under `kindred-nz-override` instead of `kindred-nz`, brand-asset-use went major because it pointed at the wrong manifest. Now short-circuits to the `--copy` filename when the orchestrator passes one (it always does).
- ✅ **faq-quick polish** (commit `e6afeb9`) shipped from the silent-loop pass before the user pivoted. Bigger body text (38px → 52px), bigger hero crop (480x320 → 720x520), motion amplitudes ~2x, object-position 18% → 0%. faq-quick stays valid for B2B-SaaS / wellness-clinic / explainer briefs — just not for community-app shapes.
- 📋 **Pending for community-app-tour generalisation:** re-render with 2-3 OTHER warm-community brands (Olio NZ, Neighbourly NZ, Buy Nothing US) to confirm the template doesn't bake in kindred-specific assumptions. If "MADE FOR LOCALS" feels off-brand for non-NZ, parameterise it for v2.
- 📋 **Verifier rules to add** (TODO list in `docs/social-video-patterns.md` Part 1): R1 (no logo before 3s), R2 (≥10 cuts in 30s), R3 (sticker-pill caption count), R5 (CTA y-position vs platform overlay zone), R8 (≤30 chars in first 3s), R12 (21-34s length), R13 (caption font ≥80px). ~9 DOM-based checks, est. 2-3 hours.

### Recently closed (2026-04-26 wave-P — verifier becomes the gate)

The user established the quality > speed principle and the loop-until-perfect workflow mid-session, replacing the breadth-first wave-shipping pattern. The verifier is now the load-bearing iteration gate. Templates lock in as models once verifier + user-eyes both ratify.

- ✅ **Process formalized** (commit `d2a3074`). New canonical `docs/PROCESS.md`. Old standing directives ("use as many parallel subagents as possible") explicitly superseded with deletion-safe historical notes. 5 new memory rules added: visual-fidelity, motion-speed, sequential-improvement, template-amortization, iteration-workflow.
- ✅ **Motion-saturate faq-quick** (commit `a2c6e86` + track fix `6f54b1e`). Five scenes with kenBurns hero / parallax / cascade / glow / signalPulse / glitter / audio-reactive pulse / decorative drifters. Hero image appears in scenes 1-4 with different framing each time. shaderFx.glow loaded as opt-in.
- ✅ **Continuous within-scene motion** (commit `0ded8fd`). Diagnosed the "PowerPoint with prettier slides" failure mode: motion-saturated scenes were INTERNALLY static — entrance over 1-2s then 5-7s of nothing. Fix: every element gets a continuous tween (kenBurns, parallax, breathe, drift) with `repeat: -1, yoyo: true, ease: sine.inOut` running the FULL scene duration. PSNR analysis: every adjacent 0.5s frame in scene 2 differs by 23-36dB now.
- ✅ **Motion-continuity verifier check** (commit `bbc20b4`). Catches PowerPoint failure pre-render. Samples 4-9 timestamps per scene via Playwright, sha256 + byte-diff between adjacent frames. Findings: static-moment / near-static-moment (warn), multiple-static / scene-frozen (error → bumps verdict to needs-fix). Saves the 7-minute render cycle when the comp is broken.
- ✅ **Script-timing verifier check** (commit `5e7d084` + SUGGESTIONS append `c3511a4`). Six new finding types: density-imbalance, scene-narration-mismatch, silence-beat-misplaced, narration-overrun-into-cta (error), word-emphasis-orphan, script-fits-budget. Caught a real overrun on kindred-nz (1.6s into CTA scene) on first run. Verifier runtime: 9.5s.
- 📋 **Pending in the silent loop** (next session continues from `docs/SESSION-HANDOFF-2026-04-26-late.md`): trim narration to fix the overrun, fix CTA verb concat ("Visit Share with neighbours..."), tighten near-static motion threshold or amplitude (17 warn-level findings), framing fixes on scene 2 hero crop, palette pop on numerals, narration-critique check (qualitative — story vs feature-list, brand voice fidelity), color-palette-flow (animated palette across scenes + verifier check that brand tokens are continuously visible).

### Recently closed (2026-04-26 wave-O — framework discipline meets the live page)

The user watched the kindred-nz render and named two real problems: (1) the script "stated facts" instead of telling a story, and (2) the visuals were "PowerPoint, not video". This wave addressed the script half (visual half is in flight under wave-P motion-saturation). Diagnosis showed the framework infrastructure was built and never wired in — extract-copy.mjs has TWO code paths (default mode = scrape + summarize; framework mode = strict playbook prompt) and the orchestrator only ever called the default. Plus framework mode itself was BLIND to the actual landing page — it took a one-line `--brand="<description>"` and ignored everything else.

- ✅ **Playwright deep-scrape library** (commit `ffcc93f`). New `scripts/lib/scrape-page.mjs` — `scrapePage(url, opts)` returns structured `{ title, metaDescription, ogTags, jsonLd, h1, h2, h3, paragraphs, listItems, ctaCandidates, visibleText, stats }`. Headless Chromium, 1920×1080, 20s timeout, 1.5s SPA settle, fail-soft per-section, optional `outPath` persistence. Tested on kindred-nz: extracted h2s "Two things, really" / "Three steps. That's the whole thing" / "Built for real streets" + the canonical h3 step list "Post a give or an ask / A neighbour messages / Drop it off or pick it up" — the brand's actual narrative structure that the curl-based scraper missed.
- ✅ **Framework mode now reads the live page** (commit `c8819c5`). `runFrameworkMode` accepts `--url=<url>` (preferred) or `--brand="<text>"` (legacy). When `--url=` passes, it scrapes via `scrapePage`, persists to `compositions/<slug>.scrape.json`, and threads a "BRAND CONTEXT" block into the Claude prompt with the brand's h1, first 3 h2, first 8 paragraphs, first 12 list items, top 3 CTAs, og tags. Prompt explicitly instructs Claude: "*Use the brand's own sentences as raw material. The framework (BAB / PAS / etc.) is the SHAPE — the words come from the page below. If a fact is not in this block, do NOT include it.*" Backward compat: `--brand="…"` alone still works.
- ✅ **Tone-aware framework picker** (commit `5c914da`). New `pickFramework({ tone, structuralTemplate, copySignal, hostname })` in `scripts/video.mjs` runs after the tone resolver. Decision matrix: warm + community signals (`.org`, `.foundation`, "share/neighbours/community/together") → BAB; warm + Q&A-shaped → Q-Payoff; warm + sensory/atmosphere → Sensory; energetic + product launch → FAB; energetic + DTC → AIDA; energetic + general SaaS → AIDA; documentary + founder signals → Hero's Journey; documentary + case study → STAR; documentary + transformation → Transformation; documentary + clear pain → PAS; fallback → BAB. `--framework=<name>` override always wins. Orchestrator prints both the chosen framework and the firing signals (e.g., `framework: BAB (warm+community) [tone=warm, kindred-nz.org domain]`).
- ✅ **Stage 2 calls framework mode by default** (same commit). When `ANTHROPIC_API_KEY` is set, the orchestrator calls extract-copy in framework mode with `--url=<url> --framework=<picked> --vibe=<tone-vibe> --duration=<bucket> --out=<copyJsonPath>`. When the key isn't set, falls back to URL mode (legacy 4-worker deterministic pipeline) so offline contributors keep a working pipeline.
- ✅ **Hand-crafted copy.json preservation** (commit folded into Stage 2 wiring). The orchestrator's Stage 2 now respects an existing `compositions/<slug>.copy.json` if it has narration + at least one beat headline. Unlocks the manual-curation workflow: scrape, hand-edit, re-render. Without this fix, ANY re-render would clobber user edits because Stage 2 unconditionally overwrote.
- 📋 **API key NOT required for Claude Code app — finding** (memory captured). User flagged: this is a Claude Code app, why does extract-copy.mjs need its own ANTHROPIC_API_KEY? Right answer: the script should use `@anthropic-ai/claude-agent-sdk` (already in devDependencies) which inherits Claude Code's authentication. Deferred follow-up: rewire `runFrameworkMode` to use the SDK instead of raw `fetch`. Current state: still uses fetch, requires env-var key.
- 📋 **Memory: motion-speed feedback** (`feedback_motion_speed.md`). For ad-grade video, every effect entrance should be 30-50% faster than the warm-community defaults (0.4-0.5s, not 0.8-2.5s), AND every scene needs persistent motion (kenBurns / parallax / ambient particles / amp-bind pulse) running the full scene duration — not just an entrance event. Without persistent motion, scenes read as "fade in then sit" = PowerPoint. The wave-P motion-saturation agent applies this rule.
- 📋 **Memory: visual fidelity > text alignment** (`feedback_visual_fidelity.md`). The verifier said "watch" on a render the user called "way off" — its checks (text matches, contrast OK, lint clean) didn't ask "does this LOOK like the brand?". New brand-fidelity checks (palette use, asset use, scene visual density) in commit `8bfd9f8` close some of this, but the deeper lesson is: passing the verifier ≠ ship-ready. A human eye still has to look.

### Recently closed (2026-04-26 wave-N — verifier loop + copy-injection across all templates)

- ✅ **`applyCopyToTemplate()` now covers all 8 templates** (commit `64ff6f7`). Prior version only knew IDs for hero-promo / social-reel / case-study. The faq-quick / testimonial / founder-story / before-after / product-launch templates' IDs were uncovered, so when the picker chose one of those, the brand's beats[] never landed in the visible scenes — audio was correct, visuals were template seed copy. Caught by Playwright verification on kindred-nz: audio said "find local help, share with neighbours" but visible text was "How long does a session take? / Ninety minutes…" wellness-clinic seed. Extension adds replaceText rules for: faq-quick (s1-tag, s2-q/a, s3-q/a, s4-q/a, s5-cta, s5-url), testimonial (s2-quote, s4-name, s5-cta), founder-story (s1-name, s1-tag, s2-support, s3-b1/2/3, s4-headline), product-launch (s1-tag, s2-support, s3-t1/2/3, s4-date, s4-url), before-after (s1-state/detail, s3-state/detail, s4-label, s5-mark, s5-url). Verified zero seed-copy leakage on kindred-nz post-fix; 7 kindred-specific strings now visible across the template's slots.
- ✅ **`npm run verify` + per-render learnings ledger** (commit `f48ecad`). New `scripts/verify-render.mjs` (~870 LOC) spawns hyperframes preview, scrubs `window.__timelines[<id>]` second by second (sample at `t+0.5` so GSAP entrance tweens have settled), reads visible text via DOM (constrained to `[data-composition-id]` subtree), cross-references against narration VTT timing + copy.json. Outputs: per-render JSON (machine-readable for future runs to consume), per-render markdown report (human-readable), and a one-row entry appended to `docs/render-learnings/LEDGER.md`. Findings categorized into composition / brand fidelity / placeholder leakage / pacing / audio coverage / accessibility. Verdicts: ship | watch | needs-fix. Cumulative SUGGESTIONS.md captures cross-render patterns when they show up in 2+ runs. Per-render artifacts gitignored; LEDGER + SUGGESTIONS tracked. New scripts: `npm run verify` and `npm run verify:assembled`.
- ✅ **First verifier demo on kindred-nz** flagged: 0 placeholder leakage (the bug is gone), beat #3 payoff line "One free app for your street…" not visible (spoken but not shown), s5 CTA is only 3s vs ideal 7.5s/beat slot, 4 a11y findings on dark numerals "01/02/03" + "THREE QUESTIONS" tag at 2.37:1 contrast. Verdict: watch (not ship; not blocking). Final render: `renders/aivideomaker_2026-04-26_15-10-11-graded-wm.mp4` (73.8s render).
- 📋 **Schema follow-ups surfaced** (deferred): `extract-copy.mjs` should add `customerName`/`customerRole` (for testimonial), `founderName`/`founderRole` (for founder-story), and `launchDate` (for product-launch). Currently those fields fall back to brandName / first-beat-kicker / CTA verb — works but not ideal.

### Recently closed (2026-04-26 wave-M kindred-nz iteration v2 — fixes shipped)

- ✅ **Tone-driven template + music picker** (commit `f61e616`). New `extractBrandTone({ tokensCssPath, copyJsonPath, hostname })` in `scripts/video.mjs` reads three signals: palette warmth (HSV bucket from `tokens-<slug>.css` brand-color custom properties), copy voice (lexicon scan of `narration` + `beats[].headline/body` for `community/local/share` → warm; `boost/launch/scale` → energetic; `story/journey/founded` → documentary), and domain hint (`.org/.foundation` → warm; `.io/.app/labs` → energetic). Returns one of `warm`/`energetic`/`documentary`/`neutral`. `pickTemplate({ seconds, tone, override })` then walks `TONE_PREFERENCE[tone]` and picks the entry whose seconds bucket is closest to the request. `--template=` override and `--dry-run` bypass remain intact. Music picker (`scripts/pick-music.mjs`) accepts new `--tone=<name>` flag that maps to the corresponding vibe shortlist (`warm-community` / `kinetic-pop` / `documentary`) and overrides `--template`'s vibe inference downstream. Verified: kindred-nz.org → tone=warm, template=faq-quick, music=warm-community (was hero-promo + kinetic-pop). stripe.com → tone=energetic, template=hero-promo, music=kinetic-pop.
- ✅ **Template decoration cleanup** (commit `6cd21fb`). Audited all 8 structural templates for literal placeholder-looking text (`HEADLINE`, `BENEFIT`, `SOLUTION`, etc.) used as visible decoration. 6/8 already clean. Fixed 2: `hero-promo-30s.html:258` (`HEADLINE` plane → wired to `s1-bg-text` ID, swapped to brand name) and `case-study-60s.html:335` (`SOLUTION` plane → wired to `s2-bg-text`). Left alone as deliberate kinetic-pop / section copy: `social-reel-15s.html` "FAST", `product-launch-30s.html` "NEW", `founder-story-60s.html` "BUILT", `before-after-20s.html` "BEFORE/AFTER" stamps. `applyCopyToTemplate()` in `scripts/video.mjs:919-923` got two new `replaceText` rules.
- ✅ **pick-music: skip download when local_file exists on disk** (commit `c38099f`). The picker correctly ranks tracks with existing local_file at +1000 score, but the download function ignored that and always shelled out to `fetch-pixabay-music.mjs`. When that fetcher receives a CDN URL (rather than a Pixabay search-page URL), it wraps it as a search query, hits 403, and the pipeline reports "no candidates" — even though the file is right there on disk. Fix: short-circuit to local file when present. Surfaced when re-running kindred-nz.org under Pixabay rate-limiting.
- ✅ **HEAD-INCLUDE re-hydration** after the decoration audit edited templates. `npm run build:bundle` re-hydrates all 25 templates from `design/compose-head.html`. Done idempotently — only 2 templates needed actual updates.
- ✅ **kindred-nz.org rendered with the new picker** — `renders/aivideomaker_2026-04-26_14-43-25-graded-wm.mp4`. Faq-quick template + warm-community music (kindred-bed.mp3 acoustic guitar) + 70-word narration. 65s render (was 180s on hero-promo-30s — faq-quick has fewer scenes / less GSAP work).

### Findings from kindred-nz.org end-to-end run (2026-04-26)

Three issues surfaced when the user reviewed the kindred-nz MP4. None are blockers but all are real and should be fixed in the next wave:

- 🐛 **Template decoration text reads as unfilled placeholder** — `compositions/templates/hero-promo-30s.html:258` has `<div class="plane plane-bg">HEADLINE</div>` which the template author intended as decorative background typography (Bauhaus-style giant lettering). Has no `id` attribute so `applyCopyToTemplate()` (`scripts/video.mjs:881`) never touches it. To viewers it reads as broken UX. Fix: either remove the literal "HEADLINE" plane, replace it with brand-relevant text (the brand name), or add an ID + plumbing so the orchestrator swaps it. Same audit needed for all 8 templates — likely 2-4 instances of this pattern.
- 🐛 **Template picker uses duration only — ignores brand tone** — `scripts/video.mjs:pickTemplate()` buckets by seconds (≤20 → social-reel, ≤35 → hero-promo, ≤50 → testimonial, ≤75 → case-study). Each template is locked to a vibe (`hero-promo` → `kinetic-pop`, `testimonial` → `warm-community`, etc.) which then locks music selection. Result: a community-brand 30s video lands on `kinetic-pop` synth-pop. **Fix path:** add a tone signal — read warmth from `tokens-<slug>.css` palette + voice from copy.json + vertical from URL hostname/scraped meta — and let the picker choose template using BOTH seconds AND tone. See `feedback_brand_tone_picker.md` in user memory.
- 🐛 **Music is template-locked, not brand-tone-driven** — `scripts/pick-music.mjs` is called by `video.mjs` with the template's hardcoded vibe (`vibeForTemplate(template)`). Even though the picker has its own ranking (local file present + URL type + curator order), the *vibe shortlist* is chosen by the orchestrator's template, not by the brand. Same root cause as above: fix the template picker, fix the music. **Alternative fix:** pass an explicit brand-tone hint to pick-music.mjs that overrides the template's vibe.

**Copy structure is fine** — the `extract-copy.mjs` output already follows hook → story → CTA via the `beats[]` array (kicker INTRO/PROOF/PUNCH/PAYOFF) + a separate `cta` field. The `narration` field is the full spoken script. The issue isn't that the copy lacks structure; it's that the template's scene shape doesn't honour the copy's natural arc.

### Recently closed (2026-04-26 wave-M speech + music)

- ✅ **Orchestrator now produces fully-featured comps with speech + music** (commit `3dd19d5`). Pipeline grew 7 → 8 stages with new Stage 5 (TTS narration). The orchestrator now reads `compositions/<slug>.copy.json` after Stage 2, builds a 70-90 word narration script via `buildNarrationScript()` (uses the canonical `copy.narration` field if present, otherwise synthesizes from hook + body + CTA), runs `sanitizeForTts()` to strip any Maori words defensively (memory rule: Edge TTS mispronounces them), then spawns `scripts/fetch-tts-edge.mjs` to write `assets/voiceover/<slug>.{mp3,vtt}`. Gracefully soft-skips on `--no-tts`, `--dry-run`, missing/empty narration, or network failure.
- ✅ **`--with-music` now actually wires music into the comp** (same commit). The assemble stage was injecting copy + tokens but ignored the music output entirely — flag was documented but unwired (real bug). Fixed via `findMusicTrackPath()` + `buildAudioTag()` + `injectAudioTags()` helpers that scan `<slug>.music.json` for the downloaded track and insert an `<audio class="clip" data-track-index="8">` immediately after `<div class="comp clip">`. Narration uses track 9 (matching kindred-recut convention), music uses track 8. VTT cue end-time read via `readVttDuration()` for narration's `data-duration`.
- ✅ **Proven on kindred-nz.org**: `npm run video -- https://kindred-nz.org --with-music --no-render --keep-artifacts --name=kindred-nz` produces `index.html` with **2 `<audio>` tags wired** (music: `assets/music/kinetic-pop-top.mp3` + narration: `assets/voiceover/kindred-nz.mp3` 29.6s from VTT). Total non-render time: 10.4s. Lint clean (warnings are pre-existing cross-comp false positives — see duplicate-audio finding above).

### Recently closed (2026-04-26 wave-M end-to-end run)

- ✅ **Parallel pipeline proven on a real brand URL** — ran `npm run video -- https://linear.app --no-render`. Stages 2-4 fanned out: 1.0s wall-clock vs 1.6s sequential (matches Phase 1's predicted 30-50% speedup). Stage 1 (brand extract) is 6.9s network-bound and unchanged. Total Stages 1-6: 15.3s vs ~15-20s pre-Phase-1.
- ✅ **Stage-6 quality gate fix** (commit `5099755`). The orchestrator was running `npm run check` which includes the visual Playwright smoke — that fails when `hyperframes preview` server isn't on :3002. That's interactive-workflow state, not pipeline state. Replaced with explicit gate chain `lint + lint:strict + check:heads + smoke:cli` (skips visual smoke). Safe because Stage 7 (render) already proves the comp loads. Users who want the visual signal can still run `npm run check` interactively after `npm run video --no-render`.

### Recently closed (2026-04-26 wave-M continued — bypass-permission run)

- ✅ **Font-var detector skip-pattern fix** (commit `c66b51e`). `scripts/fix.mjs:listCssTargets()` now also excludes `design/cards.css` and `design/templates/*.css` — those files DEFINE the `--card-font-*` vars (token sources), not consume them. Same role as `tokens-*.css` which was already skipped. 15 false-positive warns removed (525 → 510 by grep count). Pre-req for the eventual severity flip to error.
- ✅ **Font-var PR 1: additive `@font-face` blocks** (commit `0e7b15d`). 35 `@font-face` blocks added across 4 design CSS files for the 9 fonts referenced via `var(--card-font-*)` chains: Inter (cards.css default, weights 300-900), JetBrains Mono (cards.css, 400-700), Instrument Serif (cards.css, 400 normal+italic), Bebas Neue + Inter Tight (kinetic-pop), Playfair Display + Source Sans 3 (documentary), Fraunces + Nunito (warm-community). All on Google Fonts (gstatic.com woff2 URLs, latin subset, `font-display: swap`). Pre-existing `@font-face` count was 0 — fonts had been loaded purely via `@import url(...)` at render time. Purely additive: no consumer rewrites, font-var warning count unchanged at 515. Unblocks PR 2 (severity flip to error) for next session.
- ✅ **`--dry-run` mode for `npm run video`** (commit `5739746`). New `--dry-run` flag bypasses all 7 stage child spawns (Playwright + Anthropic + Pixabay/Pexels + Edge TTS + render) and writes synthetic outputs instead (`design/tokens-<slug>.css` stub, `compositions/<slug>.{copy,meta,music}.json`, empty `assets/<slug>/`). URL becomes optional (defaults to `https://example.com`); slug defaults to `dryrun-test`. `[DRY RUN]` banner prints. Quality gate runs `lint` only (full `check` would launch Playwright + blow the <5s budget). Deterministic 60-180ms delays per stage so the parallel batch's `└─ batch wall-clock:` log shows real overlap (~140ms vs ~340ms sequential). New `scripts/smoke-cli.mjs` test asserts the parallel-batch line printed; smoke:cli now 13/13 in 5.1s (new test alone 1.3s). Working tree stays clean via the existing `try/finally` index restore.
- ✅ **QUICKSTART §6 stage diagram refreshed** (commit `f9c8874`) to match the parallel batch shape so cold-read in next session matches what shows in the user's terminal.

### Recently closed (2026-04-26 wave-M — pipeline parallelization + audits)

- ✅ **Wave-M #1: Phase 1 — `npm run video` stages 2-4 fanned out** (commit `1ab9877`). `scripts/video.mjs` had 7 sequential stages; stages 2 (copy-gen), 3 (asset-pull), 4 (music-pick) only depend on Stage 1's tokens output, not each other. New `runStagesInParallel()` helper wraps `Promise.allSettled` over the three; new `runNodeAsync()` (vs blocking `spawnSync`) runs each child concurrently with buffered stdio so the parent prints one tidy line per stage in canonical order after the batch settles. Hard exceptions aggregate into one error; soft exit-code-non-zero falls back to placeholder JSON via `deferredWarnings`. Stage counter (`stage.i`) bumps past the batch so subsequent stages still print `[5/7]` etc. Expected speedup: 30–50% on the URL-to-MP4 pre-render path; render itself was already parallel (Wave-G). Verified: lint + smoke:cli green.
- ✅ **Wave-M #2: Phase 2 — `pull-assets.mjs` cross-kind fan-out** (commit `3abc524`). The `for (const kind of order) await downloadFirstValid(...)` cross-kind loop became one `Promise.allSettled` over all four kinds. Per-kind candidate-walk stays sequential (first-valid-wins). Favicon-mirrors-logo fallback moved to after the batch settles. Disk writes still in priority order to honour `--max`. `pull-assets.mjs` doesn't use `lib/usage.mjs`, so no rate-limit gating to preserve. Verified: lint + smoke:cli green.
- ⏸ **Wave-M #3: Phase 3 — render post-pass overlap NOT POSSIBLE** (commit `350ad8d`). Plan thought grade could run in parallel with audio-mux. Investigation: `scripts/render.mjs` has NO audio-mux step — `hyperframes render` is a single opaque subprocess that emits a fully-muxed MP4. Grade → watermark is strictly sequential by data dependency (watermark reads what grade writes). The lever for this speedup is upstream in `hyperframes render` itself, not in this wrapper. Documented finding appended to `docs/video-parallelize-plan-2026-04-26.md`.
- 🟡 **Tech stack audit** — only one safely-bumpable dep: `@anthropic-ai/claude-agent-sdk@0.2.118 → 0.2.119` (patch, applied this session). `hyperframes` stays pinned exact at `0.4.26` per Wave-F directive. `playwright@1.59.1` is at latest stable; 1.60.0-alpha not for prod. Node v24.14.0, no `engines.node` constraint, holding. ffmpeg via `@ffmpeg-installer/ffmpeg@1.1.0` already current (Gyan 8.1 build).
- 📋 **Font-var migration scope corrected**: actual count is **516 occurrences across 38 files** (not the session-summary's 482/44 — undercount from earlier). Dominant suffix: `--card-font-display` (~310), `--card-font-ui` (~180), `--card-font-mono` (~25). Variant `--font-display`/`--font-body` only appears in `assets/brand-capture/` (out of scope). **Detector bug surfaced**: `scripts/fix.mjs:detectFontVar()` flags `design/cards.css` and `design/templates/*.css` even though those are token *sources* — `listCssTargets()` only excludes `design/tokens-*.css`. Migration is HARD per-site judgment (not 1-line sed) because `--card-font-*` vars are intentional design-system handles redefined per template/brand; baking literals would freeze defaults and break the cascade. Recommended path: PR 1 = additive `@font-face` blocks in `design/cards.css` + `design/templates/*.css` (4-5 files, no consumer rewrites); PR 2 = extend skip pattern + flip detector severity to `error`.
- 📋 **Duplicate-audio lint warning is a cross-comp false positive**, not an `index.html` bug. `index.html` has zero `<audio>` elements. The hyperframes lint pass walks all top-level `compositions/*.html` into one `allHtmlSources` array and runs `lintDuplicateAudioTracks` across the union — findings get attached to the `[index.html]` label as the project-level bucket. Real source: `compositions/kindred-production-30s.html` and `compositions/kindred-showcase-2026-04-26.html` both reference the same TTS+music tracks (with vs without leading `../`). Both are independent root comps; neither path is "stale" — they're correct for each file's own runtime context. Three options if it ever becomes blocking: (1) move the older `kindred-production-30s.html` to `archive/`, (2) rename audio assets per-comp, (3) fix the hyperframes detector upstream to not cross-scan independent root comps. Currently a warning, leaving as-is.
- ✅ **Effect-combo coverage sufficient** — 16 combos covering 14 genres, 0 unfilled gaps. Heavy adopters: `cinematicReveal` (4), `kineticBurst` (5), `confettiFinale` (3), `hyperGlitch` (3). **Six combos unused outside the demo**: the entire batch-2 set (`glitchStamp`, `pricePop`, `testimonialReveal`, `focusPull`, `statGroup`, `spotlight`). The actionable problem is *adoption* (vertical templates don't call combos despite 144 inline primitive calls), not *authoring* — retrofitting `textFx.stamp` × N → `glitchStamp`, multi-`textFx.counter` → `statGroup`, `textFx.stamp(price)` → `pricePop`. None of the 8 parked won't-ship combos crossed the 3+ inline-repetition threshold; parking-lot verdicts hold.
- ✅ **`tmp/` added to .gitignore** — clears throwaway probe scripts (`tmp/probe-comp.mjs`, `tmp/probe-recut.mjs`) from git status. Both have explicit "delete after debugging" header comments. Working tree audit also identified `assets/baseline-stripe/`, `assets/baseline-test/`, `compositions/baseline-{stripe,test}.{html,copy.json,meta.json,music.json}`, `design/tokens-baseline-{stripe,test}.css` as exploratory test runs from this session's parallelize-fetchers verification (no rendered output, no doc/script references). Left untracked (not deleted) — user can clean up when ready.

### Recently closed (2026-04-26)

- ✅ **3 animation-choreography lint detectors** (now 17 total in `scripts/fix.mjs`): (1) `narration-mid-tween` (warn) — fires when an `<audio class="clip">` ends DURING (not at) an active visual tween, with ±0.15s tolerance. Skips long ambient tweens (≥4s) and `backgroundPosition`/`filter`-only tweens to avoid false-firing on film-grain/dolly. 4 production hits, all legit (SFX ending 0.4–0.95s into a content tween in `kindred-production-30s.html`). Opt-out: `// narration-mid-tween-ok` on the tween line. (2) `track-index-collision` (**error**) — same `data-track-index` clips with overlapping time ranges. 0 production hits (error-tier gating works). Opt-out: `<!-- track-collision-ok -->` on either clip. (3) `scene-overlap-visual` (warn) — different track indices with >0.5s overlap. 160 fires across 30 files — captures the canonical "track 0 = comp root spans everything, scenes on track 1" pattern. Authors opt-out per-pair: `<!-- scene-stack-ok -->`.
- ✅ **Voice library curator** — new `scripts/preview-voices.mjs` (228 LOC). `node scripts/preview-voices.mjs` synthesises a 4-second preview with each Edge TTS voice and writes them to `assets/voice-library/<YYYY-MM-DD>/`. Default sample text is a phoneme-rich pangram. Default scope: 47 English-locale voices (en-AU/CA/GB/HK/IE/IN/KE/NG/NZ/PH/SG/TZ/US/ZA — `mi-NZ` deliberately excluded per user feedback). `--all-locales` flag opens to 76 voices. Cache via `scripts/lib/asset-cache.mjs` keyed `voice-preview|<voice>|<text>` so re-runs hit cache. Per-voice errors log + continue (Edge TTS occasionally 502s on individual voices). Auto-writes `INDEX.md` with locale-sorted preview table + Windows/macOS playback hints. `--list` dry-runs without API calls. `--filter=<regex>` narrows scope. Concurrency capped at 5 for Edge TTS rate-limit headroom. Honors `scripts/lib/usage.mjs` rate-limit tracker. New npm scripts: `voices:preview`. Local-date default (not UTC).
- ✅ **Asset usage tracker** — new `scripts/usage.mjs` (397 LOC, ~150ms run on 44 comps + 301 tracked files). Read-only — surfaces a usage graph: `Map<assetPath, Set<compositionPath>>`. Sections: `Used by 0` (cleanup candidates), `Used by 1`, `Used by ≥2`, `Hot (≥10×)`. Flags: `--json`, `--unused`, `--filter=<glob>`, `--by-comp=<path>`. New npm scripts: `usage`, `usage:unused`. Resolution tries source-relative AND root-relative paths (compositions use project-root-relative `href="design/cards.css"` not `../design/cards.css`); accepts whichever hits a tracked file. Comment-stripping scoped to `.js` files + `<script>` blocks only (otherwise it ate `<script src="…">` substrings inside JS line comments). **First-pass findings:** 290 unused asset candidates (most are bulk libraries: `assets/icons/lucide/*` 24 icons unwired; `assets/music/track*.mp3` only used in `archive/`; `design/cards-from-bundle/phonehand.css` orphan). Hot files all 31×: `cards.css`, `effects-batch-08.css`, `modules/all.{css,js}`, `vendor/gsap.min.js`. **Cleanup batch deferred** — destructive, needs user review.
- ⚠ **Phase 5 ship was at-parity, not faster** — commit `2f633df` claimed "1.27× incremental, ~2.2× total" based on early single-run measurements. Re-measurement on the same Win11 / 12-core / 16GB host: Phase 4 87.2s avg vs Phase 5 93.9s avg on `kindred-recut` (540 frames, 6 workers) — **Phase 5 ~7s slower in steady state.** Reason: Playwright 1.59's `page.screenshot({ path })` already overlaps the disk write with the next frame's GPU paint; CDP's base64-over-pipe transport adds slight overhead. The real bottleneck is the GPU compositor flush (~165ms/frame on kindred), which neither transport touches. Phase 5 ships as a zero-regression scaffold (byte-identical output, SSIM 1.000) — useful as the entry point for **Phase 6 raw-RGBA via canvas opt-in**, which is the only path that actually skips the compositor flush. `docs/render-vite-roadmap.md` updated with honest measurements.
- ✅ **Wave-G ship: Vite-renderer Phase 3** (parallel BrowserContexts) — single Chromium launch, N BrowserContexts. Default `min(6, os.cpus())`, override via `--workers=N`. Frame range split: `perWorker = ceil(F/N)`, worker k handles `[k*per, min((k+1)*per, F))`. Worker 0 reuses the probe page (already navigated for dimensions+audio scan); workers 1..N-1 spin up fresh contexts via `Promise.all`. Absolute zero-padded `frame-%06d.png` filenames keep ffmpeg's input glob order-independent. Memory clamp: if `N × 250 MB` > 75% of `os.totalmem()`, reduces N + warns. **Speedup measured on 12-core / 16 GB Windows: 540-frame `kindred-recut.html` 155.1s → 108.4s @ 6 workers (1.43×). 180-frame `text-fx-demo.html` 18.4s → 15.4s @ 4 workers (1.20×) — short comps barely amortize warmup.** Below the 2-3× target because `page.screenshot()` saturates at the GPU/IPC layer; **Phase 4 (raw-RGBA pipe to ffmpeg) is the lever to break that ceiling.** Determinism: SSIM 1.000 / 0.9988 / 0.9979 across frames 30/60/120 between `--workers=1` and `--workers=4` (sub-pixel anti-alias jitter only). **2 gotchas surfaced + fixed:** (1) `waitUntil: "networkidle"` resolves before the inline timeline-registration script fires under multi-context contention — switched to `"load"` + explicit `waitForFunction`. (2) Playwright's `waitForFunction` hangs forever if the predicate returns a GSAP timeline object (circular refs + DOM nodes block result serialization) — predicate must return a boolean primitive: `!!(window.__timelines && window.__timelines[key])`. Memorialized in §4 below.
- ✅ **Wave-F ships** — 3 landings: (1) **Pinned `hyperframes@0.4.26`** (exact, no caret) in `devDependencies`. Stops smoke/render drift when `latest` ticks. (2) **Eliminated DEP0190 spawn warning** across 5 sites (`render.mjs`, `render-queue.mjs`, `smoke.mjs`, `video.mjs`, post-grade pass). New shared helper `scripts/lib/platform-bin.mjs` exposes `node` (= `process.execPath`), `npmCliJs` (resolves `npm-cli.js` next to node), and `npxRunArgs(pkg, extras)` (resolves the package's actual JS entry e.g. `node_modules/hyperframes/dist/cli.js`). Spawns now use `node`+resolved-JS-path, no shell, no `.cmd`. Note: Node 22+ rejects `.cmd` spawn without `shell: true` per CVE-2024-27980 — that's why simply swapping `npx → npx.cmd` doesn't work; you have to skip the shim entirely. Real render confirms `grep -c DEP0190` = 0. (3) **Vite-renderer Phase 2 (audio mix)** — `scripts/render-vite.mjs` extended with DOM audio scan + 2nd-pass ffmpeg mux. Per-track filter graph: `[k:a]volume=V,adelay=Sms|Sms[a_k]`, plus a synthetic `anullsrc` silence pad to guarantee `amix` reaches full duration (the bundled @ffmpeg-installer is a 2018 build that doesn't support `apad=whole_dur`). Mux flags: `-map 0:v:0 -map [aout] -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart`. Verified with synthetic 4s comp + 2 SFX: ffprobe shows `h264 4.000s + aac 3.924s, container 4.000s`. Phase 1 (no-audio) byte-shape preserved. New `--no-audio` flag.
- ✅ **Wave-E ships** — 2 more landings: (1) **`scripts/extract-copy.mjs --framework=<name>`** (Tier 1 #3 from the original tier-list, gated on copy-apply now done). Direct `fetch` POST to `https://api.anthropic.com/v1/messages` (no SDK — single-shot generation doesn't need agentic loops). 9 framework names hardcoded in `SUPPORTED_FRAMEWORKS` for input validation; the *rules* of each framework are read from `docs/copy-playbook.md` at runtime so playbook edits propagate. Flags: `--framework`, `--brand`, `--vibe`, `--duration`, `--model` (default `claude-sonnet-4-6`), `--temperature` (0.4 default), `--out`, `--dry-run`. New `npm run copy:gen`. Doc in [docs/extract-copy-framework-2026-04-26.md](docs/extract-copy-framework-2026-04-26.md). (2) **2 more lint detectors in `scripts/fix.mjs`** (now 14 total): `video-bleed-guard` (error) — fires when a `<video>` has a still-open ancestor with `class*="clip"` AND `data-start` and the video lacks `id` + inline `style="opacity:0"` + matching `tl.set('#<id>', {opacity:1/0}, …)` pairs. Opt-out: `<!-- video-bleed-ok -->` before the tag. `repeat-no-final-set` (warn) — fires on tweens with `repeat: N` animating opacity/scale without `yoyo: true` and no matching `tl.set` landing keyframe. Opt-out: `// pulse-end-handled` on the tween line. Both 0-finding in production today (guards against future regressions, not legacy debt).
- ✅ **Wave-D streamline implementations** — 2 ships: (1) **Render progress reporting** — new `scripts/lib/render-progress.mjs` (250 LOC). `scripts/render.mjs` spawns `npx hyperframes render` with piped stdout, line-buffer splits on both `\n` AND `\r` (HyperFrames uses CR-overwrite), strips ANSI, regex-matches `/Streaming|Capturing frame\s+(\d+)\/(\d+)/i` from CLI + `/^\s*frame=\s*(\d+)/` ffmpeg fallback. Total frames = root `data-duration` × fps from `--fps` flag (30 default). 24-cell `▰▱` bar, TTY uses `\r`-rewrite at ≤5×/s + 5s heartbeat redraw, non-TTY emits one plain line per event + `.` heartbeat dots. Suppress via `RENDER_PROGRESS=off` env or `--no-progress`. `render-queue.mjs` forwards flag; `video.mjs` stage 7 emits leading `\n` so the bar gets its own row. (2) **Compose-from-template `<head>` fragment** — new `design/compose-head.html` (single-source for `cards.css → effects-batch-08.css → modules/all.css → vendor/gsap.min.js → modules/all.js`; vibe + tokens lines stay per-template). `scripts/build-bundle.mjs` adds an idempotent hydrate pass (greedy first-open / last-close span match defends against literal `<!-- /HEAD-INCLUDE -->` text inside payload comments). All 25 templates carry `<!-- HEAD-INCLUDE -->` marker (uniform +6/-2 diff, no `skip` opt-outs needed). New `npm run check:heads` (drift detector) wired into `npm run check` between `lint:strict` and `smoke`. **Adding a new module/CSS file now means editing one file**, not 25.
- ✅ **Copy-apply across all 25 templates** → 8 structural + 17 vertical templates each carry a `<!-- Copy framework: <name> · applied 2026-04-26 -->` breadcrumb and rewritten copy (hooks/headlines/body/captions/CTA) under the playbook word caps + Tier 1 verb-first CTA rule. Layout DOM, IDs, GSAP calls, scene timing, fonts, palette tokens **untouched**. `npx hyperframes lint --json` `ok:true` (0/0/0). Frameworks applied: AIDA, PAS, FAB, STAR, BAB, Hero's Journey, Transformation, Q-Payoff, Sensory (and combos). Summary table in [docs/copy-apply-2026-04-26.md](docs/copy-apply-2026-04-26.md).
- ✅ **Wave-C streamline + lint detector implementations** — 4 ships: (1) `scripts/renders-prune.mjs` + `npm run renders:list/prune` with `.keep` sentinels and ffprobe via `getFfmpegPath`. Smoke prints a footer warning when `renders/` exceeds 200 MB. (2) `scripts/help.mjs` + `npm run help` — discovers all `package.json` scripts, opens each `node scripts/X.mjs` for the first comment, groups by inferred category, `--md` flag emits QUICKSTART. (3) Asset cache extended through 8 fetchers (`pexels`, `iconify`, `undraw`, `unsplash`, 4× TTS) via `cacheText()` helper for UTF-8 payloads (captions, SVG sources). All wires mirror the existing Pixabay pattern (`cacheKey` → early-exit on hit → `cachePut` after write). (4) 3 lint detectors added to `scripts/fix.mjs`: `font-var` (warn, 482 hits — `font-family: var(--…)` in HTML inline `<style>` + `design/**/*.css` excluding `tokens-*` and `@font-face` blocks), `audio-no-clip` (error, 0 hits — production all clean), `subcomp-currentscript` (warn, 9 hits — sub-comps use `<template>` + `document.currentScript`). `lint:strict` gating preserved.
- ✅ **Combo-fx batch-2 — combo-gap follow-up shipped** → commit `8395c9b` "Combo-fx batch-2: 6 new combos + fix latent pick() bug". 6 new `comboFx.*` recipes (`glitchStamp`, `pricePop`, `testimonialReveal`, `focusPull`, `statGroup`, `spotlight`) + 2 new `effectFx.*` primitives (`rackFocus`, `radialMask`) that unblocked `focusPull` and `spotlight`. Demo composition extended 10→16 scenes; effects catalog regenerated. Plan + verdict in [docs/combo-fx-batch-2-plan.md](docs/combo-fx-batch-2-plan.md); §3 + §6 updated.

### Parked with verdicts (2026-04-26 wave-B feasibility audits)

These items were evaluated this session and parked with explicit verdicts so future sessions don't relitigate without new signal. Each links to the full audit doc.

- 🟡 **Bun runtime swap** → **WAIT until Q3 2026.** Playwright + Windows + Bun is broken upstream (oven-sh/bun#13543). `npm run check` speedup ceiling is ~100ms (not ~800ms — bulk of `check` time is real work). Revisit after upstream fix. See [docs/bun-feasibility-2026-04-26.md](docs/bun-feasibility-2026-04-26.md).
- 🟡 **TypeScript for `scripts/`** → **JSDOC-CHECKJS, defer full migration.** 11.5k LOC across 38 .mjs files; full rename is 25–40h. JSDoc + `tsconfig.json` w/ `allowJs` + `checkJs` is ~4h and covers the one real type-shaped contract (`fix.mjs` ↔ `lint-strict.mjs`). See [docs/typescript-scripts-feasibility-2026-04-26.md](docs/typescript-scripts-feasibility-2026-04-26.md).
- 🟡 **WebCodecs frame capture** → **WAIT for Vite-renderer Phase 3 plateau.** Realistic speedup is ~2× wall-clock, but Phase 3 (raw RGBA pipe + parallel BrowserContexts) gets there without the 12h migration. Re-prototype on `text-fx-demo.html` only if Phase 3 plateaus. See [docs/webcodecs-feasibility-2026-04-26.md](docs/webcodecs-feasibility-2026-04-26.md).
- 🟢 **WebGL/WebGPU effects** → **PROTOTYPE-NARROW.** 2 effects (DOF bokeh + radial chromatic aberration) read visibly fake under CSS filters. Build with `twgl.js` (~30KB) as additive procedural canvas overlay (no `html2canvas` snapshot). 16–20h for both. The other CSS-filter effects read designed-on-purpose. See [docs/webgl-effects-feasibility-2026-04-26.md](docs/webgl-effects-feasibility-2026-04-26.md).
- ✅ **HyperFrames CLI bump** → **NO-OP — already on 0.4.26.** `npx` resolved `latest` when 0.4.26 published 2026-04-25 15:16 UTC. 0.4.25 + 0.4.26 are both pure patch + irrelevant to our use cases. 0.5.0-alpha.2 is a 20+ commit Studio-shell rewrite — wait for stable 0.5.0. Optional pin: `npm i -D hyperframes@0.4.26`. See [docs/hyperframes-upgrade-2026-04-26.md](docs/hyperframes-upgrade-2026-04-26.md).
- ✅ **Smoke parallel-scene speedup** → **DONE in `ca4b666`.** `smoke` 0.9–1.0s; `smoke:diff` floors at ~2.0s (Chromium launch + probe nav). Lower than that needs architectural change. See [docs/smoke-speedup-audit.md](docs/smoke-speedup-audit.md).

### Streamline + lint detector proposals (2026-04-26)

Two scout passes produced ranked proposals, with the top items dispatched as wave-C implementers. The proposals docs themselves are the parking-lot entries for un-shipped items.

- 5 streamline proposals — see [docs/streamline-proposals-2026-04-26.md](docs/streamline-proposals-2026-04-26.md). Wave C in flight: #3 `npm run help`, #4 `renders-prune`, #5 asset-cache extension. #1 (render progress reporting) and #2 (compose-from-template head fragment) are dispatch-ready next session.
- 5 lint detector proposals — see [docs/lint-detector-proposals-2026-04-26.md](docs/lint-detector-proposals-2026-04-26.md). Wave C in flight: top 3 (`font-var`, `audio-no-clip`, `subcomp-currentscript`). #4 `video-bleed-guard` (M-effort, nearest-ancestor check) and #5 `repeat-no-final-set` (M-effort, look-ahead) are dispatch-ready next session.

### Stale baselines flagged 2026-04-26

- ⚠ `npm run smoke:diff` reports 4 scenes at 25.20% pixel-changed — stale baselines, unrelated to the speedup. Refresh with `npm run smoke:baseline` next session.

**Deferred from the batch-2 plan (won't ship — won't reconsider unless adoption changes):** the plan's "Dropped from gap doc" table flagged 8 candidate combos as not worth shipping. Captured here so a future session doesn't relitigate them:
- ⏸ **`marqueeScroll`** — only 1 template (faq-quick-30s) needs it; inline 5 lines of `tl.fromTo` translateX.
- ⏸ **`fadeMontage`** — no current template wires it; speculative until adoption appears.
- ⏸ **`countdown`** — only 1-2 templates (event-special, feature-launch); existing `textFx.counter` + `textFx.stamp` chain handles it well enough.
- ⏸ **`urgencyFlash`** — only 1 template (trades-service-callout-20s); inline 5 lines of red-tint + `glitchBurst`.
- ⏸ **`brandLockup`** — `confettiFinale` already covers this with `intensity: 0.4`.
- ⏸ **`statBurst`** — subsumed by the shipped `statGroup`.
- ⏸ **`pulseGroup`** — `glitterFx.ambient` + manual stagger handles this; not worth a combo wrapper.
- ⏸ **`textTwist`** — speculative; no current template adopters.

### Recently closed (2026-04-25 streamline pass)

- ✅ **Bundled ffmpeg via `@ffmpeg-installer/ffmpeg`** → 2026-04-26. `dependencies` install ships `node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe`; all 4 ffmpeg-using scripts route through `scripts/lib/ffmpeg-path.mjs` with system-PATH fallback. Fresh Claude Code sessions no longer hit "FFmpeg not found" (§3 / §4 entries updated).
- ✅ **Render-time overlay watermark** → `node scripts/render.mjs --watermark` (drawtext default, image overlay, 4 corners, opacity, font override, queue forwards flags)
- ✅ **TTS-first scene scaffolder** → agent-shipped `npm run new:scene -- --narration="..." --beats=4` (late night)
- ✅ **Per-scene LUT overlay scaffold** → agent-shipped `data-scene-grade="warm|cool|noir|teal-orange|pop|soft"` declarative attribute (late night)
- ✅ **Render queue** → agent-shipped `npm run render:queue -- <comps>` (late night)
- ✅ **Composition templates beyond brand templates** → agent-shipped `compositions/templates/{hero-promo-30s,case-study-60s,social-reel-15s}.html` (late night)
- ✅ **Hot-reloading bundle build** → `npm run watch:bundle` (late night)
- ✅ **Hot-reloading preview** → `npm run preview:simple` SSE bus, iframe auto-refreshes on save (late night)
- ✅ **Module bundle file** → `npm run build:bundle` produces `design/modules/all.{js,css}` (late night)
- ✅ **Brand auto-extract → tokens-<brand>.css** → `npm run new:comp -- <url>` (late night)
- ✅ **Headless browser brand extraction** → `npm run new:comp -- <url> --mode=headless` Playwright + `getComputedStyle` sampling (late night)
- ✅ **`.scene` 1080×1920 portrait override trap** → `cards.css` now `100% × 100%` (late night)
- ✅ **GSAP CDN dependency** → vendored at `design/vendor/gsap.min.js` (late night)
- ✅ **Visual regression in smoke test** → `npm run smoke:diff` + `npm run smoke:baseline` (late night)
- ✅ **Effects catalog page** → agent-shipped `npm run catalog` (late night)
- ✅ **Standalone preview page replacing studio iframe** → agent-shipped `npm run preview:simple` (late night)
- ✅ **Pre-render visual smoke test** → `npm run smoke` / `npm run check` (night)
- ✅ **Templates × modules library** → 4 base templates + 6+4+3 modules (night)
- ✅ **Audio-reactive visuals integration** → `ampBind()` helper + scene scaffold (evening)
- ✅ **Cinematic post-pass** → `scripts/render.mjs` auto-grades by default (evening)
- ✅ **Procedural sound-design library** → `scripts/gen-sfx.mjs` 12 ffmpeg-synthesized presets (evening)
