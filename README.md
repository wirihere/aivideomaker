# aivideomaker

Hyperframes-based daily-TikTok pipeline for Claim Mate. Renders HTML
compositions to mp4 via headless Chrome + ffmpeg, driven by Claude Code.

## What's here

- **`index.html`** — current video composition (1080×1920, 30s)
- **`assets/music/`** — music tracks + Pixabay workflow notes
- **`assets/logo/`** — brand favicon + brand rules (palette, type, logo HTML)
- **`assets/brand-animations/`** — two sibling-brand SVG animations
  (Claim Mate + Consent Mate)
- **`scripts/`** — helper scripts (fetch music, preview animations)
- **`renders/`** — rendered mp4 archive
- **`archive/`** — superseded compositions + scrapped brand experiments
- **`SESSION-LOG.md`** — full session log + next-session plan

## Quickstart

```bash
cd C:\Users\wirihere\aivideomaker
npx hyperframes preview          # live browser preview
npx hyperframes lint             # validate before render
npx hyperframes render -w 1      # render to mp4 (stable, slow)
```

## Important

- Render with `-w 1` on the current composition — `-w 2+` crashes on complex
  scenes. Details in `SESSION-LOG.md`.
- The brand is **cadastral / ordnance-survey** — paper, ink, muted navy, red.
  NO amber, NO bold stamps. See `assets/logo/README.md` for rules.
- ffmpeg may not be on PATH in existing shells after winget install — see
  `SESSION-LOG.md` "Gotchas".

## Read first next session

[SESSION-LOG.md](SESSION-LOG.md) — covers everything: what exists, what's
locked in, what v7 should be, open questions.
