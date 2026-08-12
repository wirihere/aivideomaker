# SCRIPT — Bin Sparkle "Comeback" (redemption-arc video + carousel)

> **A new angle.** Every existing binsparkle comp is the bin talking *at* you
> (roast, texts, invoice, reviews, therapy, resignation) or a static gag
> (wanted, tinder, horoscope). None of them play the character-emotion set as
> a **journey**. This one does: rock bottom → rescued → triumphant, with the
> BinSparkle clean as the turning point. Fast-cut, text-driven (no VO — pace
> over reading), fresh Runware music bed, SFX on every cut, hand-built SVG
> animation accents.
>
> **One concept → two outputs:** a ~27s 9:16 video and a 6-slide vertical
> carousel off the same beat sheet. (MANIFEST §7: "one source → many outputs.")

## Brief

- **Audience awareness:** Problem-aware. They know bins get gross; they don't
  think of booking a clean. The arc makes them feel the gross *then* the relief.
- **Framework:** PAS-into-Bridge (Problem → Agitate → Solution), the brand's
  proven customer-ad shape (customer-v3 + the posted customer carousels).
- **Hook archetype:** Empathy / "you know the feeling" (Caples-adjacent). The
  bin is a stand-in for the viewer's shame.
- **Tone coordinate:** fast pace · warm distance · playful stance · casual
  register. Brand voice stays "warm, plain-spoken, friendly-local, never
  corporate" even though the cut is quick.
- **Format A:** ~27s 9:16 video, 6 beats, **text-driven** (on-screen punches,
  no VO) + music bed + SFX. Modelled on `binsparkle-wanted-video.html` (the
  cleanest text-driven comp in the set).
- **Format B:** 6-slide vertical carousel (same beat sheet, swipe-paced).

---

## Source check — every claim grounded (no invention)

| Line | Source |
|---|---|
| "Pressure-washed. Scrubbed. Deodorised." | Verbatim service copy — posted customer carousel 2026-08-03 ("We pressure-wash and deodorise it"; "We scrub every wall and the base"). |
| "one BinSparkle clean" | Brand noun + the single-clean offer on `binsparkle.nz`. |
| "binsparkle.nz" | The site URL (MANIFEST). |
| "rock bottom / smell / postie / something has moved in" | Emotional/observable colour, not product claims — same gag class as the existing approved "thriving ecosystem" posts (2026-08-04 batch). |

No prices, no town names (so it runs anywhere — per SCRIPT-customer v10 +
SCRIPT-fullcare "deliberately not in the script"), no timing claims, no
testimonial lift. The ad is a bad place to find out a fact; nothing here is
stated that could be wrong.

---

## Format A — ~27-second video beat sheet

Six beats. Music bed runs end-to-end (no VO, so no ducking needed — sidesteps
the §4 audio-duck +6dB jump). Each cut lands on a whoosh/impact SFX. Word count
per beat kept low so holds stay ~4s (content-creation Rule 2: ÷3 + 1s).

| # | Time | On-screen text | Hero image | SVG / FX accent | SFX |
|---|---|---|---|---|---|
| **1** | 0–4.5s | **Every bin hits rock bottom.** | `char-05-rockbottom.png` (screaming, stormy) | Lightning flicker + screen shake | impact (slam-in) |
| **2** | 4.5–9s | **The smell. The shame.**<br>**The postie crosses the street.** | `char-04-sad.png` (sad, rainy) | **Stink-wave lines** rising (NEW SVG) | whoosh + tick |
| **3** | 9–13s | **And somewhere inside…**<br>**something has moved in.** | `char-03-worried.png` (worried) | Stink waves continue + wriggling maggot-dot | whoosh + tick |
| **4** | 13–17.5s | **Then one BinSparkle clean.** | `char-06-rescued.png` (hosed, rainbow) | Water-spray arc + sparkle pop | whoosh-up + ding |
| **5** | 17.5–22s | **Pressure-washed. Scrubbed. Deodorised.** | `char2-front-happy.png` (clean, beaming) | **Suds bubbles** drift up (NEW SVG) + scrub sweep | whoosh + tick×3 |
| **6** | 22–27s | **Every bin deserves a comeback.**<br>`binsparkle.nz` pill | `char-07-triumphant.png` (flowers, rainbow) | **Confetti burst** + sparkle shower + rainbow hold | impact + ding + sweep-rise |

**Brand lands twice** (beats 4 and 6) — same convention as SCRIPT-fullcare.
Deliberately **not** in the hook: a brand name in beat 1 reads as an ad.

**Custom SVG animations created for this comp** (hand-built inline, deterministic
via CSS keyframes / GSAP — no `Math.random`):
1. `#stink-waves` — three wavy green lines rising + fading on a loop (beats 2–3).
2. `#suds` — a field of soap-bubble circles drifting upward (beat 5).
3. `#sparkle-burst` — 4-point sparkle shapes popping at the rescue moment (beat 4 + 6).
Plus the library `assets/svg-animations/fx/confetti-burst.svg` on the triumph.

---

## Format B — 6-slide vertical carousel

Same beat sheet, one slide per beat, swipe-paced (so the word count can breathe
a touch more than video). Each slide = full-bleed character image + branded
text overlay (Rule: never bake text into the image) + persistent wordmark +
slide counter. Slide 6 carries the CTA pill.

| Slide | Image | Headline | Sub |
|---|---|---|---|
| 1 | `char-05-rockbottom.png` | Every bin hits rock bottom. | (hook — no sub) |
| 2 | `char-04-sad.png` | The smell. The shame. | The postie crosses the street. |
| 3 | `char-03-worried.png` | Something has moved in. | It's time. |
| 4 | `char-06-rescued.png` | One BinSparkle clean. | Pressure-wash · scrub · deodorise. |
| 5 | `char2-front-happy.png` | Squeaky. Fresh. Yours again. | — |
| 6 | `char-07-triumphant.png` | Every bin deserves a comeback. | `binsparkle.nz` |

---

## Self-check (8-question rubric)

1. **Hook** — "Every bin hits rock bottom." over a screaming storm-bin. Yes —
   dramatic, specific, a bin with a face doing feelings. Scroll-stopper.
2. **Slippery slide** — each beat deepens the shame, then beat 4 resolves it.
   Yes.
3. **Specificity** — bin, rock bottom, smell, shame, postie, street, inside,
   BinSparkle, clean, pressure-washed, scrubbed, deodorised, comeback. Dense.
4. **Brand voice** — warm + plain + a little cheeky ("the postie crosses the
   street", "something has moved in"). A competitor couldn't say this shot for
   shot. The "every bin deserves a comeback" closer is generous, not corporate.
5. **Read-aloud** (even though no VO — the text reads in the head) — short,
   punchy, end-stopped. Yes.
6. **No-invention** — every line sourced (table above). No prices, towns,
   stats, or testimonials.
7. **Conversational** — yes. Contractions plain.
8. **12-year-old comprehension** — yes. No jargon.

**8/8 → build.**

---

## Build notes

- **Mirror `binsparkle-wanted-video.html`** structurally: self-contained comp,
  load cards.css + warm-community template + brand tokens + module bundle +
  gsap. Single `.comp` stage, stacked hero `<img>` per beat opacity-toggled,
  `gsap.set` initial states + one paused `gsap.timeline` registered on
  `window.__timelines`. No `.scene` clip wrappers (the wanted comp doesn't use
  them and renders clean).
- **Fast cuts:** 0.35–0.5s cross-slams between beats, whoosh SFX on each.
- **Audio tracks:** 8 = music bed (data-duration=27, vol 0.22), 20–25 = SFX
  (one unique track per `<audio>`, per the §4 audio-track rule).
- **Frame-fill (Rule 10):** full-bleed character image fills the frame; text
  sits in the safe band; persistent footer anchors the bottom.
- **Voice:** none — text-driven (matches wanted/therapy/stages; sidesteps the
  Edge-TTS SSML trap).
