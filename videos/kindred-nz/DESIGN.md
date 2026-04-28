# DESIGN — Kindred Promo (extracted brand)

Source: https://kindred-nz.org/ (captured 2026-04-25). All values pulled directly from the site's CSS custom properties — nothing invented.

## Style Prompt

Warm, cream-and-teal Aotearoa community aesthetic. Friendly serif headlines (Fraunces) over rounded sans body (Nunito). Hand-knit feel — generous spacing, soft cards, no aggressive geometry. Anti-corporate: the design should read as a neighbourhood noticeboard, not a tech product. Light canvas dominates; teal arrives as accent and as the "moment of arrival" colour for the Kindred brand block.

## Colors

| Role | Hex | Source |
|---|---|---|
| Primary brand (teal) | `#1A9E8F` | `--teal` |
| Teal deep | `#14806F` | `--teal-deep` |
| Teal soft (tint) | `#BFE3DC` | `--teal-soft` |
| Teal tint (washes) | `#E8F4F1` | `--teal-tint` |
| Cream (canvas) | `#FBF9F6` | `--cream` |
| Cream warm | `#F5EFE6` | `--cream-warm` |
| Ink (primary text) | `#1B2A3D` | `--ink` |
| Ink-60 (secondary) | `#5A6677` | `--ink-60` |
| Sun (warm accent) | `#F4C96B` | `--sun` |
| Coral (warm accent) | `#E98B6A` | `--coral` |
| Orange | `#E67E3C` | `--orange` |

Surface defaults: cream canvas + ink text. Teal as primary accent for kickers/marks; ink (`#1B2A3D`) for primary buttons (their actual CTA convention).

## Typography

- **Display:** Fraunces (variable serif, opsz 9-144, wght 400/500/600/700) — Google Fonts
- **Body:** Nunito (rounded sans, wght 400-800) — Google Fonts
- **Mono:** JetBrains Mono (wght 400/500) — Google Fonts

Imported via `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap`.

## Verbatim copy (use these — invent nothing)

- Hero: *"Share with neighbours. Find local help."*
- Subhead: *"One free app for your street — a place to give, ask, and find local help close to home."*
- Tagline: *"The community app powered by kindness."*
- Three actions (verbatim from app): **Give something** / **Ask for something** / **Local support**
- Tone bites: *"No money, no ads, no algorithm. Just local."* · *"Someone a few doors down probably has it."* · *"have a yarn while you hand it across."* · *"You're not alone."*
- CTAs: *"Try Kindred free"* · *"See how it works →"*

## Assets

- Logo: `assets/logo/kindred-icon.png` (1024×1024, white peak/gable on teal)
- App screenshot: `assets/photos/kindred-app.png` (390×844, Activity feed)

## Motion mood

Calm, considered, warm. Eases that exhale (`power3.out`, `expo.out`, occasional `back.out(1.4)` for the wordmark). No aggressive snap. Holds long enough to read. Cream-to-teal transitions feel like "arrival home" — the brand block lands as the warm reveal.

## What NOT to Do

1. No dark/navy backgrounds for primary content — Kindred is a light brand. Teal arrives only at the moments of brand-introduction and CTA, not as a background for body copy.
2. No invented stats, testimonials, or download numbers. All copy must trace back to verbatim site content.
3. No corporate-app polish (heavy gradients, glass-morphism, neon glows) — community-noticeboard energy.
4. No emoji-heavy copy in the narration; the app uses emojis but the video voice should be warm-conversational, not playful-clutter.
5. No Māori words in TTS narration (Edge TTS mispronounces them — use English equivalents like "Aotearoa" only if the voice handles it; safer to say "New Zealand").
