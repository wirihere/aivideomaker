# QUICKSTART

Goal: clone → first rendered MP4 in under 10 minutes. This guide walks
through the pipeline manually so you understand what `npm run video --
<url>` is doing under the hood, and shows the iteration loop for editing
a composition.

For the one-liner happy-path, see the project [README](../README.md).
For "why does X work the way it does", see [LEARNINGS.md](../LEARNINGS.md).

---

## 1. Clone + install

```bash
git clone <repo-url> aivideomaker
cd aivideomaker
npm install
```

`node` must be 22+. `ffmpeg` must be on PATH. On Windows, winget puts ffmpeg
on the Windows user PATH but **not** on a fresh bash session's PATH — see
[LEARNINGS §2](../LEARNINGS.md#2-working-setup-verified-to-work) for the
one-line `export PATH=...` workaround.

## 2. Smoke test the setup

```bash
npm run check
```

`check` runs `npm run lint` + `npm run smoke`. The smoke test boots
playwright, loads `index.html`, seeks to each scene midpoint, and verifies
no console errors / no missing module globals / no dimension mismatches.
Should finish in ~1-3 seconds with **9+ passes, 0 failures**. If it errors,
fix that before going further — every later stage assumes a clean baseline.

If the smoke test passes but you want to eyeball the result:

```bash
npm run smoke:shots          # writes screenshots to smoke/
```

## 3. Pick a vibe template

Vibe templates set pacing, motion easing, type scale, shadow depth, and a
recommended LUT. They're in `design/templates/`:

| Vibe              | Use for                                                       |
| ----------------- | ------------------------------------------------------------- |
| `warm-community`  | community apps, healthcare, eco brands. Gentle pacing, soft   |
|                   | crossfades. Default for SaaS.                                 |
| `kinetic-pop`     | DTC products, social reels, FAQ, before/after. Snappy stagger,|
|                   | whip transitions, bold display.                               |
| `documentary`     | founder stories, case studies, testimonials. Slow holds,      |
|                   | letterbox, muted grade.                                       |
| `quiet-premium`   | luxury / hospitality / spa / real estate hero. Long fades,    |
|                   | tight type, minimal motion.                                   |

Pick **one** per video — mixing them produces palette/typography clash.

## 4. Pick a structural template

Structural templates set scene count + duration + form. They live in
`compositions/templates/` (general) and `compositions/verticals/`
(industry-specific).

**General (`compositions/templates/`)**, 8 templates:

- `social-reel-15s.html`
- `before-after-20s.html`
- `hero-promo-30s.html`
- `product-launch-30s.html`
- `faq-quick-30s.html`
- `testimonial-45s.html`
- `case-study-60s.html`
- `founder-story-60s.html`

**Vertical (`compositions/verticals/`)**, 17 templates across:

- `ecommerce-` (2)
- `hospitality-` (3)
- `realestate-` (3)
- `saas-` (3)
- `trades-` (3)
- `wellness-` (3)

`npm run video -- <url> --seconds=N` auto-picks a structural template by
duration: ≤20s → social-reel, ≤35s → hero-promo, ≤50s → testimonial, ≤75s →
case-study. Override with `--template=<name>`.

## 5. Browse the effects catalog

```bash
start docs/effects-catalog.html      # Windows
open  docs/effects-catalog.html      # macOS
```

Visual grid of all 23 GSAP recipes — 13 primitives (text-fx, effect-fx,
glitter-fx) + 10 combos (comboFx.superImpact, cinematicReveal, hyperGlitch,
…). Each card shows a peak-frame thumbnail, the one-line API call, and a
copyable recipe. Source lives in `design/modules/`.

Regenerate after editing any module:

```bash
npm run catalog                       # rebuilds thumbnails + HTML index
```

## 6. The hero command

```bash
npm run video -- https://example.com
```

Stages, in order:

```
[1/7] brand extract    → design/tokens-example.css
[2/7] copy generate    → assets/example/copy.json    (skipped if extract-copy missing)
[3/7] asset pull       → assets/example/             (skipped if pull-assets missing)
[4/7] music pick       → candidate tracks            (skipped if pick-music missing)
[5/7] assemble         → index.html
[6/7] quality gate     → npm run check
[7/7] render           → renders/example-<ts>-graded-wm.mp4
```

Useful flags:

- `--seconds=N` — drives template auto-pick (default 30).
- `--template=<name>` — explicit pick from `social-reel | hero-promo |
  product-launch | before-after | faq-quick | testimonial | founder-story |
  case-study`.
- `--name=<slug>` — override the URL-derived slug.
- `--with-music` — wire the picked track into the comp (default: shortlists
  but doesn't insert).
- `--no-render` — assemble + quality-gate only, skip the 5-minute render.
- `--auto-fix` — run `npm run fix:apply` automatically if quality gate fails.
- `--keep-artifacts` — don't restore `index.html` at the end (for inspection).

`index.html` is restored from backup via `try/finally` even on crash.

## 7. The iteration loop

Once a composition exists (either from `npm run video` or hand-authored):

```bash
# 1. Edit index.html (or a comp under compositions/)
# 2. Re-bundle modules if you touched design/modules/*
npm run build:bundle

# 3. Quality gate (lint + smoke, ~3s)
npm run check

# 4. Visual check in the browser
npm run preview:simple              # zero-dep static server, :3003
                                    # play/pause/scrub/restart UI
                                    # Space, R, ←→, 0 keybinds

# 5. Render when ready
npm run render -- -- --gpu -w 2     # double `--`: first for npm, second for render.mjs
```

Common loops:

- **Tweak palette/fonts:** edit `design/tokens-<slug>.css`, save,
  `npm run check`.
- **Swap a scene's effect recipe:** edit the relevant `tl.fromTo(...)` or
  `textFx.<recipe>(tl, "#title", { at, duration })` call, save,
  `npm run preview:simple` to eyeball, render when satisfied.
- **Replace a stock asset:** preview the new asset first
  (`ffmpeg -ss 0.5 -i <file> -frames:v 1 preview.jpg`) per
  [LEARNINGS §4 "Pre-render asset preview is non-optional"](../LEARNINGS.md#4-pitfalls-read-me-first),
  then swap the `<img src>` / `<video src>` / `<audio src>`.

## 8. Render output

`npm run render` (and stage 7 of `npm run video`) produces:

```
renders/<slug>-<YYYY-MM-DD_HH-MM-SS>-graded.mp4
renders/<slug>-<YYYY-MM-DD_HH-MM-SS>-graded-wm.mp4   # with --watermark
```

The graded version applies a procedural 3D LUT (default `pop`) via
`scripts/post-grade.mjs`. Override with:

- `--lut=teal-orange|noir|warm|cool|pop|vintage` — built-in grades.
- `--lut=path/to/custom.cube` — bring-your-own.
- `--strength=0..1` — blend between original and graded.
- `--no-grade` — skip the post-pass entirely.
- `--watermark` — overlay watermark (see `scripts/render.mjs --help`).
- `--replace` — overwrite the source MP4 instead of writing `-graded.mp4`.

Pass-through flags to the underlying `npx hyperframes render` go after a
**second** `--` (the first is npm's separator, the second is render.mjs's):

```bash
npm run render -- -- --gpu -w 2              # 2 workers + GPU
npm run render -- --no-grade -- --gpu -w 4   # skip grade, then 4 workers
```

`render.mjs`'s own flags (`--lut`, `--strength`, `--no-grade`, `--watermark`,
`--replace`) go between the npm `--` and the second `--`. Anything after the
second `--` is forwarded verbatim to `npx hyperframes render`.

Render time on a 16GB Windows box for a 30s comp with 1 video + 10 clips:
~5-7 min at `-w 2`, ~3 min at `-w 4` (but `-w 4+` crashes on heavy comps —
see LEARNINGS §4).

## 9. Common gotchas

[LEARNINGS §4 — Pitfalls](../LEARNINGS.md#4-pitfalls-read-me-first) is the
authoritative list. Highlights:

- **`<video>` bleeds across earlier scenes** — set `style="opacity:0"`
  inline + drive opacity via GSAP `tl.set()` brackets.
- **`tl.from()` sticks at "from" state on seek** — use `tl.fromTo()` with
  explicit start AND end values.
- **`</script>` literal in JS comments** breaks inline-bundled scripts —
  write `<\/script>` in any comment that includes the tag.
- **One `data-track-index` = one audio channel** — overlapping SFX must use
  different track indices (project convention: 20+ for SFX, one per audio).
- **Inventing facts about real brands** — DO NOT. If stats aren't verified,
  use brand voice instead of numbers.
- **Māori words in TTS narration** — English equivalents only ("New Zealand"
  not "Aotearoa") — Edge TTS mispronounces te reo.
- **ffmpeg filter parser breaks on `C:\` paths** — spawn ffmpeg with
  `cwd: projectRoot` and pass relative paths inside filters.

## 10. npm script reference

Every script in `package.json`. Run `npm run` with no args to list them.
**This table is regenerated from source comments by `npm run help -- --md`** —
edit the script's leading-comment block to update its description, not the
table here.

| Script | Group | Description |
| ------ | ----- | ----------- |
| `build:bundle` | build | Build a single-file bundle of every design module — text-fx, effect-fx, |
| `watch:bundle` | build | Watch design/modules/ + scripts/lib/ and rebuild the bundle on save. |
| `new:comp` | new | Scaffolder — turn a URL into a working HyperFrames composition in one shot. |
| `new:copy` | new | Copy generation supervisor — turns a URL + template into a video-ready |
| `new:scene` | new | TTS-first scene scaffolder. |
| `preview` | preview | hyperframes preview (vendor CLI) |
| `preview:simple` | preview | Standalone preview server — a minimal alternative to `npx hyperframes preview`. |
| `smoke` | preview | Smoke test — fast pre-render sanity check for the active composition. |
| `smoke:baseline` | preview | (smoke + `--update-baseline`) |
| `smoke:contrast` | preview | (smoke + `--contrast`) |
| `smoke:diff` | preview | (smoke + `--diff`) |
| `smoke:shots` | preview | (smoke + `--screenshots`) |
| `render` | render | Render wrapper — runs `hyperframes render`, then auto-applies post-grade, |
| `render:queue` | render | Render queue — sequentially render multiple composition files to MP4. |
| `render:vite` | render | Custom renderer (Phase 1 + 2 + 3) — Playwright frame capture + ffmpeg encode |
| `renders:list` | renders | renders-prune.mjs — list / dry-run / prune MP4s in renders/. (`--list`) |
| `renders:prune` | renders | renders-prune.mjs — list / dry-run / prune MP4s in renders/. |
| `video` | video | Master pipeline orchestrator — turn a URL into a rendered MP4 in one command. |
| `cache:clear` | cache | Content-addressed cache for fetched assets. (`clear`) |
| `cache:stats` | cache | Content-addressed cache for fetched assets. (`stats`) |
| `pick:music` | fetch | Music auto-pick supervisor — reads a curated shortlist JSON for a given template |
| `pull:assets` | fetch | Brand asset puller — given a URL + slug, downloads the brand's reusable |
| `check` | lint | chains: lint + lint:strict + check:heads + smoke |
| `fix` | lint | fix.mjs — auto-fix scanner for HyperFrames compositions. |
| `fix:apply` | lint | fix.mjs — auto-fix scanner (`--apply`). |
| `lint` | lint | hyperframes lint (vendor CLI) |
| `lint:strict` | lint | lint-strict.mjs — CI-gateable strict linter for the recurring §4 pitfalls. |
| `catalog` | catalog | Build a visual reference catalog of every GSAP recipe in design/modules/. |
| `comp:check` | catalog | Composition versioning manifest. (`check`) |
| `comp:list` | catalog | Composition versioning manifest. (`list`) |
| `comp:write` | catalog | Composition versioning manifest. (`write`) |
| `check:heads` | other | Composition versioning manifest. (`heads` — drift-detects the 25 head fragments) |
| `copy:gen` | other | Copy generation supervisor — Anthropic-API-driven framework copy gen. |
| `help` | other | Self-documenting help for `npm run <script>`. |

For deep usage of any script, run `node scripts/<name>.mjs --help` or skim
the file's leading comment block — every script in `scripts/` has a
top-of-file usage block.
