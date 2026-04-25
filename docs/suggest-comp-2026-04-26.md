# Composition Auto-Suggester — Phase 1 (2026-04-26)

`scripts/suggest-comp.mjs` — feed a brief, get a ranked shortlist of templates plus a scene
outline for the top pick. Phase 1 is **deterministic only** — no LLM call. The scoring is
read straight off the 25 templates' embedded metadata (vibe CSS link, root `data-duration`,
`Copy framework: <name>` breadcrumb, scene timings).

Phase 2 — swap the deterministic ranker for an Anthropic call once we know the
deterministic version is useful.

## Usage

```bash
# Required: --duration. Everything else is optional.
node scripts/suggest-comp.mjs --duration=30 --vibe=kinetic-pop --vertical=ecommerce
node scripts/suggest-comp.mjs --duration=15 --vibe=warm-community
node scripts/suggest-comp.mjs --duration=30 --vibe=kinetic-pop --vertical=ecommerce --save=my-shop

# Convenience modes
node scripts/suggest-comp.mjs --list      # dump every scanned template's metadata
node scripts/suggest-comp.mjs --refresh   # force cache rebuild (also auto-busts on mtime change)

# npm wrapper
npm run suggest:comp -- --duration=30 --vibe=kinetic-pop
```

## Scoring formula

```
score = (durationFit × 3)
      + (vibeFit × 2)
      + (verticalFit × 4   if --vertical)
      + (frameworkFit × 2  if --framework)

durationFit:  1.0 if |Δ| ≤ 5s, decays linearly to 0 at ±15s.
vibeFit:      1.0 exact, 0.5 compatible (e.g. kinetic-pop ↔ warm-community), 0 otherwise.
verticalFit:  1.0 same industry, 0.5 structural template (industry-agnostic), 0 otherwise.
frameworkFit: 1.0 exact, OR 1.0 if the request matches one half of a composite
              (e.g. `--framework=FAB` matches `Sensory + FAB`).
```

When a flag is omitted, that dimension is **skipped** rather than penalising. e.g. no
`--vertical` means structural and vertical templates compete fairly on duration + vibe alone.

## Reading the output

```
$ node scripts/suggest-comp.mjs --duration=30 --vibe=kinetic-pop --vertical=ecommerce
Top 3 matches for: 30s · kinetic-pop · ecommerce

  ★ ecommerce-product-spotlight-30s.html  (score 9.0)
    framework: FAB · vibe: kinetic-pop · duration: 30s · vertical (ecommerce)
    "Three benefits, single price, verb-first CTA"

    Scene 1 (0-5s):      Brand chip + product hero — pop grade for product punch
    Scene 2 (5-15s):     3-up benefits
    Scene 3 (15-22s):    Social proof
    Scene 4 (22-28s):    Price + offer
    Scene 5 (28-30s):    CTA

  · hero-promo-30s.html  (score 7.0)  ...
  · product-launch-30s.html  (score 7.0)  ...
```

The top-1 entry gets the full scene-by-scene breakdown (extracted from the leading HTML
comment of each `<div class="scene clip" data-start data-duration>`). Runners-up show
metadata only — drill in by re-querying with their template name in mind.

## `--save=<slug>`

Copies the chosen template into `compositions/<slug>.html`, with two automatic tweaks:

1. `../../design/` paths are rewritten to `../design/` (templates live two levels deep,
   the new copy is one level deep under `compositions/`).
2. The `Copy framework: ... applied 2026-04-26` breadcrumb is updated to today's date,
   plus a `(suggester · branched from <basename>)` suffix so future readers can trace
   the lineage.

The placeholder `tokens-PLACEHOLDER.css` is **not** resolved — that's the next step
in the pipeline (`npm run new:comp -- <url>` wires real brand tokens).

## Caching

`.suggest-cache.json` (gitignored) holds the parsed metadata for all 25 templates. The
cache is busted automatically when any template's mtime is newer than the cached entry,
or manually with `--refresh`. Repeat runs are instant (no HTML re-parsing).

## Constraints honoured

- No external API calls (Phase 1 is pure deterministic mapping).
- No template files modified — read-only on the substrate.
- No new npm dependencies — Node built-ins only.
- Single new optional file under `compositions/<slug>.html` only with `--save`.
- Total LOC under the 400 budget.

## Phase 2 hooks (future work)

The deterministic ranker is a clean substrate for an LLM layer. A future Anthropic call
could:
1. Re-rank by semantic fit on the brief (e.g. "hero promo for a fintech B2B SaaS at the
   Series A stage" — the vertical+vibe filters get you to a shortlist, then the LLM
   tie-breaks on tone fit).
2. Fill in the placeholder copy in the saved file (currently `npm run new:comp` does a
   first pass; the suggester could thread the chosen framework through to extract-copy).
3. Suggest module additions (text-fx, effect-fx, glitter-fx) based on the scene outline.

None of this is in scope for Phase 1 — ship the deterministic mapping, see if it earns
its keep.
