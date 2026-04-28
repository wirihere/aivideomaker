> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Combo-fx Batch-2 Plan — 2026-04-26

> Drafted by the Combo-fx Batch-2 Evaluation Supervisor after a production-render visual sweep, a 25-template usage census, the prior gap analysis in `combo-gaps-2026-04-26.md`, and external promo-video research.

---

## Verdict

**SHIP BATCH-2 — yes.** Build **6 combos**: 4 from the Tier-1 list in `combo-gaps-2026-04-26.md` (validated) plus **2 newly-surfaced patterns from the template census** that the prior gap doc missed.

### Why

Three signals all point the same way:

1. **Production-render visual evidence (kindred-production-30s).** The four combos used (`cinematicReveal`, `hyperGlitch`, `kineticBurst` ×3, `confettiFinale`) work — but the moments that *shine on freeze frames* are the static end-state ones (frame 17.85s confettiFinale, frame 4.55s inkBleed mid-warp, frame 1.85s headline settled). The motion-heavy combos (`kineticBurst`, `hyperGlitch`) read clearly in motion but produce ambiguous freeze frames mid-effect. **Implication:** there is genuine room for combos that own *static-revealing* moments — focusPull, spotlight, pricePop — because they hold their visual identity even in single frames. We are not over-served on that vector.

2. **Template-usage census (25 templates).** Only **3 of 25** templates currently invoke `comboFx.*` (`hero-promo-30s`, `case-study-60s`, `kindred-production`). The other 22 still wire 4-7 bare-primitive calls per scene that match recurring named-moment patterns. The most frequent bare-primitive sequences:

   | Pattern (bare primitives) | Templates that use it | Candidate combo |
   |---|---:|---|
   | `stamp` + 2× `glitchBurst` on headline/hook/price/date | 12+ | `glitchStamp` (NEW — surfaced from census) |
   | `counter` + `glitterFx.ambient` for stat groups | 7+ | reuse `superImpact` is wrong fit; need `statGroup` (NEW) or `signalPulse` adapted |
   | per-letter `stagger` quote (0.018 stagger, slight rotation) | 5+ | `testimonialReveal` (Tier-1) |
   | 3-row `stagger` cascade for benefits / 3-up | 5+ | (covered well enough by primitives — skip) |
   | Price reveal: `stamp` + `glitchBurst` ×2 + `glitterFx.burst` | 4+ | `pricePop` (Tier-1) |
   | `glitterFx.burst` + `glitchBurst` on CTA verb | 6+ | (covered by `confettiFinale`/`holoFlash` close enough — skip) |
   | Hero photo + headline reveal with no depth motion | 4+ | `focusPull` (Tier-1) |
   | Quote pulled out of background ("the answer is X") | 3+ | `spotlight` (Tier-1) |

3. **Prior gap doc validation.** All 4 Tier-1 candidates in `combo-gaps-2026-04-26.md` survive scrutiny. Each is backed by ≥3 templates that today do bare-primitive sequences for that exact moment.

### Why these six (not all 12 from gap doc)

- Tier-2 / Tier-3 candidates (`marqueeScroll`, `fadeMontage`, `countdown`, `urgencyFlash`, `brandLockup`, `statBurst`, `pulseGroup`, `textTwist`) all have ≤1-2 template adopters or are easy to inline. Skip.
- One Tier-1 candidate (`spotlight`) needs a **new primitive** before the combo can be built — flagged as a dependency.
- Two new combos surfaced from the bare-primitive census that the gap doc didn't mention: `glitchStamp` (12+ adopters) and `statGroup` (7+ adopters). These have higher adoption density than 3 of the 4 Tier-1 candidates.

---

## Recommended Batch-2 (6 combos, in priority order)

### Priority 1 — `glitchStamp` (NEW; surfaced from census)
- **Moment owned:** "stamp the word/headline/price/date with snap-of-energy" — the most-repeated 4-call sequence across the template library.
- **Why distinct from existing combos:** `superImpact` requires a number, `kineticBurst` is letter-explosion, `hyperGlitch` is sub-second disruption. None of those is the exact "stamp + double-glitch" flavor that 12+ templates do today.
- **Primitives needed (all exist):** `textFx.stamp`, `effectFx.glitchBurst` ×2, optional `glitterFx.burst` (small).
- **Templates that would adopt:** ecommerce-social-reel-15s (`#s1-hook`, `#s4-mark`), social-reel-15s (`#s1-hook`), before-after-20s (`#s1-stamp`, `#s5-mark`), product-launch-30s (`#s1-mark`, `#s2-headline-em`, `#s4-date`), hospitality-event-special-20s (`#s1-event`, `#s3-date`), saas-feature-launch-20s (`#s1-feature`, `#s4-mark`), saas-product-tour-30s (`#s1-mark`, `#s4-headline`, `#s5-cta-em`), trades-service-callout-20s (`#s1-p1/p2/p3`, `#s4-cta-label`, `#s5-mark`), wellness-fitness-transformation-30s (`#s1-duration`, `#s4-offer-detail`, `#s5-cta`). **9 templates, ~25 invocations.**
- **Estimated visual lift:** 3/5 (per moment), but the *consolidation* lift is huge — each invocation reduces 3-4 lines of bare-primitive boilerplate to one combo call.
- **Default duration:** 0.9s.
- **Example invocation:**
  ```js
  comboFx.glitchStamp(tl, "#s1-hook", {
    at: 0.4, duration: 0.9,
    fromScale: 1.5,        // stamp opening scale
    bursts: 2,             // 1 | 2 | 3 glitch beats
    burstSpacing: 0.5,     // seconds between glitches
    glitter: false,        // optional small dust burst
    intensity: 1.0, seed: 1,
  });
  ```

### Priority 2 — `pricePop` (Tier-1, validated)
- **Moment owned:** price reveal — currency entrance, optional strikethrough on "before" price, scale + glitter on "now" price.
- **Why distinct from `superImpact`:** `superImpact` runs `inkBleed → counter → stamp → glitch → glitter`. That counter dependency assumes the value ticks from 0, which is wrong for prices ($49 doesn't count up from $0 — it appears). pricePop is "currency-symbol fade-in + dollar-amount stamp + strikethrough wipe + glitter".
- **Primitives needed (all exist):** `textFx.stamp`, `effectFx.glitchBurst`, `glitterFx.burst`. Optional new sub-primitive: a `strikethroughWipe` inline tween (just a scaleX on a `<span>` rule — no new module needed).
- **Templates that would adopt:** ecommerce-product-spotlight-30s (`#s4-price` "Now $X / was $Y"), ecommerce-social-reel-15s (`#s3-price` "$49"), saas-product-tour-30s ("Everything for $29/mo"), wellness-fitness-transformation-30s (`#s4-offer` "First month: $29"). **4 templates.**
- **Estimated visual lift:** 4/5 — the moment is signature for ecommerce/SaaS verticals.
- **Default duration:** 1.2s.
- **Example invocation:**
  ```js
  comboFx.pricePop(tl, "#s4-price", {
    at: 22.9, duration: 1.2,
    currency: "#s4-currency",   // optional separate $ element
    strikethrough: "#s4-was",   // optional "was $79" element
    intensity: 1.0, seed: 31,
  });
  ```

### Priority 3 — `testimonialReveal` (Tier-1, validated)
- **Moment owned:** name + role + avatar + quote choreography. The "real human said this" moment.
- **Why distinct from existing combos:** `cinematicReveal` is one-headline; `dreamSequence` is ambient; nothing today choreographs a 3-element personality (avatar, name, role-typeOn, body-quote per-letter) into one named moment.
- **Primitives needed (all exist):** `textFx.cascade` (name), `textFx.typeOn` (role), `textFx.stagger` (quote per-letter with low rotation), inline `fromTo` (avatar opacity/scale-in), optional `glitterFx.ambient` (rim shimmer).
- **Templates that would adopt:** testimonial-45s (`#s2-quote`), trades-trust-builder-45s (`#s4-quote`), wellness-clinic-trust-45s (`#s4-quote`), saas-case-study-60s (`#s4-quote`), realestate-agent-brand-30s (`#s3-quote`), trades-before-after-30s (`#s4-quote`), case-study-60s (`#s4-quote`). **7 templates** (gap doc undercounted at 4).
- **Estimated visual lift:** 4/5 — testimonial moments today look like "primitive soup", a combo will give them shared identity.
- **Default duration:** 1.8s (testimonial is allowed to breathe).
- **Example invocation:**
  ```js
  comboFx.testimonialReveal(tl, "#s4-host", {
    at: 18.0, duration: 1.8,
    avatar: "#s4-avatar",
    name: "#s4-attrib",
    role: "#s4-attrib-role",
    quote: "#s4-quote",
    intensity: 1.0, seed: 41,
  });
  ```

### Priority 4 — `focusPull` (Tier-1, validated)
- **Moment owned:** depth-of-field rack from background to foreground (or vice versa). The "camera is paying attention" moment.
- **Why distinct from existing combos:** `multiplaneDolly` is camera Z-translation, not focus shift. `cinematicReveal` uses dolly + ink-bleed but never blur. Today, no combo reads as "the lens just refocused".
- **Primitives needed:**
  - `effectFx.multiplaneDolly` (exists — used for the optional Z lock).
  - **NEW PRIMITIVE NEEDED:** `effectFx.rackFocus(timeline, target, opts)` — animates blur on far/mid plane via filter `blur(8px → 0)` with optional reverse-blur on near plane. About 25 lines. Should live in `design/modules/effect-fx.js` next to `multiplaneDolly`.
- **Templates that would adopt:** case-study-60s (s2 "approach" scene), founder-story-60s (s3 portrait scene), realestate-listing-tour-45s (s1 hero), wellness-clinic-trust-45s (s2 "what we treat" scene), saas-case-study-60s (s2 problem scene). **5 templates.**
- **Estimated visual lift:** 4/5 — depth focus is the most-cited "cinematic" technique in promo-video literature (per web research) and we have no equivalent today.
- **Default duration:** 1.4s.
- **Example invocation:**
  ```js
  comboFx.focusPull(tl, "#s2-stage", {
    at: 8.0, duration: 1.4,
    foreground: "#s2-headline",   // becomes sharp
    background: "#s2-bg",         // becomes blurred
    fromBlur: 0, toBlur: 8,       // blur amount on the de-focused plane
    intensity: 1.0,
  });
  ```

### Priority 5 — `statGroup` (NEW; surfaced from census)
- **Moment owned:** 3-4 stat numbers count up together with shared shimmer — the stat-grid moment that every case-study / agent-brand / trust-builder template does.
- **Why distinct from `superImpact`:** `superImpact` is *one* hero number. `statGroup` is 3-5 numbers with staggered counter starts and a single ambient glitter blanket. Today every template that has a stat grid wires 3-5 separate `textFx.counter` calls + a `glitterFx.ambient` underneath manually.
- **Primitives needed (all exist):** `textFx.counter` (×N), `glitterFx.ambient`, optional `effectFx.glitchBurst` on the largest stat as it lands.
- **Templates that would adopt:** case-study-60s (3 stats), realestate-listing-tour-45s (5 stats), realestate-agent-brand-30s (3 stats), realestate-listing-reel-15s (3 stats), trades-trust-builder-45s (4 stats), saas-case-study-60s (1 hero stat + 2 small), founder-story-60s (2 stats). **7 templates.**
- **Estimated visual lift:** 3/5 (per moment), but again the *consolidation* lift is huge.
- **Default duration:** 2.0s.
- **Example invocation:**
  ```js
  comboFx.statGroup(tl, "#s2-grid", {
    at: 7.4, duration: 2.0,
    stats: ["#s2-c1-num", "#s2-c2-num", "#s2-c3-num"],
    stagger: 0.18,                // delay between counter starts
    ambient: true,                // background sparkle
    intensity: 1.0, seed: 51,
  });
  ```

### Priority 6 — `spotlight` (Tier-1, validated — but DEPENDS on a new primitive)
- **Moment owned:** circular vignette focus on a key element while dimming everything else. The "this is the answer" moment.
- **Why distinct from existing combos:** no combo today owns the "isolate one element with a soft halo + dim siblings" beat. Closest is `signalPulse` (rings) and `dreamSequence` (cool grade), neither isolates a single element.
- **Primitives needed:**
  - `textFx.stamp` + `effectFx.glitchBurst` (exist — for the highlighted element).
  - **NEW PRIMITIVE NEEDED:** `effectFx.radialMask(timeline, target, opts)` — a `<div class="fx-radial-mask">` overlay that animates a radial-gradient `mask-image` from full-coverage → cutout-around-target. About 30 lines + ~20 lines of CSS in `effects-batch-08.css` for the `.fx-radial-mask` host. Should live in `design/modules/effect-fx.js`.
- **Templates that would adopt:** testimonial-45s (when the killer line lands), case-study-60s (s4 quote), faq-quick-30s (when the answer lands), saas-case-study-60s (s4 quote moment). **4 templates** (gap doc undercounted at 1).
- **Estimated visual lift:** 5/5 — completely-new visual signature, very memorable.
- **Default duration:** 1.6s.
- **Example invocation:**
  ```js
  comboFx.spotlight(tl, "#s4-quote", {
    at: 18.0, duration: 1.6,
    radius: 380,                  // px around target to keep visible
    softness: 200,                // gradient feather
    dimAmount: 0.65,              // how dark the surround goes
    intensity: 1.0, seed: 61,
  });
  ```

---

## Required new primitives (build first, before combos)

Two new primitives must be added to `design/modules/effect-fx.js` before the dependent combos can ship. Both are mechanically simple — the work is figuring out the CSS bridge and registering them on `window.effectFx`.

### `effectFx.rackFocus` — for `focusPull`
- **Adds:** ~25 lines JS in `effect-fx.js`.
- **Mechanism:** `gsap.fromTo(target, { filter: "blur(0px)" }, { filter: "blur(8px)" })` with `clearAfter` cleanup matching the `inkBleed` pattern. Optional `to: 0` reverses for the focus-in case.
- **API:**
  ```js
  effectFx.rackFocus(timeline, target, {
    at, duration,
    from: 0,    // start blur in px
    to: 8,      // end blur in px
    ease: "power2.inOut",
    clearAfter: true,
  });
  ```
- **Cost:** 30 minutes including a unit test in `compositions/effect-fx-demo.html`.

### `effectFx.radialMask` — for `spotlight`
- **Adds:** ~30 lines JS in `effect-fx.js` + ~20 lines CSS in `effects-batch-08.css`.
- **Mechanism:** ensure-a-bridge inserts a `.fx-radial-mask-overlay::after` pseudo with a `mask-image: radial-gradient(circle at <x>% <y>%, transparent <r>px, black <r+softness>px)`. Animates `--mask-r` and `--mask-opacity` via CSS vars.
- **API:**
  ```js
  effectFx.radialMask(timeline, host, {
    at, duration,
    centerSelector: "#target", // target's bounding box gives center
    radius: 380,
    softness: 200,
    dimAmount: 0.65,
    ease: "power2.out",
    reverseOut: true,           // un-mask on the way out
  });
  ```
- **Cost:** 60 minutes (the CSS-var bridge mirrors the existing `combo-fx-noir-flash` pattern).

---

## Dropped from gap doc (won't ship)

| Candidate | Why dropped |
|---|---|
| `marqueeScroll` | Only 1 template (faq-quick-30s) needs it; can be inlined. |
| `fadeMontage` | No template currently wires it; speculative. |
| `countdown` | Only 1-2 templates (event-special, feature-launch) and the existing `textFx.counter` + `textFx.stamp` chain handles it well enough. |
| `urgencyFlash` | Only 1 template (trades-service-callout-20s); inline 5 lines of red-tint + `glitchBurst`. |
| `brandLockup` | `confettiFinale` already does this with `intensity: 0.4`. |
| `statBurst` | Subsumed by the new `statGroup` recommendation. |
| `pulseGroup` | `glitterFx.ambient` + manual stagger handles this; not worth a combo. |
| `textTwist` | Speculative; no current template adopters. |

---

## Implementation sequence (recommended)

1. **Build primitives first** (Day 1 morning):
   - `effectFx.rackFocus`
   - `effectFx.radialMask`
   - Update `compositions/effect-fx-demo.html` to demo each.
   - Run `npm run check` / `npx hyperframes lint`.

2. **Build combos in adoption order** (Day 1 afternoon → Day 2):
   - `glitchStamp` (highest adoption, simplest stack — proves the pattern fast)
   - `statGroup` (next highest adoption, also simple)
   - `pricePop` (high signature value, builds on `glitchStamp` knowledge)
   - `testimonialReveal` (most choreography work)
   - `focusPull` (depends on `rackFocus`)
   - `spotlight` (depends on `radialMask`)

3. **Demo + catalog** (Day 2 PM):
   - Extend `compositions/combo-fx-demo.html` from 10 scenes to 16.
   - Re-run `scripts/build-catalog.mjs` to regenerate thumbnails.

4. **Update LEARNINGS.md** §3 with the new combos + APIs (matches the existing pattern).

5. **Smoke test against templates** (Day 3):
   - Pick 2 templates per new combo, retrofit the bare-primitive sequence to the combo call, render, diff. This is the real validation — does the combo collapse 3-4 lines into 1 without visual regression?

**Estimated total cost:** 2-3 days of focused work for one implementor agent.

---

## Decision criteria recap (from `combo-gaps-2026-04-26.md`)

> Build it if ≥3 existing templates would adopt it AND it composes existing primitives without needing new ones.
> Skip it if it's a niche one-off (build that one inline in the template, don't make a combo).
> Build a primitive instead if the moment requires a new visual effect.

| Combo | ≥3 adopters? | Needs new primitive? | Decision |
|---|:-:|:-:|:-:|
| `glitchStamp`        | yes (9) | no | **build** |
| `pricePop`           | yes (4) | no | **build** |
| `testimonialReveal`  | yes (7) | no | **build** |
| `focusPull`          | yes (5) | yes (`rackFocus`) | **build primitive + combo** |
| `statGroup`          | yes (7) | no | **build** |
| `spotlight`          | yes (4) | yes (`radialMask`) | **build primitive + combo** |

All six pass the criteria. Greenlight the batch.
