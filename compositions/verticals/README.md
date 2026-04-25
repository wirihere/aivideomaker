# Vertical Composition Templates

Vertical-specific structural templates — each one is a complete `.html`
composition tuned for a particular industry, with the asset slots and
scene structure that vertical's videos need.

These are **vertical** templates. They sit on top of the **vibe** templates
in `design/templates/` and the **structural** templates in
`compositions/templates/`. A vertical template encodes the *content shape*
of the vertical (what scenes the brief always needs); the vibe layer
controls *how it feels*; the brand-tokens layer controls *how it looks*.

```
┌───────────────────────────────┐
│ compositions/verticals/<x>    │  vertical form  (THIS folder)
└───────────────────────────────┘ industry-specific scene shape + slots
              ↓
┌───────────────────────────────┐
│ design/templates/<vibe>.css   │  vibe layer — kinetic-pop / etc.
└───────────────────────────────┘
              ↓
┌───────────────────────────────┐
│ design/tokens-<brand>.css     │  brand layer — palette + fonts
└───────────────────────────────┘
```

## E-commerce / Product

For DTC, Shopify, marketplace sellers, niche product brands.

### What e-commerce videos need

The brief is consistent across product brands — every effective product
video has to hit these beats:

1. **Product hero shot.** Front-and-centre, well-lit, on a clean or
   gradient background. A subtle dolly / parallax sells "filmed", not
   "stock-photo on slide".
2. **3–4 key benefits or specs.** Short, declarative. Material /
   ingredient / build / outcome. Each benefit is one icon + one short
   line + one supporting line.
3. **Social proof.** Star rating + review count + (optionally) one short
   pull quote. People buy after they see other people bought.
4. **Price + offer.** The number, plus the sweetener — "Free shipping",
   "30-day returns", "Buy 2 get 1 free", or a strikethrough showing the
   discount.
5. **CTA + URL.** Clear verb ("Shop now" / "Get yours"), arrow, and the
   URL on screen long enough to read. The CTA is the only moment the
   viewer should feel like they're being asked to act.

### When to pick which template

| Template                                | Use for                                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `ecommerce-product-spotlight-30s.html`  | Landscape product launch / paid-social ad / website hero. Has room to breathe — full benefits row + dedicated social-proof beat. |
| `ecommerce-social-reel-15s.html`        | TikTok / Reels / Shorts. Hook → reveal → price → URL. Optimised for thumb-stop hooks and a heavy price-reveal moment.            |

### `ecommerce-product-spotlight-30s.html` — 30-second spotlight

Landscape 1920×1080, 30s, kinetic-pop base. Five scenes:

1. **0–5s** Brand chip + product hero (multiplane dolly on product image).
   `data-scene-grade="pop"` for product punch.
2. **5–15s** 3-up benefits with icon + headline + body (`textFx.stagger`).
3. **15–22s** Social proof — `★★★★★` + `4.9 from 2,000 reviews` + pull quote.
4. **22–28s** Price block — strikethrough + discounted price + offer line.
5. **28–30s** CTA — "Shop now → brand.com" with `glitterFx.burst` and
   `glitchBurst` on the verb.

### `ecommerce-social-reel-15s.html` — 15-second reel

Portrait 1080×1920, 15s, kinetic-pop base. Four scenes:

1. **0–3s** Big hook — "Tired of X?" / "The Y that changed everything"
   (stamp + glitch on the emphasised word). `data-scene-grade="pop"`.
2. **3–9s** Quick product reveal + 2 stacked benefits with check-marks.
3. **9–13s** Price reveal + CTA — heavy `glitterFx.burst` on the price
   (110 particles, 820 distance), glitch on the price digits, then the
   "Get yours →" CTA fades up.
4. **13–15s** Brand wordmark + URL fade-out.

### Asset slots

Both templates expose named asset slots (HTML element ids) that the
orchestrator / a human editor populates with real product copy and assets.
The placeholders in the source file are obvious — search-and-replace.

#### `ecommerce-product-spotlight-30s.html`

| Slot id              | What it is                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| `#s1-brand-chip`     | Brand wordmark (text). Replace with `<img>` for a logo if needed.         |
| `#s1-product-image`  | Product hero image. Set `background-image: url(...)` in the inline style. |
| `#s1-product-name`   | Product name headline.                                                    |
| `#s1-product-name-em`| The accented portion (gets `glitchBurst`).                                |
| `#s2-cell-1` / `-2` / `-3` | Three benefit cells. Each has `.s2-icon`, `.s2-title`, `.s2-body`.  |
| `#s2-t1` / `-t2` / `-t3`   | The three short benefit titles ("FAST" / "PREMIUM" / "GUARANTEED"). |
| `#s3-stars`          | 5-star rating string `★★★★★`.                                             |
| `#s3-rating`         | Numeric rating (e.g., `4.9`). Animated by `textFx.counter`.               |
| `#s3-count`          | Review count line ("FROM 2,000+ REVIEWS").                                |
| `#s3-quote`          | Pull quote (one short sentence).                                          |
| `#s4-strikethrough`  | Pre-discount price (optional — leave or delete).                          |
| `#s4-price`          | Sale / current price.                                                     |
| `#s4-offer`          | Offer line ("Free shipping — every order").                               |
| `#s5-cta` / `-cta-verb` | CTA. The verb gets `glitchBurst`.                                      |
| `#s5-url`            | Brand URL.                                                                |

#### `ecommerce-social-reel-15s.html`

| Slot id          | What it is                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| `#s1-hook`       | Hook line (one short sentence, ~40 chars).                                |
| `#s1-hook-em`    | Emphasised word in the hook (gets `glitchBurst`).                         |
| `#s2-product`    | Product hero image. Set `background-image: url(...)` in the inline style. |
| `#s2-b1` / `-b2` | Two benefit lines (~30 chars each, with check-mark prefix).               |
| `#s3-price`      | The price ("$49"). Stamp + glitter burst + glitch.                        |
| `#s3-cta` / `-cta-verb` | CTA — "Get yours →". The verb gets `glitchBurst`.                  |
| `#s4-mark`       | Brand wordmark (closer card).                                             |
| `#s4-url`        | Brand URL.                                                                |

### Recommended music

Kinetic-pop pairs with motivational pop / electronic, **110–130 BPM**.
Look for tracks that:

- Open with a vocal-led or synth-stab hook (matches the 0–5s brand chip beat).
- Hit a clear chorus / drop in the back third (lands on the price reveal
  in scene 4 of the 30s, scene 3 of the 15s).
- End on a clean cymbal or sub-drop (so the URL card doesn't feel lopped).

Shortlist categories: "uplifting pop", "modern fashion", "energetic
commercial", "DTC commercial". Avoid tracks with strong lyrical
storytelling — the on-screen copy and the narration carry the message;
music sits underneath.

### How to use

Same flow as `compositions/templates/`:

1. Copy the file to project root as `index.html`.
2. Update the relative `../../design/` paths to `design/` (the existing
   templates README has the one-line `sed`).
3. Swap `tokens-PLACEHOLDER.css` for your real `tokens-<brand>.css`.
4. Fill in the slots above.
5. `npx hyperframes preview` then `npx hyperframes render`.

Both templates use `tl.fromTo()` (deterministic capture), register on
`window.__timelines["<composition-id>"]`, ship paused, and end with the
standalone autoplay guard.

## Hospitality

For restaurants, cafes, bars, food trucks, hotels, and local hospitality
businesses. Hospitality differs from product-led verticals on two axes —
**visuals do most of the selling** (a sharp dish photo beats a clever
headline every time), and **the conversion is "come in and eat / book a
table"**, not "buy now". Templates lean warm and golden, lead with the
appetite signal, and end with one frictionless booking step.

### What hospitality videos need

Every effective hospitality video has to hit these beats:

1. **Mouth-watering visuals.** Dish closeups (flatlay, golden tones), the
   interior at eye-level, the exterior at golden hour. Visuals carry the
   conversion — the copy is supportive.
2. **Atmosphere / vibe signal.** Date night, family lunch, brunch crowd,
   late-night bar — the viewer needs to picture themselves at one of
   those tables.
3. **Menu signals.** Bestseller, chef's pick, a price for at least one
   item, dietary callouts where they apply (★ vegan, GF, halal). Don't
   bury the price — confidence sells.
4. **Location + opening hours.** Suburb, hours, "open daily 5pm – late".
   One short address line is enough; the viewer will Google the rest.
5. **Booking / order ease.** OpenTable / Resy / direct, walk-in friendly,
   or "Order online" — name the platform so trust transfers, then a
   short URL or phone on screen long enough to read.
6. **Special offer (optional).** Set menu Tuesdays, happy hour 5–7,
   weekend brunch deal — a dated reason to come *now*, not someday.

### When to pick which template

| Template                                  | Use for                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `hospitality-cafe-vibe-15s.html`          | Cafe / brunch spot Insta-reel. Vertical 15s, warm grade. Mood hook → 3 dish reveals → location chip → URL underline.                |
| `hospitality-restaurant-promo-30s.html`   | Full-service restaurant landscape promo / paid-social ad. 30s, documentary base. Name → menu → hours/booking → set-menu → CTA.     |
| `hospitality-event-special-20s.html`      | Bar / venue / weekend event reel. Vertical 20s, kinetic-pop. Day stamp → 3 highlights → date+time → "Book your table" glitter CTA. |

### `hospitality-cafe-vibe-15s.html` — 15-second cafe vibe

Portrait 1080×1920, 15s, **warm-community** base, `data-scene-grade="warm"`
on every scene (food needs warmth). Four scenes:

1. **0–3s** Moody hook — "Your Tuesday morning" cascade over a warm
   radial-light background. Sets atmosphere before saying a word.
2. **3–9s** Three-up dish reveals — three stacked tiles stagger up from
   the bottom, each a placeholder for a flatlay dish photo.
3. **9–13s** Location chip — `[Cafe Name]` cascade + suburb + hours pill
   ("7am – 3pm · Daily").
4. **13–15s** URL underline + brand wordmark — wordmark cascade, URL
   fade-up, then a left-to-right `scaleX` underline sweep.

### `hospitality-restaurant-promo-30s.html` — 30-second restaurant promo

Landscape 1920×1080, 30s, **documentary** base, `data-scene-grade="warm"`
on the menu scene (the dishes need golden grade). Five scenes:

1. **0–6s** Restaurant name + tagline (left) + interior placeholder hero
   (right). Italic Playfair name + accent rule + supporting line.
2. **6–16s** Menu highlights — 4-column dish grid with image, name, tag
   (★ Bestseller / GF · Vegan / Chef's pick / Sharing plate), and a
   warm-coloured price. `stagger: 0.5` so each dish gets a beat.
3. **16–22s** Hours + booking CTA — "Open daily 5pm – late" cascade,
   suburb mono caption, and a pill CTA (`Reserve on OpenTable`).
4. **22–28s** Special offer — "Tuesdays only" stamp + "Set menu $45pp"
   italic display + supporting line.
5. **28–30s** "Book online → URL" — italic CTA cascade with arrow slide
   and URL fade-up.

### `hospitality-event-special-20s.html` — 20-second event special

Portrait 1080×1920, 20s, **kinetic-pop** base. Four scenes:

1. **0–3s** Day stamp impact — "This Saturday" pill + `[Event] Night`
   stamp with `glitchBurst` on the emphasised word.
2. **3–10s** What's on — three icon-rows slide in from the left with a
   `0.45s` stagger: Live DJ / Set Menu / Drinks Deal. Each title gets a
   `textFx.stagger` rotation.
3. **10–15s** Date + time + location — "Sat [Nov 9]" stamp + glitch on
   the date + time line + venue pill.
4. **15–20s** "Book your table → URL" — cascade CTA + 80-particle
   `glitterFx.burst` + glitch on `table` + URL fade-up.

### Asset slots

#### `hospitality-cafe-vibe-15s.html`

| Slot id           | What it is                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| `#s1-bg`          | Hero atmosphere shot — interior, eye-level, warm light. Set `background-image`. |
| `#s1-hook`        | Mood hook line ("Your Tuesday morning").                                    |
| `#s1-hook-emph`   | Emphasised italic word(s) at the end.                                       |
| `#s2-dish-1` / `-2` / `-3` | Three dish tiles. Replace gradient with `background-image: url(...)` flatlay. |
| `#s3-cafe`        | Cafe name (display).                                                        |
| `#s3-suburb`      | Suburb (mono uppercase).                                                    |
| `#s3-hours`       | Hours pill ("7am – 3pm · Daily").                                           |
| `#s4-mark`        | Wordmark / short-name closer.                                               |
| `#s4-url`         | URL.                                                                        |

#### `hospitality-restaurant-promo-30s.html`

| Slot id              | What it is                                                                     |
| -------------------- | ------------------------------------------------------------------------------ |
| `#s1-name`           | Restaurant name (italic display).                                              |
| `#s1-tagline`        | Tagline / "what kind of room" line.                                            |
| `#s1-hero`           | Interior hero placeholder. Replace gradient with eye-level dining-room photo.  |
| `#s2-card-1` … `-4`  | Four dish cards. Each has `.s2-card-img`, `.s2-card-name`, `.s2-card-tag`, `.s2-card-price`. Replace gradients with flatlay dish photos. |
| `#s3-hours`          | Hours line ("Open daily 5pm – late").                                          |
| `#s3-suburb`         | Suburb mono caption.                                                           |
| `#s3-cta`            | Booking-platform CTA pill ("Reserve on OpenTable").                            |
| `#s4-stamp`          | Offer-day stamp ("Tuesdays only").                                             |
| `#s4-offer`          | Offer headline ("Set menu $45pp" — italic, with `s4-offer-em` for the price). |
| `#s4-detail`         | Offer detail line.                                                             |
| `#s5-book`           | Final CTA ("Book online →" — italic).                                          |
| `#s5-url`            | Booking URL (mono).                                                            |

#### `hospitality-event-special-20s.html`

| Slot id              | What it is                                                                     |
| -------------------- | ------------------------------------------------------------------------------ |
| `#s1-bg`             | Atmosphere placeholder — high-contrast DJ / packed-bar shot.                   |
| `#s1-day`            | Day pill ("This Saturday").                                                    |
| `#s1-event`          | Event name stamp; `s1-event-em` is the accented word (gets `glitchBurst`).     |
| `#s2-row-1` … `-3`   | Three highlight rows. Each has `.s2-icon`, `.s2-row-title`, `.s2-row-body`.    |
| `#s3-date`           | Date stamp; `s3-date-em` is the accented date (gets `glitchBurst`).            |
| `#s3-time`           | Time line ("7pm – Late").                                                      |
| `#s3-venue`          | Venue pill ("[Venue Name · Suburb]").                                          |
| `#s4-cta`            | Final CTA ("Book your table →"); `s4-cta-em` is the emphasised word.           |
| `#s4-url`            | Booking URL (mono).                                                            |

### Photo style guide

Hospitality is the most-photo-dependent vertical in this set — the
templates are scaffolds for *images*, not for headlines.

- **Dishes:** shot from directly above (flatlay), in natural side-light
  or warm tungsten, on a contrasting surface (dark stone, marble, raw
  wood). Crop tight enough that the textures read at small thumbnail
  size. Avoid mid-bite "lifestyle" shots — they age fast and don't
  flatlay-grid well.
- **Interior:** eye-level, from a customer's perspective at a table — so
  the viewer can imagine themselves there. Golden hour or soft warm
  tungsten, never flat overhead lighting. A bit of foreground (a glass,
  a candle, a hand) sells "you're already here".
- **Exterior:** golden-hour or twilight only. The signage should be
  legible. If the exterior is forgettable, skip it — use a hero
  interior in the place where the exterior would go.
- **Vibe / people:** wide enough to read the room (not faces). Backs of
  heads and silhouettes are fine and often better — they don't require
  releases and don't go stale.

### Recommended music

| Template                                | Music                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `hospitality-cafe-vibe-15s.html`        | **`warm-community`** — soft, organic, acoustic-led. Avoid percussion-heavy tracks; let the visuals carry pace. |
| `hospitality-restaurant-promo-30s.html` | **`warm-community`** — editorial, slow-build, 75–95 BPM. Should breathe; documentary pacing needs space. |
| `hospitality-event-special-20s.html`    | **`kinetic-pop`** — driving, 115–130 BPM, with a clear drop on the "Book your table" CTA at 15s.    |

### How to use

Same flow as the e-commerce section above:

1. Copy the file to project root as `index.html`.
2. Update the relative `../../design/` paths to `design/`.
3. Swap `tokens-PLACEHOLDER.css` for your real `tokens-<brand>.css`.
4. Fill in the slots above and drop dish photography into the placeholder
   tiles (`background-image: url(...)`).
5. `npx hyperframes preview` then `npx hyperframes render`.

All three templates use `tl.fromTo()` (deterministic capture), register
on `window.__timelines["<composition-id>"]`, ship paused, and end with
the standalone autoplay guard.

## Real Estate

For property listings, agent personal brands, and neighbourhood guides.
Real-estate video is high-consideration — the goal is never "buy now",
it's "click through to the listing" or "book a viewing". Templates lead
with the address, qualify with hard stats, and end with one clear next
step (URL or phone).

### What real-estate videos need

Every effective real-estate video has to hit these beats, in order:

1. **Trigger desire for the property.** First impression is the hero
   exterior or one feature shot (pool, view, kitchen). Address and price
   land inside the first six seconds. Premium listings earn slow zooms;
   entry-level listings earn slammed cuts.
2. **Lower friction with hard facts.** Beds, baths, garage, floor area
   (m² or sqft), land area, school zone, transit. Buyers self-qualify on
   these numbers before they book a viewing. Counters animate; counts
   feel like data, not pitch.
3. **Build agent trust.** Face, name, brokerage, phone. People list with
   agents, not agencies. The agent-brand spot exists for this alone; the
   listing tour borrows it for the open-home scene.
4. **One clear next step.** "Book a viewing", "View listing →", or a
   phone number — never "buy now". The video's job is to earn the next
   click.

### When to pick which template

| Template                                   | Use for                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `realestate-listing-tour-45s.html`         | Premium / luxury landscape listing tour. Slow zooms, 5-stat grid, 4 feature highlights, agent open-home scene, cinemagraph CTA.          |
| `realestate-listing-reel-15s.html`         | Mid-market social listing reel — TikTok / Reels / Shorts. Address slam → 3-stat counter → open home → URL.                              |
| `realestate-agent-brand-30s.html`          | Agent personal-brand spot for any platform. Headshot → track-record stats → testimonial → "Let's talk" → URL.                            |

### `realestate-listing-tour-45s.html` — 45-second luxury tour

Landscape 1920×1080, 45s, **quiet-premium** base, `data-scene-grade="cool"`
on the address, stats, and CTA scenes (architectural / luxury feel).
Five scenes:

1. **0–6s** Address + price reveal. `For Sale` kicker, address cascade
   with a 5-second slow scale settle, suburb expand-letter-spacing, hairline
   rule reveal, then price fade-up in the brand accent.
2. **6–18s** 5-stat grid — beds / baths / car / land m² / floor m². Each
   cell uses `textFx.counter` with a stagger of 0.2s between cells. Top
   border on each cell reads as a thin product-spec line.
3. **18–30s** 4 feature highlights — numbered `01 / 02 / 03 / 04` with
   short titles ("North-facing aspect", "Brand new kitchen", "Walk to the
   village", "Indoor-outdoor flow"). Each line `cascade`s in with a
   trailing rule sweep.
4. **30–38s** Open home + agent. Circular headshot (gradient placeholder),
   "Open Home" kicker, day/time cascade, agent name, phone (tabular nums),
   brokerage uppercase.
5. **38–45s** CTA + cinemagraph background. Slow rotating cinemagraph,
   "View the Listing" kicker, "Book a private viewing" cascade with the
   `private viewing` em-coloured, hairline rule, mono URL.

### `realestate-listing-reel-15s.html` — 15-second social reel

Portrait 1080×1920, 15s, **kinetic-pop** base. Four scenes:

1. **0–3s** Address slam — `Just Listed` kicker, address `stamp`, suburb
   `stamp` in accent + double `glitchBurst`, price fade-up.
2. **3–8s** 3-stat counter — beds / baths / floor m². Big top-border
   cells stagger up, counters race up over 1.2–1.6s.
3. **8–12s** Open home + agent — `Open Home` kicker, "Sat 12-1pm" stamp
   with `12-1pm` in accent + `glitchBurst`, agent name fade-up.
4. **12–15s** CTA — "View listing" stamp on accent block, mono URL,
   `glitterFx.burst` (56 particles, 540 distance) for a hard close.

### `realestate-agent-brand-30s.html` — 30-second agent spot

Landscape 1920×1080, 30s, **warm-community** base, `data-scene-grade="warm"`
on the agent intro (golden, human warmth). Five scenes:

1. **0–6s** Agent photo + name + brokerage. Circular gradient headshot
   placeholder (420px), "Your Local Agent" kicker, name cascade, role
   line ("Licensed Agent · REAA 2008"), brokerage line.
2. **6–14s** Track record — "Twelve-Month Track Record" kicker, two big
   stats side-by-side (Homes Sold / Days Avg. To Sell) with `textFx.counter`
   and `glitterFx.ambient` sparkle (38 particles), then suburb call-out
   "across [Suburb] & [Suburb]" in accent serif.
3. **14–22s** Testimonial pull-out — long-shadow open-quote, italic
   serif quote with per-letter `textFx.stagger` (0.018 stagger, -3°
   rotation), attribution name + role caption.
4. **22–28s** "Thinking of selling? Let's talk." — display cascade with
   `Let's talk.` em-coloured; phone number in display weight (tabular
   nums) scale-in; "Call or text any time" caption.
5. **28–30s** CTA — brokerage wordmark + URL on accent block.

### Asset slots

#### `realestate-listing-tour-45s.html`

| Slot id              | What it is                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| `#s1-address`        | Street address (display).                                                 |
| `#s1-suburb`         | Suburb · region uppercase mono.                                           |
| `#s1-price`          | Price line ("$2,450,000" or "POA" / "Auction TBD").                       |
| `#s2-c1-num`…`-c5-num` | Five stats: beds / baths / car / land m² / floor m². Counter recipe. |
| `#s2-c4` / `-c5` `.s2-cell-unit` | Optional unit (m² / sqft) — drop or keep per cell.            |
| `#s3-c1-title`…`-c4-title` | Four feature highlight titles (~24 chars each).                     |
| `#s4-photo`          | Agent headshot. Replace gradient with `<img>`/`background-image`.         |
| `#s4-when`           | Open-home day/time ("Saturday 12 – 1 pm").                                |
| `#s4-agent-name`     | Agent name.                                                               |
| `#s4-agent-phone`    | Agent phone.                                                              |
| `#s4-agent-brokerage` | Brokerage uppercase mono.                                                |
| `#s5-cta` / `-cta-em` | CTA. The em-coloured span is "private viewing".                          |
| `#s5-url`            | Listing URL (mono).                                                       |

#### `realestate-listing-reel-15s.html`

| Slot id           | What it is                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| `#s1-address`     | Street address (short — ~20 chars).                                       |
| `#s1-suburb`      | Suburb in accent serif.                                                   |
| `#s1-price`       | Price line.                                                               |
| `#s2-c1-num`/`-c2-num`/`-c3-num` | Three stats: beds / baths / floor m².                      |
| `#s3-when`        | Open-home day/time ("Sat 12-1pm" — keep short for portrait).              |
| `#s3-agent`       | Agent first + last name uppercase.                                        |
| `#s4-cta`         | CTA stamp ("View listing").                                               |
| `#s4-url`         | URL (mono).                                                               |

#### `realestate-agent-brand-30s.html`

| Slot id                | What it is                                                              |
| ---------------------- | ----------------------------------------------------------------------- |
| `#s1-photo`            | Agent headshot. Replace gradient with real photo, keep circular mask.   |
| `#s1-name`             | Agent name (display).                                                   |
| `#s1-role`             | License / role line ("Licensed Agent · REAA 2008").                     |
| `#s1-brokerage`        | Brokerage name.                                                         |
| `#s2-c1-num` / `-c2-num` | Track-record stats: homes sold / days to sell.                        |
| `#s2-suburb`           | "across [Suburb] & [Suburb]" accent line.                               |
| `#s3-quote`            | Testimonial quote (italic serif, one sentence).                         |
| `#s3-attrib`           | Quote attribution ("The Patel Family").                                 |
| `#s3-attrib-role`      | Attribution caption ("SOLD — PT CHEVALIER 2025").                       |
| `#s4-headline` / `-em` | Final headline ("Thinking of selling? Let's talk."). Em is "Let's talk."|
| `#s4-phone`            | Agent phone (tabular nums).                                             |
| `#s4-call`             | Caption under phone ("Call or text any time").                          |
| `#s5-mark`             | Brokerage wordmark.                                                     |
| `#s5-url`              | Brokerage URL.                                                          |

### Photo aspect-ratio guide

Real-estate photography is the highest-cost asset in the pipeline — it's
worth shooting once and using for both formats.

- **Listing tour 45s (16:9):** full-bleed hero exterior, kitchen / view
  / pool as cutaways. Eye-level for the exterior; no over-wide
  fish-eye. Twilight or golden-hour for high-end listings.
- **Listing reel 15s (9:16):** crop-tight on a single feature for the
  hero — the front door, the kitchen island, the harbour view. Phone
  tripod at eye-level beats overhead drone for thumb-stop hooks.
- **Agent brand 30s (16:9):** circular headshot (360–420px diameter),
  shot at eye-level with soft sidelight against a contextual background
  (a suburb street, the office reception). Avoid plain studio backdrops
  — they read as stock and undercut the "your local agent" pitch.

Always shoot exterior 16:9 first; capture phone-frame 9:16 from the
same setup. Avoid 1:1 — neither the listing surfaces nor agent-brand
platforms favour it.

### Recommended music

| Template                                  | Music                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `realestate-listing-tour-45s.html`        | **`quiet-premium`** — long sustained pads, ambient piano, no drums. 60–80 BPM. Luxury / architecture. |
| `realestate-listing-reel-15s.html`        | **`kinetic-pop`** — driving 4-on-the-floor, 115–130 BPM, drop on the URL at 12s.                       |
| `realestate-agent-brand-30s.html`         | **`warm-community`** — acoustic guitar, soft strings, light rhythm. 75–95 BPM. Human and grounded.    |

### How to use

Same flow as the other vertical sections above:

1. Copy the file to project root as `index.html`.
2. Update the relative `../../design/` paths to `design/`.
3. Swap `tokens-PLACEHOLDER.css` for your real `tokens-<brokerage>.css`
   (or capture from your brokerage URL with `npx hyperframes capture`).
4. Fill in the slots above; drop the property / headshot photography into
   the placeholder tiles (`background-image: url(...)` or `<img>`).
5. `npx hyperframes preview` then `npx hyperframes render`.

### Verification

Each template was verified with the swap-and-restore lint pattern:

```bash
cp index.html index.html.bak
sed 's|\.\./\.\./design/|design/|g' compositions/verticals/realestate-listing-tour-45s.html \
  | sed 's|tokens-PLACEHOLDER.css|tokens-kindred.css|g' > index.html
npx hyperframes lint
cp index.html.bak index.html && rm index.html.bak
```

All three real-estate templates lint clean (0 errors, 0 warnings) against
the project's real `tokens-kindred.css` standing in for the placeholder.

All three use `tl.fromTo()` (deterministic capture), register on
`window.__timelines["<composition-id>"]`, ship paused, and end with the
standalone autoplay guard.

## Trades & Local Services

For plumbers, electricians, builders, landscapers, painters, mechanics,
roofers, glaziers, pest control, locksmiths — local trades whose viewer
is a phone-in-hand homeowner solving a problem right now.

### What trades videos need

Trades video conversion is unusually one-dimensional: **how fast does the
viewer dial the phone**. The video has seconds, not minutes, because the
viewer is rarely browsing — they are standing in a leaking kitchen
searching "plumber near me". The brief is consistent across the trades:

1. **Phone number on screen, big and held the longest.** This is the
   single biggest conversion lever. It belongs in the longest-held scene,
   not buried in the closer. Format the number naturally so it can be
   held in short-term memory (`0800 555 123`, not `08005551235`).
2. **Service area** — suburb / city / region. "Do they cover where I
   live?" is the first qualifier the viewer applies, before quality.
3. **4–6 specific services.** A line-itemised list proves it's not a
   one-trick op and gives the viewer a chance to recognise their exact
   problem ("emergency plumbing", "drain unblocking", "leak detection").
4. **Trust signals** — licensed, insured, years in business, Google
   rating, jobs completed. Reduces the perceived risk of the call.
5. **Before / after** (where applicable — landscaping, painting,
   plastering, paving, roofing, exterior cleans). Visible craftsmanship
   is the strongest possible signal for portfolio trades.
6. **24/7 / Emergency** (where applicable). Urgency multiplier for
   plumbers, electricians, locksmiths, glaziers, towing.
7. **CTA verb** — "Call now", "Free quote", "Book online". Tell the
   viewer exactly what to do next.

**Anti-patterns to avoid:** generic "we're great" copy with no services
listed; missing or hard-to-read phone number; trust signals only at the
end after the CTA; mock testimonial copy that reads like marketing.

### When to pick which template

| Template                              | Use for                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `trades-service-callout-20s.html`     | Urgency-driven trades. Viewer is in a problem *right now* — emergency plumbing, electrical, locksmith. |
| `trades-before-after-30s.html`        | Portfolio-driven trades where the work is visible — landscapers, painters, plasterers, exterior. Use when you have a real before/after photo set. |
| `trades-trust-builder-45s.html`       | Established family / owner-operator trades selling on relationship — sparkies, master plumbers, builders, painters, mechanics. Use when the path is "save the number, call later." |

### `trades-service-callout-20s.html` — 20-second urgency callout

Portrait 1080×1920, 20s, **kinetic-pop** base. Recommended LUT
`--lut=pop --strength=1.0`. Five scenes:

1. **0–4s** Hook — three problem stamps with `textFx.stamp` impact and
   `effectFx.glitchBurst` per stamp ("Burst pipe?" / "Power out?" /
   "Roof leak?"). `data-scene-grade="noir"` for problem-frame contrast.
2. **4–10s** Service list — 4-5 line items with numbered bullet chips,
   left-stagger entry (`x: -40` per item).
3. **10–14s** Service area + trust chip on accent background, with
   `effectFx.inkBleed` on the area name and a back-out chip pop.
4. **14–18s** Phone number HUGE on dark navy, with `glitterFx.burst`
   (60 particles, 720 distance) and `glitchBurst` on both the CTA label
   and the phone digits. **Longest held single span — deliberate.**
5. **18–20s** URL underline closer — wordmark, URL, animated underline
   sweep.

Feed-friendly portrait — TikTok / Reels / Shorts / Meta paid social.

### `trades-before-after-30s.html` — 30-second portfolio piece

Landscape 1920×1080, 30s, **documentary** base. Recommended LUT
`--lut=teal-orange --strength=0.85`. Five scenes:

1. **0–4s** BEFORE state with photo + tired copy. `data-scene-grade="cool"`
   for desaturation. Photo placeholder is a 600×600 square gradient —
   replace with a real `<img>`.
2. **4–10s** Three process step cards explaining what was done — each
   has a number, a title, and a one-line body. Stagger-up entry.
3. **10–18s** AFTER reveal — bigger photo (660×660), `effectFx.inkBleed`
   on the headline, accent-coloured "After" stamp.
4. **18–26s** Customer quote on dark navy with `data-scene-grade="warm"`,
   long-shadow open quote mark, per-letter stagger, name + suburb attrib.
5. **26–30s** CTA on accent background — "Free quote", phone with
   `glitchBurst`, URL.

Documentary serif gives editorial weight that suits craftsmanship pieces.
Lands well on website hero, YouTube pre-roll, Google Local Service ads.

### `trades-trust-builder-45s.html` — 45-second relationship piece

Landscape 1920×1080, 45s, **warm-community** base. Recommended LUT
`--lut=warm --strength=0.9`. Five scenes:

1. **0–6s** Owner photo (460×460 round) + name + trade tagline +
   years-in-trade chip. `data-scene-grade="warm"`.
2. **6–18s** 6-up services grid (3×2) with cell stagger entry. Each cell
   has a number, a service name, and a one-line detail.
3. **18–28s** Trust signals scene with `glitterFx.ambient` background
   sparkle and four `textFx.counter` stats: years registered, Google
   rating (★), jobs completed (+), suburbs served.
4. **28–38s** Google review pull-quote on the soft paper background —
   5-star header, long-shadow open quote, per-letter stagger on the
   review text, attribution line.
5. **38–45s** CTA on accent background — "Free quote — call us", phone
   with `glitchBurst`, URL. Longest of the three CTAs because the
   conversion path is "save the number" not "call right now".

Warm-community serif + Nunito body keeps the read human. Use when the
business sells on long-term relationship, not emergency response.

### Asset slots

Each trades template has placeholder gradient circles / squares where
photos belong. Replace those with `<img>` tags:

| Template                            | Slot                       | Element                        | Recommended asset                                          |
| ----------------------------------- | -------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `trades-service-callout-20s.html`   | (none — type-only)         | —                              | —                                                          |
| `trades-before-after-30s.html`      | Before photo               | `#s1-photo` (600×600)          | Wide before shot, square crop, colour-graded cool/desat.   |
| `trades-before-after-30s.html`      | After photo                | `#s3-photo` (660×660)          | Same angle as before, square crop, vibrant.                |
| `trades-trust-builder-45s.html`     | Owner photo                | `#s1-photo` (460×460 round)    | Mid-shot, smiling, branded shirt or in-uniform on-job.     |

Trade text slots (search-and-replace before render):

| Template                            | Slot id                  | What it is                                       |
| ----------------------------------- | ------------------------ | ------------------------------------------------ |
| `trades-service-callout-20s.html`   | `#s1-p1` / `-p2` / `-p3` | Three problem-stamp lines.                       |
| `trades-service-callout-20s.html`   | `.s2-list .s2-item`      | 4-5 service line items.                          |
| `trades-service-callout-20s.html`   | `#s3-area`               | Service area name.                               |
| `trades-service-callout-20s.html`   | `#s3-chip`               | Trust chip ("LICENSED · INSURED · 24/7").        |
| `trades-service-callout-20s.html`   | `#s4-phone`              | Phone number — **the headliner**.                |
| `trades-service-callout-20s.html`   | `#s5-mark` / `-url`      | Brand wordmark + URL.                            |
| `trades-before-after-30s.html`      | `#s1-state`              | Before-state caption (one line, italic).         |
| `trades-before-after-30s.html`      | `#s2-steps .s2-step`     | Three process step cards.                        |
| `trades-before-after-30s.html`      | `#s3-state`              | After-state caption.                             |
| `trades-before-after-30s.html`      | `#s4-quote`              | Customer quote (one sentence).                   |
| `trades-before-after-30s.html`      | `#s4-name` / `-suburb`   | Customer name + suburb attribution.              |
| `trades-before-after-30s.html`      | `#s5-phone` / `-url`     | Phone + URL.                                     |
| `trades-trust-builder-45s.html`     | `#s1-name` / `-trade` / `-years` | Owner name, trade tagline, years chip.   |
| `trades-trust-builder-45s.html`     | `#s2-grid .s2-cell`      | Six service cells.                               |
| `trades-trust-builder-45s.html`     | `#s3-stat-1..4`          | Four trust stats (years, rating, jobs, areas).   |
| `trades-trust-builder-45s.html`     | `#s4-quote` / `-attrib`  | Google review pull-quote + attribution.          |
| `trades-trust-builder-45s.html`     | `#s5-phone` / `-url`     | Phone + URL.                                     |

Counter slots (`#s3-stat-1..4` in trust-builder) read their target value
from the element's text content — set the final number in HTML and the
animation will count up to it.

You may also drop badge / certification PNGs (Master Builders, EWRB,
Plumbers Board, Better Business Bureau, NZBN, Approved Tradesman) into
`#s3-row` of the trust-builder template — add inline `<img>` cells before
or alongside the existing counter cells.

For Google review screenshots, prefer the **pull-quote pattern already in
the template** over a literal screenshot — quoted text reads cleaner at
1920×1080 than a JPEG of a Maps card. Cite "Google Review · Suburb" in
small caps to keep the provenance honest.

### Recommended music

| Template                            | Music family       | Why                                                              |
| ----------------------------------- | ------------------ | ---------------------------------------------------------------- |
| `trades-service-callout-20s.html`   | `kinetic-pop`      | Urgent, percussive — matches the problem-stamp pace.             |
| `trades-before-after-30s.html`      | `warm-community`   | Editorial calm under documentary serif; lifts on the AFTER reveal. |
| `trades-trust-builder-45s.html`     | `warm-community`   | Slow, human — supports the "I trust this person" beat.           |

Music modules live in `assets/amp/` — pre-bake amplitude with
`scripts/extract-amp.mjs`, then bind to a scene host with `ampBind(...)`
if you want subtle audio-reactive pulse on the phone number or stats.
Pure mood-bed (no amp-binding) is fine for v1.

### Phone number formatting

Use the format you'd want a viewer to dial — international (`+64 21 555 0123`)
for export brands, local (`0800 555 123` / `(09) 555 1234`) for area-locked
trades. Keep digits grouped naturally so the viewer can hold the pattern in
short-term memory. The `.s4-phone` (callout) and `.s5-phone` (before/after,
trust-builder) classes are styled to fit `0800 555 123` cleanly in a single
line at 1080 wide / 1920 wide respectively. If your number is longer, drop
the larger of any pair, or shrink the font-size 10-15%.

### How to use

Same flow as the other verticals:

1. Copy the file to project root as `index.html`.
2. Update the relative `../../design/` paths to `design/`.
3. Swap `tokens-PLACEHOLDER.css` for your real `tokens-<brand>.css`.
4. Fill in the slots above and drop owner / before / after photography
   into the placeholder gradients (`<img src="...">`).
5. `npx hyperframes preview` then `npx hyperframes render`.

### Verification

Each trades template was verified with the swap-and-restore lint pattern:

```bash
cp index.html /tmp/index.html.bak
sed 's|\.\./\.\./design/|design/|g' compositions/verticals/trades-service-callout-20s.html > index.html
npx hyperframes lint
mv /tmp/index.html.bak index.html
```

All three trades templates lint clean (0 errors, 0 warnings) on
`npx hyperframes lint --verbose`. All three use `tl.fromTo()`
(deterministic capture), register on `window.__timelines["<composition-id>"]`,
ship paused, and end with the standalone autoplay guard.

## Health / Fitness / Wellness

For clinics (dental, physio, chiropractic), gyms / PT, yoga & pilates
studios, beauty / salon / spa, mental-health practitioners, and
coaches. Wellness is a personal, often intimate purchase — the booking
decision is driven by **trust, warmth, and ease of booking**, not by
clever animation. Templates here lean human (faces, qualifications,
testimonials), keep effects calm or absent on the most-trust-sensitive
beats, and end on one frictionless next step.

### What wellness videos need

Every effective wellness video has to hit these beats:

1. **Practitioner credibility.** Name, role, years of practice, visible
   qualifications ("BDS Otago", "registered with X"). Trust starts
   with a face and a credential.
2. **What you actually do.** A concrete list of treatments / services.
   Not outcomes you "promise" — just what's offered.
3. **Trust signals.** Council registration, professional body
   membership, insurance / Southern Cross / Medisave compatibility,
   years in practice. Specific, verifiable, current.
4. **Social proof.** A short patient / client testimonial. Single
   sentence, attributed (first name + verifier — "patient since
   2024", "member since 2023").
5. **Outcome proof (where allowed).** For fitness, before/after pairs
   are powerful — but only with consent and identified. For dental /
   cosmetic, smile-makeover pairs work the same way. For clinical /
   mental-health work, skip this beat.
6. **Ease of booking.** Suburb, hours, and one URL. Add a phone number
   or WhatsApp tile if the audience books that way.
7. **CTA matched to intent.** "Book consultation" / "First class free"
   / "Book a quiet hour" — never "Buy now".

### Health-claim conservatism (non-negotiable)

- Use **"we help with"** / **"we treat"** — NOT "we cure" / "we fix"
  / "100% guaranteed". Outcomes are individual.
- **Don't promise specific results.** "Lose 10kg in 8 weeks" is a
  claim that can land a brand in front of the regulator. "Real change
  in 12 weeks" — backed by consented before/afters — is fine.
- **Registrations must be real and current.** If a video says
  "Registered with the Dental Council of NZ", that has to be true on
  the day it's shipped.
- **Before / after photos require explicit consent** and must be the
  same person. No stock-photo composites.
- **Avoid medical claims** for non-medical providers ("lower blood
  pressure", "reverse diabetes", "cure anxiety").
- HIPAA / Privacy Act parallel: never use real patient names or
  identifiable details in placeholder copy that ships to the brand —
  the testimonial slot is a placeholder until the brand provides a
  real, signed-off quote.

### When to pick which template

| Template                                      | Use for                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `wellness-clinic-trust-45s.html`              | Landscape clinic / practitioner overview. The full credibility build — meet, what we treat, registrations, patient quote, booking.    |
| `wellness-fitness-transformation-30s.html`    | Portrait social ad for a gym / transformation program. Hook → before/afters → what's included → offer → CTA.                          |
| `wellness-spa-mood-20s.html`                  | Portrait atmospheric spa / day-spa / massage / beauty reel. Sells the FEELING of slowing down. Calm — no loud effects.                |

### `wellness-clinic-trust-45s.html` — 45-second clinic trust build

Landscape 1920×1080, 45s, **warm-community** base. Five scenes:

1. **0–7s** Practitioner intro — round headshot + name + role
   (e.g. "PRINCIPAL DENTIST · 12 YEARS") + credentials line
   ("BDS Otago · Registered with the Dental Council of New
   Zealand"). `data-scene-grade="warm"`. `textFx.cascade` on
   the name.
2. **7–18s** Treatments offered — 3-column grid of 6 service tiles,
   each with circular icon + service label. Stagger reveal.
   `data-scene-grade="warm"`.
3. **18–28s** Trust signals — dark navy backdrop, kicker
   ("QUALIFIED · REGISTERED · TRUSTED"), headline, then a row of
   4 verification badges (Dental Council, NZDA, Southern Cross,
   years in practice). Hairline borders, no glitter.
4. **28–38s** Patient testimonial — long-shadow open quote, per-letter
   `textFx.stagger`, attribution line ("— Lisa M · PATIENT SINCE
   2024"). `data-scene-grade="warm"`.
5. **38–45s** Booking — "Book online." headline + suburb / hours meta
   line + URL on warm-accent background.

### `wellness-fitness-transformation-30s.html` — 30-second transformation reel

Portrait 1080×1920, 30s, **kinetic-pop** base. Five scenes:

1. **0–4s** Hook — huge "12" + "WEEKS" + "Real change." Stamp + glitch
   on the duration number. (Numerals are deliberately big — this is
   the thumb-stop.)
2. **4–12s** Before/after pairs — 3 stacked rows, each a side-by-side
   `BEFORE` / `AFTER` block with the same person letter. The `before`
   chip is desaturated (`filter: saturate(0.6)`), the `after` chip
   uses brand accent. Cross-fade reveal on each `after`.
3. **12–20s** What's included — three rows numbered 1/2/3 (Personal
   coach · Custom plan · Community), with a one-line detail. Slide-in
   stagger from the left.
4. **20–26s** Offer — "First class FREE." stamp + glitch + fineprint
   ("No card. No catch. Just turn up.").
5. **26–30s** CTA — "START WEEK 1 →" with `glitterFx.burst` (70
   particles, 760 distance) + URL.

### `wellness-spa-mood-20s.html` — 20-second spa mood reel

Portrait 1080×1920, 20s, **quiet-premium** base. Four scenes.
**Calm by design — no glitter, no glitch, no stamp.**

1. **0–5s** Atmospheric hook — "Slow down." in light Playfair-style
   200px, with a slow `cinemagraphRotate` ambient backdrop (cool
   palette). Sub-tag in tracked Inter ("A QUIETER HOUR — NEAR YOU.").
   `data-scene-grade="soft"`.
2. **5–12s** Treatments — left-aligned 4-row treatment list with name +
   duration ("Aromatherapy massage · 60 MIN"), hairline rules between
   rows. Subtle 0.22s stagger fade-up, no loud effects.
   `data-scene-grade="cool"`.
3. **12–17s** Booking — "Book a quiet hour." + price chip ("FROM $120
   · 60 MIN") + meta line ("PONSONBY · OPEN 7 DAYS"). Hairline rule
   sweep on entry.
4. **17–20s** URL — wordmark + URL on dark navy background.

### Asset slots

#### `wellness-clinic-trust-45s.html`

| Slot id              | What it is                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| `#s1-photo`          | Practitioner headshot. Replace text initials with `background-image: url(...)`. |
| `#s1-name`           | Practitioner name (e.g. "Dr Sam Roberts").                                |
| `#s1-role`           | Role + years of practice.                                                 |
| `#s1-credentials`    | Qualifications + registrations line.                                      |
| `#s2-t1`–`#s2-t6`    | 6 treatment tiles. Each has `.s2-icon` + `.s2-tile-label`.                |
| `#s3-b1`–`#s3-b4`    | 4 trust badges. Each has main label + `.s3-badge-sub` line.               |
| `#s4-quote`          | Patient testimonial (one short sentence).                                 |
| `#s4-attribution`    | "— Name M · ROLE / YEAR".                                                |
| `#s5-cta`            | Booking CTA verb ("Book online.").                                        |
| `#s5-meta`           | Suburb · days · hours line.                                               |
| `#s5-url`            | Booking URL.                                                              |

#### `wellness-fitness-transformation-30s.html`

| Slot id              | What it is                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| `#s1-duration`       | Big numeral — program length ("12").                                      |
| `#s1-duration-label` | Unit label ("WEEKS").                                                     |
| `#s1-tagline`        | Hook line ("Real change.").                                               |
| `#s2-pair1`–`#s2-pair3` | 3 before/after pair containers. Replace `.pair-before` / `.pair-after` letter chips with consented client photos via `background-image: url(...)`. |
| `#s3-r1`–`#s3-r3`    | 3 inclusion rows. Each has `.s3-row-num`, `.s3-row-title`, `.s3-row-detail`. |
| `#s4-offer`          | Big offer line ("First class").                                           |
| `#s4-offer-detail`   | Offer payoff ("FREE.").                                                   |
| `#s4-fineprint`      | Trust line ("No card. No catch. Just turn up.").                          |
| `#s5-cta`            | CTA verb ("START WEEK 1").                                                |
| `#s5-url`            | Brand URL.                                                                |

#### `wellness-spa-mood-20s.html`

| Slot id          | What it is                                                                |
| ---------------- | ------------------------------------------------------------------------- |
| `#s1-hook`       | Atmospheric hook ("Slow down.").                                          |
| `#s1-tag`        | Mood sub-line.                                                            |
| `#s1-cg`         | Cinemagraph background — replace `.fx-cinemagraph-bg` palette vars in inline style for room-tone color. |
| `#s2-i1`–`#s2-i4`| 4 treatment list rows. Each has `.s2-item-name` + `.s2-item-duration`.    |
| `#s3-headline`   | Booking headline ("Book a quiet hour.").                                  |
| `#s3-price-chip` | Outline price chip ("FROM $X · DURATION").                                |
| `#s3-meta`       | Suburb + hours line.                                                      |
| `#s4-mark`       | Brand wordmark.                                                           |
| `#s4-url`        | Booking URL.                                                              |

### Photo style guide

Wellness photography sells **calm professionalism**, not lifestyle hype.
The templates here are scaffolds for trust.

- **Practitioner headshot:** eye-level, soft window light or golden
  side-light, neutral background (clinic interior softly out of focus,
  or a clean wall). Smiling-with-eyes, not full-teeth grin. Replace
  the round letter-chip in Scene 1 of the clinic template.
- **Treatment-room interior:** wide enough to read "this is a real
  room I could walk into". Slightly soft focus, golden tungsten or
  daylight-balanced LED. No dramatic shadows — wellness viewers want
  reassurance, not cinema.
- **Before / after pairs (fitness, dental, beauty):** matched
  framing, matched lighting, matched pose. Same crop, same angle,
  same outfit silhouette where possible. Consent-forward — no faces
  if the person doesn't want them shown. Use the same letter in
  `BEFORE` and `AFTER` placeholders so the same-person mapping is
  honest.
- **Calm hero shot (spa):** macro detail — a hand on a stone, a
  candle flame, a pour of oil, the back of a head facing a window.
  Avoid "model in fluffy robe smiling at camera" — it reads stock.
- **Certification badges (clinic):** prefer official body marks (SVG
  preferred over JPG) sized to ~80–120px high. If you don't have the
  asset, the text-chip badge in the template is honest enough.

### Recommended music

Match the music to the audience's emotional state at the moment of
booking:

| Template                                   | Music vibe       | Why                                                                                                                                  |
| ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `wellness-clinic-trust-45s.html`           | `warm-community` | Calm, professional, reassuring. Soft strings or brushed kit, 75–95 BPM. Avoid driving beats — this is a credibility build, not hype. |
| `wellness-fitness-transformation-30s.html` | `kinetic-pop`    | Driving, motivational, 115–130 BPM. Hits a chorus on the offer (Scene 4) and a climax on the CTA glitter burst (Scene 5).            |
| `wellness-spa-mood-20s.html`               | `quiet-premium`  | Ambient, slow, breathy. Long pads, light percussion, 60–80 BPM. The track is a held breath — leave space.                            |

Avoid tracks with strong lyrical storytelling on the clinic and spa
templates — the on-screen treatments and narration carry the message;
music sits underneath. The fitness template can take a vocal hook on
the offer beat.

### How to use

Same flow as the e-commerce section above:

1. Copy the file to project root as `index.html`.
2. Update the relative `../../design/` paths to `design/`.
3. Swap `tokens-PLACEHOLDER.css` for your real `tokens-<brand>.css`.
4. Fill in the slots above. For the clinic template, replace the round
   `.s1-photo` text initials with `background-image: url(...)`. For the
   fitness template, drop consented client photos into the
   `.pair-before` / `.pair-after` chips.
5. `npx hyperframes preview` then `npx hyperframes render`.

### Verification

Each wellness template was verified via swap-and-restore lint:

```bash
cp index.html index.html.bak
sed 's|\.\./\.\./design/|design/|g' compositions/verticals/wellness-clinic-trust-45s.html > index.html
npx hyperframes lint --json
cp index.html.bak index.html && rm index.html.bak
```

All three wellness templates lint clean (0 errors, 0 warnings, 0 info).
All three use `tl.fromTo()` (deterministic capture), register on
`window.__timelines["<composition-id>"]`, ship paused, and end with the
standalone autoplay guard.

## SaaS / Software product

For DevTools, B2B SaaS, productivity apps, collaboration platforms, and
indie/maker tools. SaaS differs from product-led commerce on two axes —
**clarity beats hype** (a developer skimming a feed can't be fooled), and
**the conversion is "start a trial"**, not "buy now". Templates lean on
clean UI screenshots, real customer logos, an outcome number, and a
friction-free trial signal at the close.

### What SaaS videos need

Every effective SaaS video has to hit these beats:

1. **Tagline + the problem it solves.** One sentence, in the first five
   seconds. "The fastest way to ship" + "for teams who want results, not
   meetings." If the viewer can't paraphrase what you do after 3 seconds,
   the rest of the video is wasted.
2. **3–4 key features with UI shots.** Show the actual product. A clean
   screenshot of the panel that proves the point beats a clever stock
   photo every time. Each feature is one screenshot + one short benefit
   line.
3. **Social proof.** Six customer logos in a row + a "used by N teams /
   N installs / N companies" number. Six is enough to read as
   "established" without lapsing into wall-of-logos overkill.
4. **Pricing or freemium signal.** "Free forever," "From $9/mo," "14-day
   trial," or "No card required." This is the friction remover. Pair it
   with the URL.
5. **Use case framing (optional).** "For X teams who Y" lets the right
   viewer self-select.
6. **Integrations (optional).** Even a single line — "Plays with your
   stack" — answers a real procurement question.
7. **CTA + URL.** "Start free →" / "Try it free →" / "Sign up". Show
   the URL long enough to read (≥1.5s on screen).

### When to pick which template

| Template                          | Use for                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `saas-product-tour-30s.html`      | Landscape product overview — paid social, website hero, demo-loop in booth screens. Tagline → 3 features → logos → pricing → CTA. |
| `saas-feature-launch-20s.html`    | Portrait "we shipped X" reel — release-note hero, in-product banner video, Slack/Linear changelog embed. Stamp → demo → "available" → URL. |
| `saas-case-study-60s.html`        | Landscape narrative case study — sales enablement, conference loop, customer-marketing landing pages. Problem → challenge → outcome → quote → CTA. |

### `saas-product-tour-30s.html` — 30-second product tour

Landscape 1920×1080, 30s, **kinetic-pop** base, `data-scene-grade="noir"`
on the brand chip. Five scenes:

1. **0–5s** Brand wordmark stamp + tagline cascade + one-line problem
   statement. The "what we do + who it's for" beat lands inside the
   first three seconds.
2. **5–15s** Three feature tiles staggered. Each tile is a 16:10 UI
   screenshot placeholder + a feature title with a `textFx.stagger`
   rotation + a one-line benefit. Cells back-out, screenshots fade in
   on `power3.out`, titles stagger.
3. **15–22s** Social proof — animated `12,000+` counter (customise the
   number) over a six-cell customer-logo row. Counter back-outs first,
   logos stagger up afterwards.
4. **22–28s** Pricing chip + "no card / no catch" headline cascade +
   `glitterFx.burst` (56 particles, 660 distance) + glitch on the
   emphasised phrase + supporting "14-day trial" line.
5. **28–30s** "Start free → URL" closer — `glitchBurst` on the verb,
   URL fade-up, then a 0.3s soft fade to 0.92 opacity for the cut.

### `saas-feature-launch-20s.html` — 20-second feature launch (portrait)

Portrait 1080×1920, 20s, **kinetic-pop** base, `data-scene-grade="noir"`
on the open. Four scenes:

1. **0–3s** "NEW" pill + feature-name stamp with double `glitchBurst`.
   Reads in under two seconds — built for thumb-stop.
2. **3–10s** What it does — multiplane reveal (`-200 → 50` Y dolly)
   of a 9:11 UI screenshot tile + headline cascade with glitch on the
   emphasised phrase + one-line support.
3. **10–15s** "Available — TODAY" stamp scene with a 60-particle
   `glitterFx.burst` and double `glitchBurst` on the date, plus a
   "TRY IT NOW" callout fade-up.
4. **15–20s** Brand wordmark stamp + URL fade-up, soft fade-out at the
   end of the cut.

### `saas-case-study-60s.html` — 60-second customer case study

Landscape 1920×1080, 60s, **documentary** base, `data-scene-grade="teal-orange"`
on the open. Six scenes:

1. **0–10s** Customer chip (top-left, persistent) + "Customer X had a
   problem" headline cascade over a `cinemagraphRotate` background.
   Editorial open — slow, deliberate, sets the narrative.
2. **10–25s** The challenge — multiplane reveal + `inkBleed` headline
   + three left-sliding bullets with `0.22s` stagger. The bullets are
   the texture of the pain ("manual exports / spreadsheet sprawl /
   Fridays cleaning data").
3. **25–40s** "Then they switched" — `s3-prelude` italic line ("Within
   the first quarter…") + `textFx.counter` outcome number with unit
   suffix ("12 hrs/wk") + `s3-stat-label` ("SAVED PER ENGINEER") over
   ambient glitter.
4. **40–50s** Customer quote pull-out — long-shadow open quote-mark +
   per-letter quote stagger + `s4-portrait` circular avatar (uses two-
   letter initials by default) + name + role.
5. **50–58s** "Want similar results? Try free." cascade CTA + URL.
6. **58–60s** Brand mark stamp closer with soft fade.

### Asset slots

#### `saas-product-tour-30s.html`

| Slot id              | What it is                                                                       |
| -------------------- | -------------------------------------------------------------------------------- |
| `#s1-mark` / `-mark-em` | Brand wordmark text (the `-em` portion gets `glitchBurst`).                   |
| `#s1-tagline`        | Tagline ("The fastest way to ship.").                                            |
| `#s1-problem`        | One-line who-it's-for / problem-it-solves line.                                  |
| `#s2-shot-1` / `-2` / `-3` | Three UI screenshot tiles (16:10). Replace inner `<span>` with `<img>` or set `background-image` on the tile. |
| `#s2-t1` / `-t2` / `-t3` | Three feature titles ("Sync in seconds" etc.).                               |
| `#s3-counter-num`    | Used-by counter target value (text content; `fx-counter` reads it).              |
| `#s3-counter-label`  | Counter label ("TEAMS SHIPPING WITH US").                                        |
| `#s3-logo-1` … `-6`  | Six customer logo tiles. Replace text with `<img>` (mono, 90px-tall ideal).      |
| `#s4-pricing-chip`   | Pricing chip text ("FREE FOREVER PLAN").                                         |
| `#s4-headline` / `-headline-em` | Pricing headline; `-em` portion gets `glitchBurst`.                   |
| `#s4-sub`            | "14-day trial on every paid tier." support line.                                 |
| `#s5-cta` / `-cta-em` | Final CTA — `-em` ("Start") gets `glitchBurst`.                                 |
| `#s5-url`            | CTA URL.                                                                          |

#### `saas-feature-launch-20s.html`

| Slot id              | What it is                                                                       |
| -------------------- | -------------------------------------------------------------------------------- |
| `#s1-stamp`          | "NEW" pill (or "JUST SHIPPED" / "NOW LIVE").                                     |
| `#s1-feature` / `-feature-em` | Feature name. `-em` portion gets double `glitchBurst`.                  |
| `#s2-shot`           | UI screenshot tile (9:11 portrait or 16:10 cropped). Replace inner `<span>` with `<img>` or set `background-image`. |
| `#s2-headline` / `-headline-em` | What-it-does headline (one short sentence). `-em` gets `glitchBurst`. |
| `#s2-support`        | One-line description of what changes for the user.                                |
| `#s3-availability` / `-availability-em` | "TODAY" stamp; `-em` gets double `glitchBurst`.                |
| `#s3-callout`        | "TRY IT NOW" callout under the stamp.                                            |
| `#s4-mark` / `-mark-em` | Brand wordmark closer; `-em` portion gets `glitchBurst`.                      |
| `#s4-url`            | Final URL.                                                                        |

#### `saas-case-study-60s.html`

| Slot id              | What it is                                                                       |
| -------------------- | -------------------------------------------------------------------------------- |
| `#s1-customer-logo`  | Customer logo chip (replace text with mono SVG/`<img>`, 36px square).            |
| `#s1-customer-name`  | Customer name (mono uppercase).                                                  |
| `#s1-headline`       | Narrative open ("Customer X had a problem.").                                    |
| `#s1-supporting`     | Setup line — what kind of team they are, what they were trying to do.            |
| `#s2-headline`       | The challenge headline (one declarative sentence). Gets `inkBleed`.              |
| `#s2-b1` / `-b2` / `-b3` | Three challenge bullets, staggered.                                          |
| `#s3-prelude`        | Italic prelude ("Within the first quarter…").                                    |
| `#s3-stat-num`       | Outcome number target (text content; `fx-counter` reads it).                     |
| `.s3-stat-suffix`    | Unit suffix ("hrs/wk", "%", "x"). Class — only one per template.                 |
| `#s3-stat-label`     | Outcome label ("SAVED PER ENGINEER").                                            |
| `#s4-quote`          | Customer pull-quote (one specific sentence). Per-letter `textFx.stagger`.        |
| `#s4-portrait`       | Customer avatar — replace text with `<img>` (circular, 88px or larger).          |
| `#s4-name`           | Customer name.                                                                    |
| `#s4-role`           | Customer role / company (mono uppercase).                                        |
| `#s5-cta` / `-cta-em` | Final CTA ("Try it free."); `-em` is the emphasised verb.                       |
| `#s5-url`            | CTA URL.                                                                          |
| `#s6-mark` / `-mark-em` | Brand mark closer; `-em` portion gets the colour accent.                      |

### UI screenshot guidance

Screenshots are the load-bearing visual asset of these templates — pay
the same attention you'd pay to a photographed product shot.

- **Capture a clean state.** Empty inboxes, real-but-anonymised data, no
  "your name here" prompts, no console warnings, no localhost URLs in
  the address bar. Even one frame of "TODO: replace this" is a problem
  at scale.
- **Strip PII.** Replace customer names, real emails, internal Jira IDs
  with safe equivalents.
- **Match light/dark to the surrounding scene.** Dark UI on the dark
  scenes (kinetic-pop scene 1, scene 3), light UI on the cream scenes
  (scene 2 of the product tour). Mismatching modes makes the cut feel
  amateur.
- **Crop tight.** Show the part of the UI that proves the point. Whole-
  app screenshots at 16:10 are mostly chrome; lead with the panel that
  tells the story.
- **2× density.** Render at 2× target pixels (3840×2400 for the 16:10
  tile on landscape, 2160×3840 for the 9:11 tile on portrait) so retina
  playback stays sharp.
- **Don't bake in browser chrome.** The templates already render a thin
  top bar via CSS `::after`; double-chrome reads as careless.

### Customer logo row

The product-tour template has six logo cells. Drop in mono SVGs at the
same height (90px works well in the row). Inconsistent logo weights make
the row feel uneven — it's better to use monochrome white-on-translucent
versions of every logo than to mix full-colour brand logos. Six is the
sweet spot: enough to read as "established", few enough that no one logo
gets visually buried.

### Recommended music

| Template                       | Base            | Music                                                                                  |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------- |
| `saas-product-tour-30s.html`   | `kinetic-pop`   | Modern indie pop / glossy electronic, **110–128 BPM**. Cuts land on rough 2s beats — a 120 BPM track at the half-bar matches. |
| `saas-feature-launch-20s.html` | `kinetic-pop`   | Up-tempo electronic with a clear hit at 10s (the "TODAY" stamp). 115–130 BPM.          |
| `saas-case-study-60s.html`     | `documentary`   | Cinematic ambient, piano + light strings, restrained electronic underscore. **60–90 BPM**. The 10s/15s scene blocks need space. |

If you're running narration, drop the music bed under -18 LUFS and lift
it during the inter-scene gaps — the bed should carry the cuts, not
fight the voice.

### How to use

Same flow as the other vertical sections:

1. Copy the file to project root as `index.html`.
2. Update the relative `../../design/` paths to `design/`.
3. Swap `tokens-PLACEHOLDER.css` for your real `tokens-<brand>.css`.
4. Fill in the slots above and drop UI screenshots / customer logos /
   portrait into `assets/`. Replace placeholder spans with `<img>` or
   set `background-image: url(...)` on the tile.
5. `npx hyperframes preview` then `npx hyperframes render`.
6. Apply the recommended LUT: `node scripts/post-grade.mjs --lut=pop out.mp4`
   (or `--lut=teal-orange` for the case study).

### Verification

Each SaaS template was verified via swap-and-restore lint:

```bash
cp index.html index.html.bak
sed 's|\.\./\.\./design/|design/|g' compositions/verticals/saas-product-tour-30s.html > index.html
npx hyperframes lint
cp index.html.bak index.html && rm index.html.bak
```

All three SaaS templates lint clean (0 errors, 0 warnings). All three
use `tl.fromTo()` (deterministic capture), register on
`window.__timelines["<composition-id>"]`, ship paused, and end with the
standalone autoplay guard.
