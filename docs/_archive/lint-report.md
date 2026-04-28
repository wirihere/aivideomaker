> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](docs/skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Composition lint sweep — 2026-04-25T12:56:39.060Z

Each composition was treated as the project root in turn (swap-and-restore on `index.html`).
Design imports were rewritten (`../../design/` and `../design/` → `design/`) and `tokens-PLACEHOLDER.css` was substituted with `tokens-kindred.css` so the linter could resolve assets.

| Composition | Errors | Warnings | Infos | Status |
|-------------|--------|----------|-------|--------|
| compositions/backgrounds/crossfade-two.html | 0 | 4 | 1 | warnings only |
| compositions/backgrounds/ken-burns.html | 0 | 3 | 1 | warnings only |
| compositions/backgrounds/video-bg.html | 0 | 3 | 1 | warnings only |
| compositions/cards/feature-row-card.html | 0 | 3 | 1 | warnings only |
| compositions/cards/image-underlay-card.html | 0 | 3 | 1 | warnings only |
| compositions/cards/quote-card.html | 0 | 3 | 1 | warnings only |
| compositions/cards/stat-card.html | 0 | 3 | 1 | warnings only |
| compositions/combo-fx-demo.html | 0 | 0 | 0 | clean |
| compositions/effect-fx-demo.html | 0 | 0 | 0 | clean |
| compositions/kindred-recut.html | 0 | 0 | 0 | clean |
| compositions/overlays/declined-stamp.html | 0 | 3 | 1 | warnings only |
| compositions/overlays/ledger-card.html | 0 | 3 | 1 | warnings only |
| compositions/overlays/lower-third.html | 0 | 3 | 1 | warnings only |
| compositions/overlays/step-badge.html | 0 | 3 | 1 | warnings only |
| compositions/overlays/word-reveal.html | 0 | 3 | 1 | warnings only |
| compositions/overlays/wordmark-cta.html | 0 | 3 | 1 | warnings only |
| compositions/templates/before-after-20s.html | 0 | 0 | 0 | clean |
| compositions/templates/case-study-60s.html | 0 | 0 | 0 | clean |
| compositions/templates/faq-quick-30s.html | 0 | 0 | 0 | clean |
| compositions/templates/founder-story-60s.html | 0 | 0 | 0 | clean |
| compositions/templates/hero-promo-30s.html | 0 | 0 | 0 | clean |
| compositions/templates/product-launch-30s.html | 0 | 0 | 0 | clean |
| compositions/templates/social-reel-15s.html | 0 | 0 | 0 | clean |
| compositions/templates/testimonial-45s.html | 0 | 0 | 0 | clean |
| compositions/text-fx-demo.html | 0 | 0 | 0 | clean |
| compositions/verticals/ecommerce-product-spotlight-30s.html | 0 | 0 | 0 | clean |
| compositions/verticals/ecommerce-social-reel-15s.html | 0 | 0 | 0 | clean |
| compositions/verticals/hospitality-cafe-vibe-15s.html | 0 | 0 | 0 | clean |
| compositions/verticals/hospitality-event-special-20s.html | 0 | 0 | 0 | clean |
| compositions/verticals/hospitality-restaurant-promo-30s.html | 5 | 0 | 0 | error — [root_missing_composition_id] Root composition is missing `data-composition-id`. (C:\Users\wirihere\aivideomaker\compositions\scratch-kindred-production.html) |
| compositions/verticals/realestate-agent-brand-30s.html | 5 | 0 | 0 | error — [root_missing_composition_id] Root composition is missing `data-composition-id`. (C:\Users\wirihere\aivideomaker\compositions\scratch-kindred-production.html) |
| compositions/verticals/realestate-listing-reel-15s.html | 5 | 0 | 0 | error — [root_missing_composition_id] Root composition is missing `data-composition-id`. (C:\Users\wirihere\aivideomaker\compositions\scratch-kindred-production.html) |
| compositions/verticals/realestate-listing-tour-45s.html | 0 | 0 | 0 | clean |
| compositions/verticals/saas-case-study-60s.html | 0 | 0 | 0 | clean |
| compositions/verticals/saas-feature-launch-20s.html | 0 | 0 | 0 | clean |
| compositions/verticals/saas-product-tour-30s.html | 0 | 0 | 0 | clean |
| compositions/verticals/trades-before-after-30s.html | 0 | 0 | 0 | clean |
| compositions/verticals/trades-service-callout-20s.html | 0 | 0 | 0 | clean |
| compositions/verticals/trades-trust-builder-45s.html | 0 | 0 | 0 | clean |
| compositions/verticals/wellness-clinic-trust-45s.html | 0 | 0 | 0 | clean |
| compositions/verticals/wellness-fitness-transformation-30s.html | 0 | 0 | 0 | clean |
| compositions/verticals/wellness-spa-mood-20s.html | 0 | 0 | 0 | clean |

## Summary
- Total: 42 compositions
- Clean: 26
- Errors: 15 (across 3 compositions)
- Warnings: 40
- Infos: 13

## Notes
- Card / overlay / background sub-compositions begin with `<template id="...">` rather than a full `<!doctype html>` shell. They are intended to be referenced via `data-composition-src` from a parent composition, not used as the project root.
- The sweep rewrote relative design paths during the test only; original files were not modified.
