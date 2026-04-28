> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Combo-fx Gaps Analysis — 2026-04-26

Drafted during the production-render + combo-replan sweep. These are candidates for a future `combo-fx` batch-2 if the post-test review surfaces these as recurring needs across templates.

## Existing 10 combos (recap)

| Name              | Moment it owns                       | Stack                                |
| ----------------- | ------------------------------------ | ------------------------------------ |
| `superImpact`     | Stat reveal land                     | inkBleed + counter + stamp + glitch + glitter |
| `cinematicReveal` | Headline through depth               | multiplaneDolly + inkBleed + stagger + shadow trail |
| `hyperGlitch`     | Sub-second disruption                | scanlines + jitter + glitch ×N + stamp |
| `dreamSequence`   | Ambient hero                         | cinemagraphRotate + shimmer + ambient + fall + cool grade |
| `kineticBurst`    | Word emphasis                        | explode-in + small glitter + micro-glitch |
| `slamCut`         | Hard transition                      | noir-flash + glitchBurst + multiplane snap |
| `signalPulse`     | Beacon callout                       | 5 expanding rings + typeOn + counter |
| `paperTear`       | Scene swap                           | explode-out + reverse inkBleed + dolly back |
| `confettiFinale`  | Outro crescendo                      | dolly settle + stamp + burst+fall + cinemagraph idle |
| `holoFlash`       | Brand chip                           | holo-drift + multiplane near-pop + stamp + glitchBurst + glitter + long-shadow |

## Suspected gaps (collected during the replan sweep)

### Tier 1 — frequently-needed, multiple templates

1. **`focusPull`** — depth-of-field rack focus from background to foreground. Pairs with multiplane. Owns the "the camera is paying attention" moment.
   - Templates that would use it: case-study-60s, founder-story-60s, listing-tour-45s, clinic-trust-45s.
   - Stack: multiplane near-blur shift + ease-into-focus on target + warm grade lift.

2. **`spotlight`** — circular vignette focus on a key element while dimming everything else. Owns the "this is the answer" moment.
   - Templates that would use it: testimonial-45s, quote pull-outs everywhere.
   - Stack: radial mask + glow on target + dim siblings + slow scale + warm grade.

3. **`pricePop`** — specific to e-commerce + SaaS price reveals (number scale-up + currency fade-in + glitter sparkle).
   - Templates: ecommerce-product-spotlight-30s, ecommerce-social-reel-15s, saas-product-tour-30s.
   - Why distinct from `superImpact`: pricePop is for prices specifically (currency symbol entrance, strikethrough on "before" price, scale + glitter on "now" price). superImpact is for stat counters.

4. **`testimonialReveal`** — name + role + avatar + quote choreography. Owns the "real human said this" moment.
   - Templates: testimonial-45s, trades-trust-builder-45s, wellness-clinic-trust-45s, saas-case-study-60s.
   - Stack: avatar fade-in + name cascade + role typeOn + quote ink-bleed reveal in choreographed sequence.

### Tier 2 — niche but frequently-painful when missing

5. **`marqueeScroll`** — horizontal text scroll for reading-heavy moments. Useful for FAQ-quick where 3 Q&As need pacing.
   - Stack: smooth left translate + fade-edge mask + type-on overlay.

6. **`fadeMontage`** — multi-image cross-fade chain. Useful for hero/case-study where 3-4 photos rotate.
   - Stack: 4 images on top of each other, stagger opacity 0→1→0 with overlap.

7. **`countdown`** — for event/launch announcements (5-4-3-2-1 reveal).
   - Templates: hospitality-event-special-20s, saas-feature-launch-20s.
   - Stack: counter rapid-tick + stamp on each digit + glitter on "GO".

8. **`urgencyFlash`** — for trades/event/health emergency contexts (red flash + glitch + pulse).
   - Templates: trades-service-callout-20s ("Burst pipe? Power out? Roof leak?").
   - Why distinct from `signalPulse`: urgencyFlash is alarming, signalPulse is reassuring. Different colour, different rhythm.

### Tier 3 — nice to have, not blocking

9. **`brandLockup`** — final brand mark settle (different from `confettiFinale` — quieter, just brand + URL with no celebration). For premium templates.

10. **`statBurst`** — specifically for outcome stats like "12 hrs/wk saved" — combines counter + emphasis ring + warm color flash. More specific than `superImpact` which is broader.

11. **`pulseGroup`** — synchronized pulse on a row of icons/cards (3-up benefits) without the heavy stagger animation.

12. **`textTwist`** — text rotation reveal for kinetic-pop templates that need motion that isn't burst/explode.

## Coverage matrix

For each existing template, which moments are covered by current combos vs would benefit from a Tier-1 gap fill:

| Template                           | Covered by combos     | Tier-1 gap that would help     |
| ---------------------------------- | --------------------- | ------------------------------ |
| hero-promo-30s                     | cinematicReveal, confettiFinale, holoFlash | — |
| case-study-60s                     | dreamSequence, superImpact | **focusPull** for solution scene |
| social-reel-15s                    | kineticBurst, slamCut | — |
| testimonial-45s                    | cinematicReveal | **spotlight** + **testimonialReveal** |
| product-launch-30s                 | holoFlash, confettiFinale | **pricePop** for offer scene |
| founder-story-60s                  | dreamSequence | **focusPull** for portrait scene |
| before-after-20s                   | slamCut, superImpact | — |
| faq-quick-30s                      | cinematicReveal | (marqueeScroll maybe) |
| ecommerce-product-spotlight-30s    | confettiFinale | **pricePop** |
| ecommerce-social-reel-15s          | kineticBurst | **pricePop** |
| trades-service-callout-20s         | signalPulse | **urgencyFlash** for hook |
| trades-before-after-30s            | slamCut, superImpact | — |
| trades-trust-builder-45s           | cinematicReveal, signalPulse | **testimonialReveal** for review pull |
| realestate-listing-tour-45s        | dreamSequence, superImpact | **focusPull** on hero scene |
| realestate-listing-reel-15s        | kineticBurst, superImpact | — |
| realestate-agent-brand-30s         | cinematicReveal | **testimonialReveal** for client quote |
| saas-product-tour-30s              | holoFlash, signalPulse | **pricePop** for pricing chip |
| saas-feature-launch-20s            | confettiFinale | (countdown maybe) |
| saas-case-study-60s                | dreamSequence, superImpact | **focusPull**, **testimonialReveal** |
| hospitality-cafe-vibe-15s          | dreamSequence | — |
| hospitality-restaurant-promo-30s   | cinematicReveal | — |
| hospitality-event-special-20s      | confettiFinale | (countdown maybe) |
| wellness-clinic-trust-45s          | cinematicReveal, signalPulse | **testimonialReveal** for patient quote |
| wellness-fitness-transformation-30s | superImpact, slamCut | — |
| wellness-spa-mood-20s              | dreamSequence | — |

**Most-asked-for new combos** (count of templates that would adopt):
- `pricePop` — 4 templates
- `testimonialReveal` — 4 templates
- `focusPull` — 4 templates
- `spotlight` — 1 template (but high impact)
- `urgencyFlash` — 1 template (but only trades-callout uses it deeply)

## Decision criteria for batch-2

- **Build it** if ≥3 existing templates would adopt it AND it composes existing primitives without needing new ones.
- **Skip it** if it's a niche one-off (build that one inline in the template, don't make a combo).
- **Build a primitive instead** if the moment requires a new visual effect (e.g. radial mask isn't a primitive yet — building `spotlight` requires it first).

Recommended batch-2 (4 combos): `pricePop`, `testimonialReveal`, `focusPull`, `spotlight`. The first three need only existing primitives; `spotlight` needs a new radial-mask primitive added to `effect-fx.js` first.
