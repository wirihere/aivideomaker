# Project structure

The pattern. If you can't find something, check this file. If you create something new, put it where the pattern says.

## Top level

```
aivideomaker/
├── CLAUDE.md            ← Claude Code instructions (read second on every session)
├── README.md            ← Project README
├── LEARNINGS.md         ← Cumulative session/wave history (Stage 10 of every video)
├── STRUCTURE.md         ← This file
├── package.json         ← Node config
├── hyperframes.json     ← HyperFrames config
├── meta.json            ← Project metadata (id, name)
├── index.html           ← Active render entry — composition currently being worked on
│
├── assets/              ← SHARED resources only (not per-brand)
├── compositions/        ← TEMPLATE & component library only (no per-brand .html files)
├── design/              ← Design system (shared CSS / JS / vendor)
├── docs/                ← Documentation (read first: docs/skills/how-a-video-gets-made.md)
├── renders/             ← Output MP4s, organized per-brand
├── scripts/             ← Build / render / capture scripts
├── videos/              ← PER-BRAND project homes (one folder per brand)
└── _archive/            ← Historical / superseded / scratch (don't read for current work)
```

## The per-brand pattern (videos/<brand>/) — CANONICAL LAYOUT

Every brand folder has the same shape. **First action when working on a brand: open `videos/<brand>/README.md`.**

### Scaffolding a new brand

Don't hand-create the folder structure — use the scaffold script:

```bash
node scripts/new-brand.mjs <slug> "Display Name" https://brand.url
```

This copies `videos/_template/` (the canonical template, lives at `videos/_template/`) into `videos/<slug>/`, fills in placeholders across all skeleton files, and creates `renders/<slug>/`. Takes 1 second. Result is the layout below.

```
videos/<brand>/
├── README.md            ← REQUIRED: status + pointers + render history. First thing to read.
├── DESIGN.md            ← REQUIRED: brand cheat-sheet (palette, type, tone, vibe). Stage 2 output.
├── SCRIPT.md            ← REQUIRED once a video has been built: latest narration script. Stage 4 output.
├── STORYBOARD.md        ← Optional: per-beat creative direction. Only when a new template is being designed.
├── script.txt           ← Plain-text version of latest SCRIPT.md (used by TTS script).
├── tokens.css           ← Brand design tokens (--brand-*, --paper, --ink, type vars). May be absent if brand uses a register's defaults.
├── effects.css          ← Brand-specific ported effects from CATALOG.json. Created when first effect is ported.
│
├── capture/             ← Stage 1 scrape artifacts. Always present after Stage 1.
│   ├── scrape.json
│   ├── extracted/
│   │   ├── tokens.json
│   │   ├── visible-text.txt
│   │   ├── asset-descriptions.md
│   │   └── animations.json (if site has them)
│   ├── screenshots/     (scroll-000.png through scroll-NNN.png)
│   └── assets/          (downloaded brand SVGs, logo, photos)
│
├── compositions/        ← All composition .html files + sibling JSON metadata.
│   ├── <name>.html
│   ├── <name>.copy.json   (slot-fills from Stage 3)
│   ├── <name>.meta.json   (template name + version + voice + music)
│   └── <name>.music.json  (chosen music track + volume)
│
├── voiceover/           ← TTS files (.mp3 + .vtt). One pair per script version.
│   ├── <name>.mp3
│   └── <name>.vtt
│
└── assets/              ← Brand-specific assets ported FROM capture/assets/ for use in compositions.
    ├── <brand-svg>.svg
    └── ...
```

### Optional: variants

For brands with multiple "tones" or "treatments" (e.g. kindred-nz had override + tone variants), use sibling files / folders with the variant in the suffix:

```
videos/<brand>/
├── tokens.css                ← main
├── tokens-override.css       ← variant
├── tokens-tone.css           ← variant
├── assets/                   ← main
├── assets-override/          ← variant
└── assets-tone/              ← variant
```

### Path convention inside compositions

All `src=`/`href=` references use **root-relative** paths (no `../`):

```html
<!-- Shared resources -->
<link rel="stylesheet" href="design/cards-contemplative.css">
<audio src="assets/music/contemplative-1.mp3">

<!-- Brand-specific (always under videos/<brand>/) -->
<link rel="stylesheet" href="videos/kindred-nz/tokens.css">
<link rel="stylesheet" href="videos/kindred-nz/effects.css">
<audio src="videos/kindred-nz/voiceover/kindred-nz.mp3">
<img src="videos/kindred-nz/assets/logo.svg">
```

This works for both in-place preview AND after promotion to root `index.html` for render — no path adjustment needed.

**Path references inside compositions:** all root-relative (no `../`). Example:
```html
<link rel="stylesheet" href="design/cards-contemplative.css">    <!-- shared -->
<link rel="stylesheet" href="videos/kindred-nz/tokens.css">      <!-- brand -->
<audio src="videos/kindred-nz/voiceover/kindred-nz.mp3">         <!-- brand -->
<audio src="assets/music/contemplative-1.mp3">                   <!-- shared -->
```

This pattern works because:
- Preview server serves the project root, so root-relative paths resolve correctly.
- Render uses index.html at root; root-relative paths resolve correctly there too.
- No path adjustment needed when promoting a composition to index.html.

## Shared resources (assets/)

Only put things here that are NOT specific to one brand.

```
assets/
├── music/               ← Music library (per-register tracks)
├── music-shortlists/    ← JSON shortlists per register (Stage 6 reference)
├── photos/              ← Generic stock photos
├── icons/               ← Generic icon SVGs
├── sfx/                 ← Sound effects
├── tts/                 ← TTS asset cache
├── voice-library/       ← Voice samples / picks
├── svg-animations/      ← Reusable SVG animation library
├── voiceover/           ← Should be EMPTY of per-brand files; per-brand TTS lives in videos/<brand>/voiceover/
├── logo/                ← (legacy)
├── amp/                 ← (legacy — audio amplitude data)
├── brand-animations/    ← (legacy)
├── brand-capture/       ← (legacy — re-do via Stage 1 capture instead)
└── videos/              ← (legacy — old video assets; now per-brand under videos/<brand>/)
```

If you find yourself creating `assets/<brand>/`, stop — put it under `videos/<brand>/assets/` instead.

## Design system (design/)

```
design/
├── cards-*.css          ← Per-register card library (cards-contemplative.css, cards.css)
├── effects-batch-*.css  ← Effect libraries
├── modules/             ← Shared JS modules
├── vendor/              ← Third-party JS (gsap.min.js, etc.)
├── templates/           ← Per-register CSS templates (warm-community.css, etc.)
├── compose-head.html    ← (legacy)
├── preview.html         ← (legacy)
└── svg-contemplative.svg ← (legacy SVG)
```

Per-brand design tokens used to live here as `tokens-<brand>.css` — they've been moved to `videos/<brand>/tokens.css`.

## Compositions library (compositions/)

```
compositions/
├── README.md
├── _demos/              ← Demo compositions for testing effects/components
├── templates/           ← Locked & in-progress templates (per-register subfolders)
├── verticals/           ← Industry-specific templates (ecommerce, hospitality, realestate, saas)
├── backgrounds/         ← Reusable background components
├── cards/               ← Reusable card components
└── overlays/            ← Reusable overlay components
```

This folder holds the TEMPLATE LIBRARY. Per-brand composition .html / .json files do NOT live here — they live under `videos/<brand>/compositions/`.

## Renders (renders/)

```
renders/
├── consentmate/                     ← Per-brand subfolder
├── kindred-nz/
└── singularity-convergence/
```

When rendering, the output goes to `renders/<brand>/<filename>.mp4`. Use `renders/<brand>/<file>-graded.mp4` as the canonical surface (no watermark, color-graded).

## Documentation (docs/)

The founding doc is the single source of truth. Read it second on every video task.

```
docs/
├── skills/
│   └── how-a-video-gets-made.md     ← FOUNDING DOC (read first, always)
├── playbooks/                        ← Stage 7 detail (composition assembly, music, transitions, etc.)
├── render-learnings/
│   ├── LEDGER.md                    ← Per-render verdict log (Stage 10)
│   ├── SUGGESTIONS.md               ← Cross-render pattern library
│   └── _per-render/                 ← Auto-generated per-render reports (history)
├── swipe/                           ← Stage 3 outer loop swipe files
├── copy-research/                   ← Stage 3 reference shelf (Schwartz, Caples, etc.)
├── rd/                              ← R&D notes
├── effects/                         ← Effect library docs
├── design-bundles/                  ← Reusable design-system bundles (effect HTML reference)
├── social-video-patterns.md         ← Stage 8 layout rules (S1-S20+)
├── template-models.md               ← Step 0 / locked template registry
├── copy-playbook.md                 ← Used at runtime by scripts/extract-copy.mjs
├── QUICKSTART.md                    ← First-time setup walkthrough
├── render-vite-roadmap.md           ← Renderer architecture roadmap
└── _archive/                        ← Superseded older process docs (don't read)
```

## Archive (_archive/)

If something isn't actively used, it goes here. Do not read these for current work.

```
_archive/
├── legacy-folders/                  ← Old top-level folders (debug/, plans/, smoke/, tmp/, combos/, claude-design-upload/)
├── legacy-index-files/              ← Old index-v*.html versions + .bak files
├── legacy-renders/                  ← Old aivideomaker_*.mp4, work dirs, frame folders, render logs
├── test-brands/                     ← Test/scratch brand artifacts (assets, compositions, design tokens, voiceovers)
└── session-logs/                    ← Old session handoff logs
```

## The patterns — the short version

| If you have… | Put it here |
|---|---|
| Brand-specific anything | `videos/<brand>/` (with the structure above) |
| Shared asset (music, photo, icon, sfx) | `assets/<type>/` |
| Shared design system (CSS, JS, vendor) | `design/` |
| Reusable composition template | `compositions/templates/<register>/` or `compositions/verticals/` |
| Reusable component (card, background, overlay) | `compositions/<type>/` |
| Documentation | `docs/` (and update the manifest in `docs/skills/how-a-video-gets-made.md` if it's a new companion doc) |
| Render output | `renders/<brand>/` |
| Old / scratch / superseded | `_archive/<category>/` |
| New session handoff | `videos/<brand>/NEXT-SESSION.md` (per-brand, not at root) |

## What does NOT belong at root

- Per-brand compositions, assets, voiceovers, design tokens (use `videos/<brand>/`)
- Backup .html.bak files (use `_archive/legacy-index-files/`)
- Debug screenshots / scratch JSON (use `_archive/legacy-folders/root-debris/` or just delete)
- Test/scratch brand stuff (use `_archive/test-brands/`)
- Session-specific handoff docs (use `videos/<brand>/NEXT-SESSION.md`)

The root .md files are exactly: `CLAUDE.md`, `README.md`, `LEARNINGS.md`, `STRUCTURE.md`. Nothing else.
