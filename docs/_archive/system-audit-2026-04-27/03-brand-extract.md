> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# 03 — Brand Extraction Pipeline Audit

URL → tokens/copy/assets pipeline. Tested 5 contemplative-premium brand homepages on 2026-04-27.

## Pipeline shape

- `scripts/lib/scrape-page.mjs` — Playwright; one shared evaluate call. Returns title / metaDescription / og / json-ld / h1-h3 / paragraphs / listItems / ctaCandidates / visibleText. Fail-soft: per-selector try; DCL → load fallback; 1.5 s settle.
- `scripts/extract-copy.mjs` — URL mode (curl + regex, 5 workers) OR framework mode (Anthropic API + playbook + scrape's brand-context block; hard-bans invented facts).
- `scripts/new-comp.mjs` — token extractor. Curl mode: CSS-vars + frequency-ranked hex. Headless mode: `getComputedStyle` on body/h1/h2/a/nav/buttons. Priority `cssVars > rendered samples > curl-freq > hardcoded default`. Honors `HAND-TUNED` sentinel.
- `scripts/pull-assets.mjs` — logo / favicon / hero / product. https + zlib (Playwright only on empty body). Magic-byte sniffer, 50 px min. Brand-CDN allowlist.

## Per-URL test results

Probe ran scrape-page.mjs (Playwright, 30 s timeout, 2.5 s settle) + curl-mode token extraction. Raw JSON in `_data/<name>.json`.

| URL | HTTP | Title | Meta | h1/h2/p | CTAs | JSON-LD | Outcome |
|-----|------|-------|------|---------|------|---------|---------|
| headspace.com | 200 | Mental Health App... | 150 ch | **0**/8/24 | 16 | SoftwareApp + FAQPage | rich content, **no h1** |
| calm.com | **403** | "Access to this page has been denied" | "px-captcha" | 0/0/0 | 0 | 0 | **PerimeterX bot wall** |
| patek.com | 200 | Patek Philippe Official Site | 152 ch | 1/6/2 | 16 | 0 | thin paragraphs, image-driven |
| aesop.com | **403** | "Just a moment..." | empty | 1/1/1 | 0 | 0 | **Cloudflare bot wall** |
| maisonmargiela-fragrances.com | **403** | "Just a moment..." | empty | 1/1/1 | 0 | 0 | **Cloudflare bot wall** (also redirected `.com → .us`) |

**3 of 5 luxury/contemplative brands are bot-blocked.** Cloudflare returns "Performing security verification"; PerimeterX returns "Access to this page has been denied". Playwright fares no better than curl — the scraper returns the bot-wall page without throwing. Headspace fully scraped but had **zero h1** tags (SPA rendering display text as styled divs). Patek/Aesop/Margiela had ≤1 paragraph; content lives in image-driven hero modules.

Headspace token curl-mode misclassified the brand color: saturated blue `#0040EA` (actual brand accent, 31 occurrences in hero CTAs/links) lost the frequency rank to `#44423F` (text gray, 94 occurrences). The picker assigned `#0040EA` to `--card-warn`; gray became `--card-accent`. **Frequency-rank without role-aware filtering picks the wrong accent on any brand where body text outweighs CTA color.** Headless mode catches this via `getComputedStyle` on `button` — except when first-paint has no rendered button (JS-driven heroes).

## Robustness gaps (with evidence)

### G1. No bot-wall detection — 3/5 luxury brands silently failed
`scrape-page.mjs` returns `status: 403` without throwing. Framework mode then feeds the captcha title ("Just a moment...") and paragraph ("This website uses a security service...") into Claude as `BRAND CONTEXT`. The model is told "do not invent facts beyond what BRAND CONTEXT explicitly states" — so it writes a video about a security verification page. The pipeline never sees the brand. Calm/Aesop/Margiela all hit walls with the current Chromium UA.

### G2. Token extractor confuses prevalence with importance
`new-comp.mjs:130` `rankColors` filters pure white/black but not near-neutral grays like Headspace's `#44423F`. Text/border colors dominate the rank and become `--card-accent`; the real saturated brand accent demotes to `--card-warn`. This compounds into wrong music: `paletteSignal` (video.mjs:444) reads `--card-accent`, sees a near-neutral hex, reports `palette: muted/earthy` (documentary score) — pushing a pure tech brand toward documentary template + music.

### G3. SPA / no-h1 pages produce empty headlines
Headspace returned 0 h1. `summarizeWorker` (extract-copy.mjs:283) orders `meta → h1 → p → h2`; when h1 is empty, supporting paragraph snippets like "HSA/FSA eligible: save with pre-tax dollars" beat strong h2 lines like "What kind of headspace are you looking for?". Patek's hero text ("NEW MODELS 2026", "RARE HANDCRAFTS COLLECTION", "CRAFTING A LEGACY") appears in `visibleText` but not in `h1/h2/h3` — styled divs. The scraper captures them; the summarizer ignores them.

### G4. No `contemplative` / `sacred-oracle` tone wired into video.mjs
`pick-music.mjs:67` defines `contemplative` and `sacred-oracle` aliases → `sacred-cosmic` shortlist. But `video.mjs:201` `TONE_TO_VIBE` only has warm/energetic/documentary/neutral. `extractBrandTone` (video.mjs:570) returns one of those four; `scoreColor` (video.mjs:422) has no rule for "low-saturation cool palette + spiritual vocabulary". Patek's earthy palette would score warm; Aesop's monochrome would score documentary. **The sacred-cosmic shortlist exists; no URL-driven path reaches it.** The user's `--register=sacred-oracle` chip is the right shape — an explicit override.

### G5. Asset puller has no path for SVG-sprite logos
Patek's logo is `<use href="...sprite.svg#logo">`; no `<img>` tag. `pull-assets.mjs:466` only walks `<img>`, so logo fails. Headspace works via the Contentful CDN allowlist (`//images.ctfassets.net/.../Logo.svg`). Patek's logo stays `(none found)`; the favicon-mirror fallback (pull-assets.mjs:694) only helps if logo succeeded first.

## Proposed fixes (effort estimates)

### F1. Bot-wall detector in scrape-page.mjs (~30 min)
After `page.goto`, sniff title + metaDescription against `/just a moment|access denied|security verification|px-captcha|attention required|cloudflare/i`. Set `stats.botWall = "<provider>"` + `stats.partial = true`. Have framework-mode + new-comp.mjs **refuse to proceed**: "URL is bot-walled; provide `--brand=` prose or run against a non-walled page." Honors `feedback_no_invented_facts.md` by failing loud rather than fabricating from a captcha.

### F2. Role-aware token rank by saturation (~2 h)
In `new-comp.mjs:126` `rankColors`, partition by saturation: S < 0.15 → ink/slate; S ≥ 0.4 → accent; mid → paper. Pick `--card-accent` from the saturated bucket even with fewer occurrences. Headspace `#0040EA` (S ~ 0.99) goes to accent; `#44423F` (S ~ 0.06) goes to ink. Also extend `fromCssVars` (pickPalette:329) to score saturation when multiple matches exist.

### F3. Promote visibleText when h1 is empty (~1 h)
In `summarizeWorker` (extract-copy.mjs:276), when `headings.h1.length === 0` and `visibleText.length > 200`, parse the first 8-12 line-breaks of `visibleText` as `{ src: "visibleText-hero", text }` between h1 and paragraphs in priority order. Patek's "NEW MODELS 2026" survives. Already returned by scrape-page; just isn't read.

### F4. `contemplative` tone + `--register` override (~3 h)
1. video.mjs:201 — add `contemplative: "sacred-cosmic"` to `TONE_TO_VIBE`; add a contemplative ladder to `TONE_PREFERENCE`.
2. video.mjs:422 `scoreColor` — add a contemplative rule: S < 0.15 AND V 0.3-0.7 AND copy-lexicon hit (oracle/sacred/whisper/breath/eternal/stillness/ritual). Must beat the existing documentary rule on monochromatic palettes.
3. Add `--register=<name>` flag that hard-overrides `extractBrandTone`. The user's filed chip — explicit operator escape hatch.

### F5. Logo fallback for SVG-sprite brands (~1 h)
After walking `<img>` in pull-assets.mjs:466, also walk `<use href*="logo">` / `<svg class*="logo">` and resolve the sprite. Or, when no logo validates, store og:image as `logo-fallback.png` with `manifest.assets[].fallback: true`.

## Top 1 most-impactful change

**F1 — bot-wall detector.** Today, three of five luxury/contemplative URLs return a captcha that the pipeline treats as the brand homepage. Framework-mode then asks Claude to write a video about "performing security verification". This is the worst failure mode: outputs look superficially valid (copy.json, tokens.css, verifier may green-light visual fidelity) but the brand is entirely absent. ~30 min of regex + a refusal path. Directly serves `feedback_no_invented_facts.md`: fail loud rather than paper over an empty BRAND CONTEXT. Without it, the contemplative-premium register (this session's stated direction) is unreachable for the brands that define it — every premium brand now puts Cloudflare in front.

Aesop/Calm/Margiela JSON in `_data/*.json` is reproducible regression evidence; the sniff list comes from those captured titles verbatim.
