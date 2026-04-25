# Copy-Apply 2026-04-26 — Playbook Sweep Across All 25 Templates

Applied `docs/copy-playbook.md` to every structural and vertical template. Each
file now carries a `<!-- Copy framework: <name> · applied 2026-04-26 -->`
breadcrumb near the top of `<body>`. Hooks/headlines/body/captions/CTA were
rewritten to obey the playbook word caps, ban list, and Tier 1 verb-first CTA
rule. Layout HTML, element IDs, animation calls, scene timing
(`data-start` / `data-duration` / `data-track-index`), fonts, and palette
tokens were NOT touched — only visible text strings.

## Verification

- `npx hyperframes lint --json` — `{ "ok": true, "errorCount": 0, "warningCount": 0, "infoCount": 0 }`
- `npm run check` — 2 passed · 0 failed (lint:strict + smoke). 527 warnings are
  pre-existing `font-var` informational notes on shared CSS, unchanged by this
  pass.

## Structural templates (`compositions/templates/*.html`)

| File | Framework | Vibe | Note |
| --- | --- | --- | --- |
| `before-after-20s.html` | Transformation arc | kinetic-pop | Honest before/after, single promise reframed mid-clip |
| `case-study-60s.html` | STAR | quiet-premium | Pre-existing header preserved; situation→task→action→result |
| `faq-quick-30s.html` | Q-Payoff | warm-community | Each question gets one concrete answer |
| `founder-story-60s.html` | Hero's Journey | documentary | Origin → call → trial → return reframed in plain English |
| `hero-promo-30s.html` | AIDA | kinetic-pop | Pre-existing header preserved |
| `product-launch-30s.html` | FAB | kinetic-pop | Feature → advantage → benefit, no buzzwords |
| `social-reel-15s.html` | AIDA | kinetic-pop | Hook within first 7 words; one CTA |
| `testimonial-45s.html` | STAR | warm-community | Pre-existing header preserved |

## Vertical templates (`compositions/verticals/*.html`)

| File | Framework | Vibe | Note |
| --- | --- | --- | --- |
| `ecommerce-product-spotlight-30s.html` | FAB | kinetic-pop | Three benefits, single price, verb-first CTA |
| `ecommerce-social-reel-15s.html` | AIDA | kinetic-pop | One hook, one offer, one CTA |
| `hospitality-cafe-vibe-15s.html` | Sensory + Q-Payoff | warm-community | Sensory hook → question → ten-word answer |
| `hospitality-event-special-20s.html` | AIDA + urgency | kinetic-pop | Real date, real number of seats, hard close |
| `hospitality-restaurant-promo-30s.html` | Sensory + FAB | warm-community | Plate-led hook, three benefits, dinner CTA |
| `realestate-listing-reel-15s.html` | AIDA | kinetic-pop | Address → standout → "Book a viewing" |
| `realestate-listing-tour-45s.html` | Hero's Journey | documentary | Open Sunday hook, four feature cells, walk-through CTA |
| `saas-case-study-60s.html` | STAR | quiet-premium | Friday spreadsheet pain → Thursday close |
| `saas-feature-launch-20s.html` | FAB | kinetic-pop | One-click rollback, one CTA |
| `saas-product-tour-30s.html` | FAB + Q-Payoff | quiet-premium | Three features → free for five seats |
| `trades-before-after-30s.html` | Transformation arc | warm-community | Five days, three steps, one promise kept |
| `trades-service-callout-20s.html` | PAS | kinetic-pop | Same-day pain list → "We fix it today" |
| `trades-trust-builder-45s.html` | Hero's Journey | documentary | Since 2003, six service details, free quote CTA |
| `wellness-clinic-trust-45s.html` | PAS + STAR | quiet-premium | Quiet rooms, honest plans, check-up CTA |
| `wellness-fitness-transformation-30s.html` | Transformation arc | warm-community | Three real first-12-weeks, "Start Tuesday" CTA |
| `wellness-spa-mood-20s.html` | Sensory + Q-Payoff | quiet-premium | "An hour off the clock", four-line menu, Tuesday booking |

## Constraints honoured

- Word caps: hook ≤7, headline ≤12, body line ≤18, CTA 2–5 words.
- Banned jargon (leverage / utilise / synergy / unlock / empower / etc.) — none.
- Māori words removed from all narration-adjacent text per memory note.
- Tier 1 verb-first CTAs only: Book, Call, Get, Start, Open, See, Visit.
- No invented stats, awards, or quotes about real brands.
- On-screen text reframes the idea — never an SRT echo of narration.
