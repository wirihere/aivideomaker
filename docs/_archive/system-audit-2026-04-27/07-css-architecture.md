> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# 07 — CSS Architecture Audit

**Scope:** `design/cards.css`, `design/templates/*.css`, `design/tokens-<brand>.css`,
`design/cards-sacred-oracle.css`, `design/effects-batch-08.css`, `design/modules/all.css`.

---

## 1. Cascade — two distinct conventions

**A. "Vibe" templates** (kinetic-pop, warm-community, documentary, quiet-premium).
Per template header comments: `cards.css → templates/<vibe>.css → tokens-<brand>.css → effects-batch-08.css → modules/all.css`.
Brand wins over vibe wins over base via `:root { --card-* }` source-order cascade.

**Real comps disagree:**

| File | observed order |
| --- | --- |
| `community-app-tour-30s.html` | cards → effects → modules → **warm-community** → tokens |
| `hero-promo-30s.html` | **kinetic-pop** → tokens → cards → effects → modules |
| `founder-story-60s.html` | **documentary** → tokens → cards → effects → modules |

`hero-promo` and `founder-story` load vibe **before** cards.css — so cards.css's
defaults silently clobber the template's scale. Real drift; Fix #2.

**B. Sacred-oracle "register"** (`cards-sacred-oracle.css`, 102 lines).
Self-contained, loads alone — no tokens / effects / modules. 4 templates
+ singularity-convergence link only this file.

```
sacred-oracle:  cards-sacred-oracle.css (102 lines) → inline overrides
vibe:           cards(686) + templates/<vibe>(~135) + tokens-<brand>(~25)
                + effects-batch-08(395) + modules/all(408)
```

---

## 2. Usage tracker (`npm run usage`)

- **Hot (10+):** `modules/all.js` 55× · `gsap.min.js` 55× · `cards.css` 45× · `effects-batch-08.css` 45× · `modules/all.css` 45× · `warm-community.css` 21× · `kinetic-pop.css` 13×.
- **Mid (2-9):** `cards-sacred-oracle.css` 9× · `documentary.css` 8× · `tokens-kindred.css` 7× · `quiet-premium.css` 2× (borderline-stale).
- **Single-comp brand tokens (12 files):** each a genuine brand capture, not duplication.
- **0 refs (cleanup OK):** `tokens-{dryrun,smoke}-*test`, `compose-head.html`, `preview.html`, `cards-from-bundle/phonehand.css`, 4 unbundled module sources (correctly bundled).

---

## 3. Font-var migration — state

Per LEARNINGS line 1722. PR 1 done, PR 2 parked.

| Phase | What | State |
| --- | --- | --- |
| PR 1 | `@font-face` blocks in cards + templates | ✅ commit `0e7b15d`, 35 blocks |
| PR 2 | Flip `font-var` lint warn → error | ❌ 482 warnings still fire |
| PR 2.5 | Fix detector bug (flags token sources) | ❌ not done |

All 9 font URLs return **HTTP 200** (verified 2026-04-27). 516 `var(--card-font-)` sites
across 38 files, matching LEARNINGS. Migration is NOT mechanical — handles are intentional.
Warning is cosmetic.

---

## 4. `cards.css` — overgrown (686 lines / 21.4 KB)

| Section | Lines | What |
| --- | --- | --- |
| `@font-face` | 28-128 | 14 declarations: Inter / JetBrains Mono / Instrument Serif |
| `:root` tokens | 131-184 | 37 `--card-*` design tokens |
| `.card` base + slots | 187-272 | flexbox + kicker/title/body/figure/label/rule |
| Card variants | 275-498 | radius/pad/surfaces/sizes + stat/quote/feature-row/step/headline/wordmark |
| `.card-mark` | 500-526 | persistent-corner brand badge |
| Scene scaffolds | 528-687 | `.scene__bg/__stage/__overlay/__sfx`, multiplane perspective |

Bottom third (scaffolds + 130-line recipe block-comment) is not "cards" — it's
scene structure. Splitting lets sacred-oracle-style registers use scene scaffolding
without 35 unused card variants. See Fix #4.

---

## 5. Per-register CSS — consistency

| File | Lines | KB | `:root` | `@font-face` | `.scene` | keyframes |
| --- | --- | --- | --- | --- | --- | --- |
| `kinetic-pop.css` | 136 | 4.7 | pacing+type | 6 | bg only | vibe-shake |
| `warm-community.css` | 154 | 5.7 | pacing+type | 9 | bg only | — |
| `documentary.css` | 155 | 5.4 | pacing+type | 7 | bg only | — |
| `quiet-premium.css` | 86 | 2.7 | pacing+type | **0** | bg + padding | — |
| `cards-sacred-oracle.css` | 102 | 3.7 | palette+type | 0 | full reset+stage | haze, twinkle |

Inconsistencies: (1) `quiet-premium.css` has zero `@font-face` (relies on `@import` at
line 24) — breaks if PR 2 flips lint to error; (2) `cards-sacred-oracle.css` uses
namespace `--void/--gold/--parchment/--serif`, no overlap or doc-bridge to `--card-*`;
(3) "register" labels different concerns — vibes declare pacing+ease+type+shadows,
sacred-oracle declares palette+reset+`.comp`+ambient/starfield.

---

## 6. Bundle build — `design/modules/all.css`

**408 lines / 15.3 KB.** `scripts/build-bundle.mjs` literal-concatenates 4
sources: `text-fx` (2.3 KB) + `effect-fx` (2.7 KB) + `glitter-fx` (3.1 KB) +
`combo-fx` (6.6 KB) + banner. Not tree-shaken; design intent ("ONE link tag
instead of 4-6"). Acceptable. `shader-fx.js` correctly NOT bundled (WebGL parse cost).

---

## 7. `@font-face` — severe accidental duplication

**35 declarations across 4 files reference only 10 distinct woff2 URLs.**

| Count | Font | Declared as |
| --- | --- | --- |
| 7× | Inter | weight 300-900, **same file** |
| 5× | Inter Tight | 500-900, same file |
| 5× | Nunito | 400-800, same file |
| 4× | Playfair Display, JetBrains Mono, Fraunces | 400-700, same file |
| 3× | Source Sans 3 | 400-600, same file |
| 2× | Instrument Serif | correct (normal+italic, different files) |
| 1× | Bebas Neue | correct (single weight) |

Same URL serves multiple declared weights — gstatic returns the full weight range
as variable. Browser fetches once, but declarations advertise specific buckets; if
Google ever serves per-weight statics, declarations collapse to one weight and
others render as synthetic approximations. Latent footgun.

---

## 8. Custom-properties registry

**61 distinct `--*` vars** across cards + cards-sacred-oracle + templates +
effects-batch-08 + tokens-*. No types, no docs.

39 `--card-*` defined; only 9 universally overridden by every brand-tokens file
(`accent/navy/navy-deep/paper/paper-soft/slate/slate-ink/warn/ok`). Other 30 are
single-source from cards.css OR overridden only by active template — correct.

`cards-sacred-oracle` uses 10 separate vars (`--void/--gold/--parchment/etc.`).
Zero overlap with `--card-*`, no documented mapping.

**Recommendation: yes, lightweight.** A single `docs/css-tokens.md` table (name /
type / default / which file overrides) — ~80 rows. No typed system (Style
Dictionary etc.); out of scope per `project_scope_claude_code_only`. Serves
cold-reading.

---

## 9. Cross-extraction opportunity

Sacred-oracle moved 102 lines / 3.7 KB out of 4 inline `<style>` blocks. Projected
savings per register:

| Register | Comps | Per-comp extractable | Leverage |
| --- | --- | --- | --- |
| warm-community | 21 | ~120-180 lines | **HIGH (~3000 total)** |
| kinetic-pop | 13 | ~60-100 lines | MED |
| documentary | 8 | ~40-70 lines | LOW |
| quiet-premium | 2 | <30 lines | SKIP |

Biggest win: warm-community. Use sacred-oracle's structure (palette → reset → `.comp`
→ scene primitives → keyframes) as template.

---

## 10. CSS perf — compositing budget

| File | mix-blend-mode | backdrop-filter | filter |
| --- | --- | --- | --- |
| `cards.css` | 0 | 4 | 1 |
| `effects-batch-08.css` | 4 | 3 | ~20 |
| `cards-sacred-oracle.css` | 1 | 0 | 0 |
| `quiet-premium.css` | 0 | 0 | 1 (blur 160px) |

Hot spots (all intentional, opt-in via class name):
- `effects-batch-08 .fx-cinemagraph-bg::before { filter: blur(120px) saturate(1.4) }` +
  `backdrop-filter: blur(60px) saturate(1.1)` — paint-bound at 1080×1920. Any cinemagraph
  scene dominates per-frame paint. No transform-based alternative.
- `cards.css .card--image-underlay .card__bg { filter: grayscale + contrast + brightness }`
  — 3-stage chain on full-size BG. Pre-graded image cheaper for repeat use.
- 5 box-shadows total, all tokenized via `--card-sh-*`. Tame.
- No problematic massive selectors.

---

## Fixes ranked by leverage

**#1 — Collapse `@font-face` weight-spam to one block per family** (S, every render).
35 → 10 using `font-weight: <range>` (e.g. `300 900` for Inter). Saves ~1.5 KB and
removes §7 footgun. Sweep cards + 3 vibe templates.

**#2 — Fix link-order drift in `compositions/templates/*.html`** (S, 5 templates).
`hero-promo` + `founder-story` load vibe before cards.css. Pick canonical order
(cards → vibe → tokens → effects → modules), sweep, lock via lint. Visual-diff first.

**#3 — Extract warm-community register CSS** (M, 21 comps). ~3000 lines
de-duplicated. Build `design/cards-warm-community.css` with sacred-oracle structure
(~120 lines), thread the 21 comps. Don't start documentary/quiet-premium — leverage too low.

**#4 — Split `cards.css` into `cards.css` + `scene-scaffolds.css`** (S). Move
lines 528-687. Lets registers use scene scaffolds without 35 unused card variants.

**#5 — Write `docs/css-tokens.md` registry** (S, every cold session). ~80-row
table replacing implicit tribal knowledge. Highest-leverage doc improvement.

---

## Already optimal — explicit

- `build-bundle.mjs` literal-concatenation correct (15 KB no need to tree-shake).
- `shader-fx.js` opt-in (not bundled) — correct, WebGL parse cost.
- `tokens-<brand>.css` per-brand — correct, HAND-TUNED sentinel prevents clobber.
- All 9 `@font-face` URLs HTTP 200 (verified 2026-04-27).
- Compositing budget well-managed — expensive blurs (cinemagraph) opt-in.
- `cards-sacred-oracle.css` structure is the right replication model.

**Bottom line:** Architecture shape is correct (token-driven, template-overlay,
brand-overlay last, hot files extracted). Drift is in details — 35→10 `@font-face`
collapse, link-order disagreement in 3 templates, ~3000 lines of warm-community
duplication that sacred-oracle's pattern already proved how to extract. No
rewrites; five surgical fixes ship the entire backlog.
