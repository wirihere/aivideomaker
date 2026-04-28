# DESIGN.md — Resurgence Gear Heritage Straight Indigo Sport

Brand cheat-sheet for the ad. Source: scrape of [resurgencegear.co.nz](https://www.resurgencegear.co.nz/product/mens-indigo-blue/) on 2026-04-26.

## 1. Brand identity

- **Name:** Resurgence Gear
- **Origin:** Hamilton, New Zealand
- **Category:** Premium motorcycle clothing manufacturer
- **Signature tech:** Pekev® — proprietary patented protective fiber. World-record-holder for CE-certified motorcycle jeans (10.83-second slide time).
- **Customer:** Motorcyclists who want denim-look + denim-feel + crash-grade protection.

## 2. Tone of voice

- **Register:** Confident, technical, performance-focused.
- **Receipts over claims:** every boast has a CE rating, a number, or a world-record citation. Never abstract.
- **Anti-corporate:** plain-spoken Kiwi, not over-polished. "Wash safe with no loss of protection" — that's how they write.
- **Kicker words that earn their keep:** *record-breaking · CE AAA · 10.83 seconds · D3O Ghost · Pekev® · single layer · 80% lined.*
- **Avoid:** "innovative", "revolutionary", "next-generation", "world-class". They have a real world-record number — anchor on that, don't reach for cliché.

## 3. Palette (inferred from product imagery)

The product is **indigo denim** so the brand-imagery palette skews toward:

- **Indigo blue** (the jean) — primary
- **Black / charcoal** — secondary (asphalt, machined parts, armor)
- **Steel grey** — supporting (CE plate, hardware)
- **Safety-orange / red** as accent (high-visibility, performance signal)
- **Cream / off-white** for type-on-dark contrast

Do NOT default to kindred's cream/honey warm-community palette. Resurgence reads cooler, harder, more industrial.

## 4. Typography direction

- **Display:** condensed sans (think hard-tech / motorsport). Bold, slightly compressed. NOT a serif (kindred used serif — wrong here).
- **UI/body:** clean grotesque sans. Wide-set tracking on small caps for safety-claim labels (CE AAA, D3O GHOST, PEKEV®).
- **Numbers must be large.** "10.83s" should be the loudest single typographic moment in the video.

## 5. The product (the one we're selling)

| Field | Value |
|---|---|
| Name | Heritage Straight : Indigo Sport |
| Price | NZD $379.00 – $399.00 (6 weekly Laybuy from $63.16) |
| Lining | 80% Pekev® Lined |
| CE rating | CE Class AAA (EN17092-1:2019) — top of standard |
| Armor | D3O Ghost Hip & Knee, removable, CE Level 1 |
| Stretch | Stretch Denim, regular straight fit |
| Weight | 1300g (32/32) |
| Wash | Wash safe — no loss of protection |
| Reviews | 5.00 / 5 (4 verified) |
| Origin | Pakistan (manufacturing); NZ brand |
| Warranty | 1-year limited |

## 6. Verbatim copy bank — for narration + on-screen

Quote-safe (lifted from the product page, not paraphrased):

- "Our classic protective motorcycle jeans offer a timeless fit and finish paired with stretch comfort, D3O® Ghost armour, and our record-breaking Pekev® liner."
- "CE AAA Protective Motorcycle Jeans"
- "Record-breaking Pekev® liner"
- "Wash Safe With No Loss Of Protection"
- "80% Pekev® Lined" / "CE AAA Rated" / "Mesh Liner to Reduce Friction" / "Removable D3O GHOST Hip & Knee Armour Included"
- World-record: **10.83 seconds CE-certified slide time** (verified claim from the brand's site).

Customer voice (verbatim reviews):

> "Look like regular denim jeans but the protection level is a class apart." — Shannon Parker
> "You can't tell that they are not just jeans even with the Armour installed." — djmblaster

These two reviews are the strongest microcopy assets — both say the same thing (looks like denim, protects like armor) which IS the brand's promise. Use one as a pull-quote.

## 7. Asset audit (what we have / need)

| Asset | Have? | Source / notes |
|---|---|---|
| Hero product photo | Pulled by orchestrator (`assets/resurgence-indigo/hero.png`) | Already on disk after the orchestrator run. Verify it's the indigo jean. |
| Logo / wordmark | Pulled (`assets/resurgence-indigo/logo.png`) | Verify quality. |
| Action shot (rider) | NO — not on the product page | Use stock motorcycle / road / asphalt B-roll? Or static product crop only? |
| CE / D3O / Pekev® badges | NO files — would need to build CSS/SVG | Build as on-screen typographic stamps. Honest signal of certification. |
| Music | Auto-picked via pick-music | Resurgence is "energetic" tone — kinetic-pop / driving electronic. NOT warm-community. |

**Constraint we shipped under:** no rider/action footage. Template must work without B-roll — product-led + typographic-led only. Like an Apple ad for a product they want to shoot in studio.
