# Template Models — Locked Reference Renders

Canonical list of every template in `TEMPLATE_REGISTRY` and its production-readiness status. The orchestrator reads this file (`scripts/lib/template-status.mjs`) before render to decide whether a render is allowed.

For the rules each template should follow, see `docs/social-video-patterns.md`.
For the production playbook, see `docs/playbooks/cinematic-vertical-promo.md`.

---

## Lifecycle (the per-template loop the orchestrator gates against)

```
NEW TEMPLATE
  ↓
DESIGN.md / SCRIPT.md / STORYBOARD.md (gated docs)
  ↓
build skeleton, register in TEMPLATE_REGISTRY (status: iterating)
  ↓
silent loop — assemble → verify → frame-flipbook → fix
  ↓ (only when verdict = ship + frames look right)
pre-render review (user)
  ↓
render
  ↓
USER APPROVE → tag commit, set status: locked-vN, list in registry below
              → next brand can render against this template without re-looping
                (gates still run as guard-rails, but render allowed)
```

## Status registry

Machine-readable per template. Each row's status governs the orchestrator's render-gate:

- `locked-vN` — user-approved at this tag. Render allowed. Gates run as guards.
- `iterating` — actively in build/fix loop. Render blocked unless `--allow-watch`.
- `legacy` — built before the gated process. Render blocked unless `--use-legacy`.
- `unlisted` (template in registry but not in this table) — treated as `iterating`.

| template                  | status     | tag                       | locked date | brands validated                |
| ------------------------- | ---------- | ------------------------- | ----------- | ------------------------------- |
| community-app-tour-30s    | locked-v1  | community-app-tour-v1     | 2026-04-26  | kindred-nz                      |
| kinetic-product-30s       | iterating  | —                         | —           | resurgence-indigo (in progress) |
| faq-quick-30s             | legacy     | —                         | —           | (pre-loop renders only)         |
| hero-promo-30s            | legacy     | —                         | —           | —                               |
| product-launch-30s        | legacy     | —                         | —           | —                               |
| before-after-30s          | legacy     | —                         | —           | —                               |
| testimonial-45s           | legacy     | —                         | —           | —                               |
| founder-story-60s         | legacy     | —                         | —           | —                               |
| case-study-60s            | legacy     | —                         | —           | —                               |
| social-reel-15s           | legacy     | —                         | —           | —                               |

Update this table when a template's status changes. The parser splits on `|`, trims, ignores rows where the first column is `template`/`---` (header), and looks up `status` by the first column.

---

## community-app-tour-30s — `community-app-tour-v1`

- **Locked:** 2026-04-26
- **Commit / tag:** [`c7a7015`](https://github.com/) → tag `community-app-tour-v1`
- **Vibe:** warm-community
- **Dims:** 1080×1920 (9:16 vertical)
- **Duration:** 30s
- **Brands validated against:** kindred-nz (NZ neighbourhood-help app)

**User reaction at lock:** *"that was great… im surprised i liked it"* — first template grounded in `docs/social-video-patterns.md` research, not training-data assumptions.

### Shape

```
0.0 -- 3.5s   s1  INTRODUCING — coral kicker + KINDRED serif wordmark with
                  honey offset shadow + brand logo. Glitter burst at t=0.1.
3.5 -- 12s    s2  STEP 01 — phone hero centered, 📦 emoji flies in from
                  upper-right, lands above the GIVE card. Pulse + flyout.
12 -- 19s     s3  STEP 02 — phone hero, 💬 from upper-left, lands near
                  messages tab. Bobbing motion (typing-dot metaphor).
19 -- 26s     s4  STEP 03 — phone hero, 🤝 from lower-right, heartbeat
                  pulse before flyout.
26 -- 30s     s5  CTA — dark navy bg + MADE FOR LOCALS kicker + brand
                  logo + "Be kind. Use Kindred." big honey serif.
```

### Why this template, when

Best for: community-app / consumer-app brands that want to introduce a 3-feature flow on a phone-shaped UI screenshot. Shape inherits from kindred-nz benchmarks but generalises to any "community app + 3 steps + warm CTA mantra" brief.

Don't use for: B2B-SaaS Q&A explainers (use `faq-quick-30s` instead), founder-stories (use `founder-story-60s`), pure-typographic kinetic-pop launches (use `social-reel-15s`).

### What's load-bearing

These details are non-obvious but critical. Don't break them when reusing:

- **Phone-mockup CSS:** 600×1066 (9:16 aspect), 14px navy border, 56px radius, drop-shadow + inset highlight. Brand's `assets/<slug>/hero.png` is presumed to be a portrait app screenshot. `object-position: 50% 0%` biases the crop to top of source.
- **Emoji icons at 320px font-size in 360×360 boxes:** browser/render engine renders the system emoji font (Segoe UI Emoji on Windows Chromium). DO NOT replace with custom SVG unless the brand's app uses non-emoji icon style — emoji matches kindred's 3D-emoji aesthetic exactly.
- **Stylesheet load order:** `cards.css` (structural defaults) → `warm-community.css` (vibe overrides) → `tokens-<slug>.css` (brand overrides, MUST be last). Same `:root` selector — last wins. Without this order brand tokens get clobbered and contrast / palette findings spike.
- **Per-scene icon entrance:** `back.out(1.7)` from offscreen corner with rotation, holds 1-2s with type-specific pulse (camera-snap / typing-bob / heartbeat), `power3.in` exit before scene cut. Use this rhythm if adding a new step.
- **CTA "Be kind. Use Kindred."** uses `text-wrap: balance` to auto-break across two lines without a manual `<br>`. Works because the swap target is one element with the full tagline.

### Verifier verdict at lock

Last clean run:
- Verdict: `watch` (shippable)
- Findings: motion-continuity 14 near-static moments under 2% byte-diff (eye-visible motion, encoder-packing artefact); script-timing scene-narration-mismatch on s1 (narration ends in s1 region per VTT but visuals are brand-intro — designed pattern).

### Open improvements (not blocking)

Listed in priority order. Apply when generalising to next brand:

1. **Real-world hook before brand reveal** — per `docs/social-video-patterns.md` R1 + Pattern 1, the highest-leverage move is a 1-2s real-world shot before INTRODUCING. Currently scene 1 IS the intro; bumping the intro to scene 2 with a hook scene at 0-1.5s would lift completion further.
2. **Real voice (Eleven Labs / human VO)** — Edge TTS is robotic. `scripts/fetch-tts-elevenlabs.mjs` exists in the repo, just needs API key.
3. **Per-word sticker-pill captions on narration** — R3 / R13. Currently no on-screen captions echoing the spoken narration. Big sticker pills per phrase ("Introducing Kindred" → "Three steps" → "Post a give") would lift completion ~32% per Kapwing data (92% of mobile views are sound-off).
4. **Move CTA URL clear of platform overlay zone (R5)** — currently the URL sits in the bottom-25% band where TikTok / Reels overlay their own UI.
5. **Music dynamics** — bed at constant volume; a subtle swell into "Be kind. Use Kindred." would land the close harder.

### Generalisation TODO

Re-render with 2-3 OTHER warm-community / community-app brands to confirm the template doesn't depend on kindred-specific assumptions:
- Olio NZ equivalent (food-share app)
- Neighbourly NZ
- A non-NZ community app (Buy Nothing US? to test the "MADE FOR LOCALS" framing — may need to be brand-tunable)

If the template generalises, it stays at v1. If not, find the brand-specific assumption baked in and parameterise it for v2.

---

## Future entries

Templates yet to be shaped via `docs/social-video-patterns.md` and locked as models. In rough order of likely next:

- testimonial-45s (warm-community, biggest reuse after this one)
- hero-promo-30s (energetic / kinetic-pop)
- case-study-60s (documentary)
- founder-story-60s (documentary)
- social-reel-15s (energetic, pure-typographic)
- product-launch-30s (energetic)
- before-after-20s (kinetic-pop transformation)

Each should produce a `<template-name>-v1` git tag + an entry in this doc when locked. Template-models is the source of truth for "what we ship by default per tone."
