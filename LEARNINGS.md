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

# FFmpeg (Windows): installed via winget but NOT on default PATH for new shells
# It lives at:
C:\Users\wirihere\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-8.1-full_build\bin\ffmpeg.exe

# Quick prepend in bash:
export PATH="/c/Users/wirihere/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
```

The HyperFrames CLI also looks at `process.env.PATH` only — `where ffmpeg` from cmd.exe will find it, but bash sessions launched fresh do not inherit Windows PATH updates. **Always export the path before running `npx hyperframes render`.**

---

## 3. Patterns that work

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

### ❌ FFmpeg not on bash PATH after winget install
- **Symptom:** `npx hyperframes render` reports "FFmpeg not found".
- **Cause:** winget updates the Windows user PATH, but bash sessions inherit the parent process env. Newer cmd.exe shells see it; bash often doesn't.
- **Fix:** Either (a) export the full path each session — see §2 — or (b) symlink ffmpeg.exe into `~/bin` or `/usr/local/bin` once.
- **Status:** Workaround documented 2026-04-24. Permanent fix would be a `direnv`-style auto-load.

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

### Hybrid composition — HTML overlays + real stock footage/photos (not one or the other)

The user prefers compositions that mix real-world visuals with HTML/CSS information layers:
- **Stock footage/photos** carry the human/emotional/real-world layer (stressed person, hands typing, phone in hand, workspace, exterior shot).
- **HTML/CSS overlays** carry information and brand cues (DENIED stamp, step cards 01/02/03, data reveals like "90 DAYS" / "$0", brandmarks, CTA wordmarks, legal strips).

The v5 "Ninety Days" composition confirmed this: neither pure-stock ("just a montage") nor pure-HTML ("motion-graphics explainer with no soul") — the blend is what landed. Default to this hybrid approach unless the brief explicitly calls for something else (e.g. "cinematic montage only" or "pure type-driven brand film").

**Rule of thumb:** every scene should have at least one real-world visual grounded in stock AND at least one HTML overlay carrying the information or brand cue. If a scene is all one or all the other, flag it as intentional or fix it.

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

## 7. The production crew (org chart)

Project-scoped agents at `.claude/agents/`. The structure mirrors a film production. **Use this hierarchy** — don't bypass roles.

```
USER (executive producer — briefs, signs off final, ships)
  └─ producer (boss; takes brief, sets scope/budget, signs off at every gate)
       └─ video-director (creative authority, runs the crew)
            ├─ Creative team (defines WHAT and WHY)
            │    ├─ screenwriter      → plans/<slug>/script.md
            │    ├─ cinematographer   → plans/<slug>/shotlist.md
            │    ├─ editor            → plans/<slug>/cutlist.md
            │    ├─ sound-designer    → plans/<slug>/sounds.md
            │    └─ colorist          → plans/<slug>/grade.md
            ├─ Capability specialists (execute the HOW with one tool each)
            │    ├─ narrator             — TTS via fetch-tts-edge.mjs
            │    ├─ music-supervisor     — music via fetch-pixabay-music.mjs
            │    ├─ animation-curator    — knows assets/svg-animations/
            │    ├─ html-composer        — writes HyperFrames HTML structure
            │    └─ motion-designer      — writes GSAP timelines
            ├─ asset-hunter              — general fallback for stock fetches
            ├─ composition-doctor        — lint + render
            └─ improvement-scribe        — post-mortem (LEARNINGS.md §6)

Plus: rd-scout (research) — spawned by producer when the brief has unknowns.
```

### Communication channels (how the crew talks)

```
Producer ⟷ Director           ← stage-gate hand-backs (formal sign-off)
Director → Crew (any)         ← briefs, revision asks
Crew → Director               ← deliverables, "ESCALATE TO DIRECTOR:" inline
Crew → Producer (via Director)← "ESCALATE TO PRODUCER:" inline in deliverable
Editor ⟷ Sound-designer       ← direct peer pairing (cuts ↔ music hits)
Cinematographer ⟷ Colorist    ← direct peer pairing (look ↔ grade)
Any crew → Any crew (async)   ← append to plans/<slug>/notes.md
```

Two shared docs power this:
- `plans/<slug>/notes.md` — async cross-cutting thoughts; everyone reads, no one owns
- `plans/<slug>/approvals.md` — producer's sign-off log per gate, with decisions on escalations

Director runs a **table read** after first-round plans land, identifying conflicts (e.g. cut at 7.7s vs music swell at 8.0s) and sending targeted revision asks. 1–2 revision rounds per stage is normal.

### Workflow at a glance

1. **User briefs the producer** → producer writes `plans/<slug>/brief.md`
2. **Producer hires video-director** → director runs the crew through these gates:
   - Script lock (screenwriter)
   - TTS first (narrator) — VTT becomes the master clock
   - Visual + audio planning in parallel (cinematographer, colorist, sound-designer)
   - Cut lock (editor)
   - Asset acquisition (animation-curator, music-supervisor, asset-hunter in parallel)
   - Composition lock (html-composer + motion-designer)
   - Final cut (composition-doctor lints + renders)
3. **Producer signs off final** → **improvement-scribe** logs the increment

### When to use the formal process vs concierge mode

**Formal (full crew):** new video, new brand, length change, new asset type added. The producer manages stage gates.

**Concierge mode:** typo fix, single icon swap, small CSS tweak, re-render after minor change. Producer skips creative team, goes straight to composition-doctor (or html-composer for tiny edits).

### When to specialise vs not

The reason the crew exists: each agent has stable I/O and benefits from context isolation. Don't add agents beyond this — these 12 cover film production. Future additions (sfx-coordinator when Freesound is wired, ai-image-generator when Replicate is wired) should still earn their keep.

**Note for new sessions:** Project-scoped agents need a Claude Code restart to register. After adding agents, ask the user to restart before relying on the new ones.

## 8. Things to try next (parking lot)

Open ideas that aren't blocked but haven't been done. Move into a real task list when you start one.

- **Fetch-orchestrator script** that takes a video plan (JSON) and dispatches all fetchers in parallel, respecting quotas.
- **Asset cache layer** — content-addressed (`assets/.cache/<hash>`) so re-runs of the same fetch don't re-hit the network.
- **Whisper captions for clips that AREN'T TTS** — use `whisper-node-addon` to transcribe arbitrary audio into VTT for the composition.
- **Replace HyperFrames preview** with our own simple Vite preview if the esbuild bug recurs.
- **Render-time overlay watermark** that adds the `aivideomaker` mark across all renders without editing the composition.
- **Auto-record memory** entries from this file's "Promoted to §3 / §4" items so they cross sessions.
