> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# System Audit 2026-04-27 — 06: Template-Library Coverage

Map of what the library covers vs. what it ships into renders. Where are the holes?

## 1. Inventory

### 1a. Structural templates — `compositions/templates/*.html` (10 files)

| File | Register (vibe) | Duration | Format | Use case |
|---|---|---|---|---|
| `social-reel-15s.html` | kinetic-pop | 15s | 1080×1920 | Generic social hook |
| `before-after-20s.html` | kinetic-pop | 20s | 1080×1920 | Comparison reveal |
| `hero-promo-30s.html` | kinetic-pop | 30s | 1920×1080 | Launch / hero promo |
| `product-launch-30s.html` | kinetic-pop | 30s | 1920×1080 | "Available now" launch |
| `kinetic-product-30s.html` | kinetic-pop | 30s | 1080×1920 | Vertical product (NEW, not in README) |
| `community-app-tour-30s.html` | warm-community | 30s | 1080×1920 | Phone-hero app tour (NEW, not in README) |
| `faq-quick-30s.html` | quiet-premium → warm-community in code | 30s | 1080×1920 | 3-question explainer |
| `testimonial-45s.html` | warm-community | 45s | 1920×1080 | Single-customer voice |
| `case-study-60s.html` | documentary | 60s | 1920×1080 | Problem→outcome→quote |
| `founder-story-60s.html` | documentary | 60s | 1920×1080 | Origin narrative |

### 1b. Sacred-oracle family — `compositions/templates/sacred-oracle/*.html` (4 files)

| File | Register | Duration | Use case |
|---|---|---|---|
| `sacred-hook-15s.html` | sacred-oracle | 15s | Scroll-stopper / TOFU question |
| `sacred-witness-30s.html` | sacred-oracle | 30s | Testimonial / authority quote |
| `sacred-path-45s.html` | sacred-oracle | 45s | Methodology (Roman-numeral steps) |
| `sacred-revelation-60s.html` | sacred-oracle | 60s | Cinematic launch / manifesto |

### 1c. Reference build — `compositions/singularity-convergence.html`

10-beat sacred manifesto for Oraculum Institutum. Not a template — a reference render the sacred family was distilled from. 7 ledger entries, all `needs-fix`.

### 1d. Vertical templates — `compositions/verticals/*.html` (17 files)

3 e-commerce, 3 hospitality, 3 real-estate, 3 SaaS, 3 trades, 3 wellness, plus a saas-case-study-60s. Built in commit `015c7b3` ("Templates × modules system: 4 vibes + 8 structural + 17 vertical = 29 comps").

## 2. Coverage matrix (register × duration × use case)

| Duration | kinetic-pop | warm-community | documentary | quiet-premium | sacred-oracle |
|---|---|---|---|---|---|
| 15s | social-reel | — | — | — | sacred-hook |
| 20s | before-after | — | — | — | — |
| 30s (land) | hero-promo, product-launch | — | — | — | — |
| 30s (vert) | kinetic-product | community-app-tour, faq-quick | — | — | sacred-witness |
| 45s | — | testimonial | — | — | sacred-path |
| 60s | — | — | case-study, founder-story | — | sacred-revelation |

### Holes

1. **No documentary <60s.** `pickTemplate({ tone:'documentary', seconds:30 })` walks the ladder but the closest entry (`founder-story` 60s) is a 30s drift — explicit warning fires.
2. **No warm-community 15s or 20s.** Code path at video.mjs:222-227 short-circuits warm/documentary <=20s straight to `social-reel` (kinetic-pop) — wrong music, wrong type, wrong pace for a community brand. Call-out comment: *"no warm/documentary 15s template yet"*.
3. **No quiet-premium register at all.** README markets `faq-quick` as quiet-premium but registry hard-codes its vibe to `warm-community`. The register is documented but unrepresented.
4. **No kinetic-pop at 45s** (vertical or landscape).
5. **Sacred-oracle is fully unreachable from `pickTemplate`.** TONE_PREFERENCE has no `contemplative` or `sacred-oracle` key; TONE_TO_VIBE has no entry. The 4 sacred templates can only be invoked via `--template=` override, and the override list itself rejects them — `TEMPLATE_REGISTRY` does not contain them. Sacred templates exist on disk and are unreachable through any code path.

## 3. Picker reachability per tone

Code: `scripts/video.mjs:189-206`.

| Tone | Reachable templates (via pickTemplate ladder) |
|---|---|
| `warm` | faq-quick (30s), testimonial (45s), founder-story (60s); for ≤20s falls back to `social-reel` (wrong vibe) |
| `energetic` | social-reel (15s), hero-promo (30s), product-launch (30s), before-after (20s — but registry filename says `before-after-30s.html` and that file does not exist; resolveTemplatePath falls back to closest-duration match) |
| `documentary` | founder-story (60s), case-study (60s); ≤20s short-circuits to `social-reel` (wrong vibe) |
| `neutral` | duration buckets only: social-reel / hero-promo / testimonial / case-study |
| `contemplative` / `sacred-oracle` | **none** — no ladder entry, falls through to neutral duration buckets |

Bugs surfaced:
- **TEMPLATE_REGISTRY before-after entry is wrong.** Registry says `before-after-30s.html`; disk has `before-after-20s.html`. Picker hits resolveTemplatePath fallback every time before-after is chosen.
- **`kinetic-product` and `community-app-tour` are in registry but neither appears in any ladder.** Only reachable via `--template=` override.
- **No tone for sacred register.** Brand-tone classifier in `scripts/lib/brand-tone.mjs` would need a `contemplative` tone added before any sacred template can ever be auto-picked.

## 4. Cross-reference with `docs/social-video-patterns.md`

The playbook codifies 15 platform-mechanical rules (R1-R15) and 7 community-app patterns. Library coverage:

| Playbook recommendation | Template that delivers it | Status |
|---|---|---|
| 9:16 hook in ≤3s, mid-action open | `community-app-tour-30s` (validated on kindred 2026-04-26) | covered |
| Sticker-pill captions | None of the 10 structural templates emit caption pills | **missing** — playbook calls this anti-pattern in Part 4 yet template library doesn't include the construct |
| Sacred-oracle alt rules (S1, S9-S12) | sacred-* family | covered |
| 5-beat 0-3 hook → 3-8 brand → 8-17 do → 17-24 proof → 24-29 CTA | hero-promo + community-app-tour | covered for kinetic + warm; **missing for documentary <60s** |
| Direct-to-camera NZ register (Part 2 bonus) | None | **missing** |
| 14-17 shots in 27s budget | hero-promo (4 scenes — too few), community-app-tour (verified) | partial — most templates have 4-5 scenes, not 14-17 shots |

Part 5's faq-quick audit (commit `080b061`, 2-pass / 5-marginal / 15-fail) was followed by 6 fix commits — latest `e6afeb9` *"text size + crop + motion polish from silent-loop pass"*. **The audit table has not been re-run.** Doc still cites the old verdict; no record that it now passes.

## 5. Top 5 missing template archetypes

Ranked by likely user demand (combining patterns doc gaps + use cases that brand-tone-picker memory specifically called for):

| # | Archetype | Duration | Register | Why it's missing |
|---|---|---|---|---|
| 1 | **Stat-driven hook** (single number reveal in 0-15s) | 15s | sacred-oracle + kinetic | sacred-stat-20s chip filed in memory; no kinetic equivalent either |
| 2 | **Quote carousel** (3 testimonials, sticker pills) | 30-45s | warm-community | testimonial-45s carries one quote; multi-quote shape doesn't exist |
| 3 | **Comparison "old way / new way"** (split-screen, 2 columns) | 20-30s | kinetic-pop | before-after is one-state-then-another; comparison is two-states-side-by-side |
| 4 | **Day-in-the-life narrative** | 45-60s | warm-community + documentary | founder-story is origin, case-study is outcome; daily-life is neither |
| 5 | **Calendar / event countdown** | 15s | kinetic-pop | No date-driven template; product-launch handles "now" not "T-7 days" |

Honourable mentions: process step-by-step explainer for non-sacred (sacred-path covers liturgical only), founder-POV testimonial (founder-story is narrative not testimonial), cinematic launch trailer for non-sacred (product-launch is too kinetic, sacred-revelation is wrong register).

## 6. Out-of-date templates

| Template | Issue | Fix scope |
|---|---|---|
| `faq-quick-30s.html` | Audited in patterns Part 5 (2-pass/5-marginal/15-fail). 6 commits since the audit, but no re-audit. R3 (caption pills) still likely failing — base template has cascade text, not per-word pills. | Re-run audit, update Part 5 with new verdict, or rebuild as `faq-quick-pills-30s.html`. |
| `before-after-20s.html` | Registry filename mismatch (`before-after-30s.html` in code, `-20s.html` on disk) | One-line fix in `TEMPLATE_REGISTRY`. |
| `hero-promo-30s.html` | 4 scenes for 30s = ~7.5s/scene = R2/R9 fail (≥10 cuts in 30s required). Still ships as the energetic top entry. | Rework into 8-10 shot multi-cut pacing or accept it as deliberately "ad-shape" not "feed-native". |
| `community-app-tour-30s.html`, `kinetic-product-30s.html` | Not in `compositions/templates/README.md` (still says 8 templates) and not in any TONE_PREFERENCE ladder | Document + add to ladders. |
| `singularity-convergence.html` | Reference build, not template, but lives at `compositions/` root mixed with brand outputs. 7 needs-fix ledger entries. | Move to `compositions/reference-builds/` to clarify status. |

## 7. Vertical templates — cleanup candidates

**LEDGER renders since 2026-04-26 use these slugs only:** `index`, `kindred-recut`, `kindred-nz`, `kindred-nz-override`, `baseline-stripe`, `singularity-convergence`. **Zero vertical-template renders. Ever.**

The 17 verticals are referenced by `comp-manifest.mjs` (lint), `templates-baselines.mjs`, `pre-commit-build.mjs`, and lint/copy docs — they pass linting and have HEAD-INCLUDE wiring. They've never been used in a real render.

| Vertical | Use count | Recommendation |
|---|---|---|
| All 17 (ecommerce / hospitality / realestate / saas / trades / wellness) | 0 renders since they were built (commit `015c7b3`, several days back) | **Soft-archive** to `compositions/verticals/.archived/`. Keep the lint baseline so we can resurrect when a real brand calls for one. Don't delete — they encode genuine vertical knowledge. But stop shipping them as if they're production-ready. |

Rationale: not in `pickTemplate`, not in any tone ladder, not referenced by any orchestrator path. If someone wants the ecommerce-product-spotlight shape they currently can't get to it without `--template=` and `--template=` only accepts entries in `TEMPLATE_REGISTRY` (which excludes verticals).

## 8. Summary findings

1. **17 vertical templates are dead code.** Never rendered. Picker can't reach them. Move to `.archived/`.
2. **4 sacred templates are unreachable from pickTemplate.** Add `contemplative` tone + sacred ladder entry to TONE_PREFERENCE and TEMPLATE_REGISTRY before they'll ever auto-pick.
3. **Registry filename bug.** `before-after-30s.html` → should be `before-after-20s.html`.
4. **Two undocumented templates.** `kinetic-product-30s` and `community-app-tour-30s` exist + work but aren't in README or any ladder.
5. **Documentary <60s is structurally absent.** Code path explicitly warns about it.
6. **Sticker-pill captions are codified as best-practice in patterns doc but no template emits them.**
7. **faq-quick audit is stale.** 6 fix commits since the recorded 15-fail verdict; verdict not refreshed.
8. **5 missing archetypes** (stat-hook, quote-carousel, comparison, day-in-life, countdown) account for likely user demand the library doesn't currently serve.
