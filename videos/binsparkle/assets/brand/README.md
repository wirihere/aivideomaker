# BinSparkle brand assets (in-factory copy)

These are **copies**, synced from the canonical brand kit that lives with the
website:

- Logos: `bin-sparkle/landing-page/assets/brand/` (canonical)
- Fonts: `bin-sparkle/landing-page/assets/fonts/` (canonical, woff2 web subsets)

They are mirrored here under `videos/binsparkle/assets/brand/` and
`videos/binsparkle/assets/fonts/` so the content factory is **self-contained** —
compositions can reference brand logos/fonts without depending on a separate
repo. Per `STRUCTURE.md`, brand-specific assets live under `videos/<brand>/assets/`.

## Source of truth

**The website (`bin-sparkle/landing-page/assets/`) remains canonical.** If the
brand kit ever changes there, re-copy here:

```powershell
$src = 'C:\Users\wirih\repos\bin-sparkle\landing-page\assets'
Copy-Item "$src\brand\*.svg"  'videos\binsparkle\assets\brand\' -Force
Copy-Item "$src\fonts\*.woff2" 'videos\binsparkle\assets\fonts\' -Force
```

Brand **colours** are deliberately NOT duplicated here —
`videos/binsparkle/tokens.css` is the single in-factory source for colour/type
tokens (hand-set from `cadastral.css`, see its header comment). Edit colours
there, not via copies of `cadastral.css`.

## What's here

- `brand/` — 7 logo SVGs: primary (`binsparkle-logo.svg`), stacked, mono,
  dark-bg, mark (icon), favicon, plus `mark.svg` (the site-loaded variant).
- `fonts/` — 10 woff2 web subsets: Bricolage Grotesque (display), Inter (UI),
  Fraunces (serif, normal + italic), JetBrains Mono. Latin + Latin-Extended.

Note: these are **web fonts** (woff2), not installable desktop fonts. The
compositions load Bricolage Grotesque + Inter via Google Fonts (`tokens.css`
`@import`), so they render even without these files — but having them local
removes the network dependency and keeps the factory hermetic.
