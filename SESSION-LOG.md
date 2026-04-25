# aivideomaker — session log · 2026-04-23 / 24

The first session scaffolding the Claim Mate daily-TikTok pipeline. Below is
what exists, what was learned, and what the next session picks up.

---

## Where we got to in one paragraph

Scaffolded a Hyperframes-based video pipeline at `C:\Users\wirihere\aivideomaker`.
Rendered six test videos (v1 → v6) to prove the end-to-end flow — HTML
composition → headless Chrome frame capture → ffmpeg mp4. Wired in real
Pixabay music via a Playwright script that intercepts the track URL from the
network (Pixabay has no music API). Built the project around the wrong brand
(bold amber "stamp" aesthetic) then caught the mistake — the real Claim Mate
brand is cadastral/ordnance-survey, matching the live site. Corrected by moving
wrong assets to `archive/wrong-logo-v1/` and producing **two sibling-brand SVG
animations** (paper + tick + wordmark) that match the site exactly. v7 video
and live-site favicon push are queued for next session.

---

## Installed and configured (once, stays)

| Tool                                  | How                                                         | Notes                                                                     |
| ------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Hyperframes**                       | `npx hyperframes init .`                                    | No persistent install — invoked via `npx` each render.                   |
| **ffmpeg 8.1**                        | `winget install Gyan.FFmpeg`                                | New shells get it on PATH; see gotcha below.                              |
| **Claude Code skills** (5 of them)    | `npx skills add heygen-com/hyperframes --yes --global`      | `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `website-to-hyperframes`, `gsap`. Symlinked to Claude Code globally. Restart Claude Code to see them as slash-commands. |
| **Playwright + Chromium**             | `npm i -D playwright && npx playwright install chromium`    | Used only by helper scripts (music fetch, animation preview).             |
| **Claude Agent SDK**                  | `npm i -D @anthropic-ai/claude-agent-sdk`                   | Not yet used in-pipeline — reserved for when Claude Code drives renders.  |
| **Node 24.14.0 / npm 11.9.0**         | Pre-existing on machine                                     | Hyperframes needs ≥ 22. Fine.                                             |

---

## Core commands (copy-paste)

```bash
cd C:\Users\wirihere\aivideomaker

# Live preview in browser (the "studio")
npx hyperframes preview

# Render the current composition to mp4 (uses 1 worker — see gotchas)
npx hyperframes render -w 1

# Validate before render
npx hyperframes lint

# Local docs (no network)
npx hyperframes docs examples

# Fetch a Pixabay music track by search term
node scripts/fetch-pixabay-music.mjs "corporate upbeat" track.mp3

# Generate a 30s faded version of the track (for final render)
ffmpeg -y -i assets/music/track.mp3 -t 30 \
  -af "afade=t=out:st=27:d=3" assets/music/track-faded.mp3

# Preview brand animations (opens preview.html, screenshots at t=5s)
node scripts/preview-brand-animations.mjs
```

---

## Gotchas and lessons

1. **Render concurrency.** Complex compositions with blur/stagger/particle
   effects crash at 6 workers (Hyperframes default) on this machine.
   v2/v3 failed with "Worker N: Protocol error Page.captureScreenshot" at ~60%
   progress. Use `-w 2` for moderate comps; `-w 1` for anything with a blur
   filter or 10+ animated elements. Slower but stable. Trade speed for
   reliability — daily renders don't need sub-minute times.

2. **ffmpeg not on PATH in existing shells after winget install.** The path
   variable only updates for *new* shells. In the current Git Bash session,
   prepend the bin dir:
   ```bash
   export PATH="/c/Users/wirihere/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
   ```

3. **Pixabay has no music API.** The `scripts/fetch-pixabay-music.mjs`
   solution works but relies on Pixabay's page structure. If their UI changes,
   the script breaks. Swap to a real API (ElevenLabs, Beatoven) when volume
   matters.

4. **Interactive CLI prompts block `npx` from Claude.** Both
   `npx create-video@latest` (Remotion) and `npx skills add` default to
   interactive prompts. Use `--yes --global` for `skills`; use
   `--hello-world` + redirect stdin for scaffolds. If the prompt uses arrow
   keys (like Remotion's Tailwind question), automate via `yes "No" | ...`.

5. **Project folder location.** Keep out of OneDrive. `C:\Users\wirihere\`
   appears fine — the other Claim Mate projects live there without issue.
   If renders fail with "file locked" errors, move to `C:\dev\`.

6. **`<audio>` tag must have an `id`.** Linter catches this; without an id,
   the renderer silently drops the audio at render time.

7. **Multiple `data-composition-id` at root = lint error.** Moved `index-v1.html`
   to `archive/` because having it next to `index.html` confused the discovery
   step. All experimental composition backups go to `archive/`.

---

## File structure (current)

```
C:\Users\wirihere\aivideomaker\
├── index.html                     # current composition (v6, to be replaced)
├── hyperframes.json               # framework config (don't edit)
├── meta.json                      # project metadata
├── CLAUDE.md                      # Hyperframes-generated skill guide (don't edit)
├── AGENTS.md                      # Hyperframes-generated agent guide (don't edit)
├── SESSION-LOG.md                 # THIS FILE
├── README.md                      # project quickstart
├── package.json / package-lock.json
├── node_modules/                  # Playwright + Agent SDK only
│
├── assets/
│   ├── music/
│   │   ├── track.mp3              # live Pixabay "corporate upbeat" (2 min, 256 kbps)
│   │   ├── track-faded.mp3        # 30s pre-faded for final render
│   │   └── music-library.md       # Pixabay workflow notes
│   ├── logo/
│   │   ├── claim-mate-favicon.svg # real favicon, mirrored from live site
│   │   └── README.md              # CORRECT brand rules (palette, type, logo HTML)
│   └── brand-animations/
│       ├── claim-mate-paper-tick.svg    # 4.2s paper → DECLINED → navy tick
│       ├── consent-mate-paper-tick.svg  # sibling; paper → green tick → READY
│       └── preview.html           # side-by-side viewer for both
│
├── scripts/
│   ├── fetch-pixabay-music.mjs          # network-intercept Pixabay mp3 download
│   └── preview-brand-animations.mjs     # headless render screenshot of preview.html
│
├── renders/                       # 6 mp4s, keyed by ISO timestamp
│
├── debug/                         # Playwright fail dumps, screenshots
│
└── archive/
    ├── index-v1.html              # first simple-cards composition
    ├── index-v4.html              # v4 with Playwright-fetched music
    ├── index-v5.html              # v5 document-reveal concept
    ├── index-v6.html              # v6 amber-stamp (wrong brand)
    └── wrong-logo-v1/             # the scrapped amber lockup files
```

---

## Decisions locked in

These were debated during the session. Don't re-argue next time without a
reason:

- **Tool stack: Hyperframes** (not Remotion). HTML-native, Apache 2.0, fits
  agent-driven workflow. Remotion's licence threshold kicks in at 4+ employees;
  Hyperframes stays free forever.
- **Music: Pixabay via Playwright script for v1–v10.** Upgrade to ElevenLabs
  Eleven Music ($22/mo) when volume hits daily or when unique-per-video
  matters. No Suno — no official API.
- **TTS: deferred.** Record own voice first if voice becomes necessary. NZ
  accent > any AI voice for an ACC-fighting audience. ElevenLabs Creator
  bundles TTS with music if both become needed.
- **Music fade-out: pre-processed with ffmpeg `afade`** before rendering.
  Baked into `track-faded.mp3`. Keeps volume control deterministic.
- **Brand: cadastral / ordnance-survey.** Paper `#eef1f5`, ink `#0d1826`,
  muted-navy accent `#1f3a68`, warn-red `#9a3a3a`. NO amber. NO bold stamp.
  JetBrains Mono for labels, Inter 400–600 for body, Instrument Serif italic
  for emphasis. Rules live in `assets/logo/README.md`.
- **Render defaults: `-w 1`** for current compositions. `-w 2` if simplified.
- **Keep `archive/`** as the graveyard for superseded compositions and
  brand experiments. Don't delete — future Claude sessions learn from mistakes.

---

## Six renders so far

| Version | File (renders/)                   | Size   | Render time | Workers | What it was                                                                 |
| ------- | --------------------------------- | ------ | ----------- | ------- | --------------------------------------------------------------------------- |
| v1      | `aivideomaker_2026-04-23_00-18-06.mp4` | 781 KB | 36s         | 6       | Simple fade-card hello-world. Proof the render works.                       |
| v2      | `aivideomaker_2026-04-23_00-31-45.mp4` | 4.6 MB | 2m 29s      | 2       | Rich GSAP animations (wall break, stagger cards). First -w 6 attempt crashed. |
| v3      | `aivideomaker_2026-04-23_00-50-13.mp4` | 4.7 MB | 3m 8s       | 1       | v2 + silent placeholder audio track. Proves audio pipeline works.           |
| v4      | `aivideomaker_2026-04-23_01-07-52.mp4` | 5.3 MB | 3m 10s      | 1       | v2 + real Pixabay music (corporate upbeat, 2 min).                          |
| v5      | `aivideomaker_2026-04-23_01-22-48.mp4` | 2.8 MB | 1m 41s      | 1       | Document-reveal concept (letter mockup + highlighter + translate). Fade-out music baked in. |
| v6      | `aivideomaker_2026-04-23_01-33-37.mp4` | 2.9 MB | 1m 34s      | 1       | "Meet Claim Mate" brand intro with WRONG amber logo. To be redone as v7.    |

Keep all six. They're the record of what was tried.

---

## Two brand SVG animations (approved this session)

At `assets/brand-animations/`. Both are pure SVG + SMIL — embed anywhere
(site hero, email signatures, video intros, as loading states). No JS needed.

- **`claim-mate-paper-tick.svg`** (4.2s)
  Paper slides up → "ACCIDENT COMPENSATION CORPORATION" letterhead +
  ref/body lines fade in → red DECLINED stamp slams at 1.35s → navy tick
  draws across it at 2.2s → navy approval badge → `claim/mate` wordmark.

- **`consent-mate-paper-tick.svg`** (4.2s)
  Paper slides up → "RESOURCE CONSENT APPLICATION · RMA s.88" letterhead
  + form fields → green tick draws as signature at 2.0s → green approval
  badge → `consent/mate` wordmark → STATUS row "READY TO LODGE".

Preview HTML at `assets/brand-animations/preview.html`. Double-click to view
both side-by-side in the browser.

---

## Helper scripts

- **`scripts/fetch-pixabay-music.mjs`** — takes a search term, drives
  headless Chrome to Pixabay's music search page, clicks the first track's
  play button, intercepts the mp3 URL from network traffic, downloads it
  via Playwright's request context (preserves cookies / referer). Saves to
  `assets/music/<name>.mp3`. Reusable — change the search term on each call.

  Known fragility: Pixabay's UI may change. If the script breaks, re-run with
  `debug/` dumps and update the selector strategies in the script.

- **`scripts/preview-brand-animations.mjs`** — opens
  `assets/brand-animations/preview.html` in headless Chrome, waits 5s for
  SMIL animations to complete, screenshots to `debug/brand-animations-preview.png`.
  Sanity check the SVGs render correctly after any edit.

---

## Legal flags (noted this session)

1. **"ACCIDENT COMPENSATION CORPORATION" visible on the Claim Mate
   animation paper.** Low risk, not zero. Nominative-fair-use lean — you're
   naming the entity you help people fight. Enforcement against a small
   NZ business is rare, but if this scales, expect a lawyer letter. Risk
   accepted and moved on. If removing later: swap to "DECISION NOTICE" +
   smaller "ACC · Ref 4387291" line.

2. **Lay-advocate boundary.** Keep every video on the "here's how the system
   works" side. Never "your claim is probably X". See
   `C:\Users\wirihere\acc helper\CLAUDE.md` for the full framework.

3. **Register the Ltd before posting video #1 publicly.** Already in the
   main project plan.

---

## Next session plan (in priority order)

### 1. v7 video — rebuild with correct brand

Scrap v6 entirely. Write `index.html` v7 using:
- The cadastral palette (paper, ink, muted navy, warn red — NO amber)
- JetBrains Mono labels + Inter 600 headlines + Instrument Serif italics
- The `claim-mate-paper-tick.svg` animation as the logo-reveal scene
  (embed as `<img>` or inline SVG, start it at scene onset)
- Same narrative beats as v6: hook → logo reveal → promise → how-it-works → CTA
- Keep it ≤ 30s, 1080×1920, `-w 1` render

Render, lint, review with Wiri. Iterate once based on feedback.

### 2. Push brand assets to live site

In `C:\Users\wirihere\claim-mate\landing-page\`:
- Replace `favicon.svg` with the one from
  `C:\Users\wirihere\aivideomaker\assets\logo\claim-mate-favicon.svg`
  (they should already match — verify before replacing).
- Drop `claim-mate-paper-tick.svg` into the site's hero or above-the-fold
  section if Wiri wants the animation there too.
- Add the legal disclaimer: "Claim Mate is a lay advocate service. Not legal
  advice. Not affiliated with ACC."

### 3. Music track for v7

Two options:
- **Keep the current `track-faded.mp3`** (corporate upbeat, 30s, 3s fade). Works.
- **Fetch a new track** fitting the documentary tone of the new brand.
  `node scripts/fetch-pixabay-music.mjs "documentary serious" documentary.mp3`.
  Then re-fade and point the composition at the new file.

Wiri's call.

### 4. Render-time optimisation (defer unless it hurts)

Current: ~1m 30s per render at `-w 1`. Fine for ad-hoc. Problem when daily.

Cheap wins if needed:
- Drop the `filter: blur(20px)` on `.bg-glow` → render with `-w 2` safely.
- Cache first-frame compile (already does).
- Pre-render the brand animation once, play as video inside the composition.

### 5. Consent Mate side-track (if Wiri wants)

The `consent-mate-paper-tick.svg` is sitting unused. If Consent Mate wants
the same treatment:
- Drop the SVG into `C:\Users\woody\consent-prep-nz\landing-page\` as a
  hero element.
- Build a parallel Consent Mate video in a separate project folder (don't
  mix with Claim Mate content).

### 6. Bigger questions to settle

- **When to move from Pixabay to ElevenLabs music?** Rough trigger: 15
  published videos or when repetition becomes obvious.
- **When (if ever) to add TTS?** Still unresolved. Record-own-voice path
  was the recommended default. If Wiri tries three videos with his own
  voice and hates it, then ElevenLabs.
- **Cadence.** 1 per week? 3 per week? Daily? Affects whether the render
  time matters and whether this pipeline scales or gets outsourced.

---

## Open questions for next session

- Does Wiri want v7 rendered cold (start fresh) or continue iterating on the
  v5 document-reveal concept with the corrected brand?
- Should the Claim Mate site's footer get a "Never take NO for an answer."
  motto, matching what would go on the video outro?
- Is the legal disclaimer wording Wiri wants going to come from him, or
  from a friendly lawyer? (Relevant to when v7 can go live.)
