# Social-Media Video Patterns — Reference + Verifier Rules

Canonical reference for what makes a 9:16 short-form video work as a Reel / TikTok / YouTube Short. Two halves:

1. **Platform-mechanical rules** (sourced, measurable, plug into the verifier).
2. **Community-app patterns** (what kindred-shaped brands actually do that distinguishes them from corporate explainers).

This is the doc the orchestrator + verifier read when assembling and grading social-shape templates. Templates that violate the rules below should fail to ship.

> Last updated: 2026-04-26. Cross-references existing internal playbooks under `docs/playbooks/` (cinematic-vertical-promo, copy-and-script) and copy-research notes — those carry the deeper craft rules; this doc is the **platform-current shape** layer.

---

## Part 1 — Platform-mechanical rules (15 measurable)

Every rule has: target, units, source. Designed to be checked by the verifier.

| # | Rule | Target | Source |
|---|---|---|---|
| **R1** | Hook in ≤3s, no logo card before it | First frame = face / movement / question. Brand wordmark held until ≥3s mark, ≤1s if shown earlier | TikTok Creative Best Practices, Opus.pro YouTube Shorts retention data |
| **R2** | Cut cadence | ≥6 cuts in seconds 0-8; ≥10 total cuts across 30s | Visla / Vidpros pacing data; +34% completion vs slower |
| **R3** | Sticker captions per-word | 1-3 words per card, 5-10 wps on screen, white-on-pill (not bottom subtitle bar) | TikTok Ads Help Center; +32% completion (Kapwing) |
| **R4** | Safe zone | 220px top, 420px bottom, 140px right (organic). 484px bottom for ads | Strike Social, Meta Business Help, House of Marketers |
| **R5** | CTA position | Upper-center (y=720-1080 band), never bottom — platforms overlay their own UI in bottom 25-35% | Meta Business Help, BestEver.ai |
| **R6** | Audio stinger first 0.5s | Percussive transient before t=0.5s; VO mixed -6dB above bed (-18 to -14 LUFS) | TikTok Creative Best Practices; +58% retention |
| **R7** | Format spec | 1080×1920 9:16, ≥30 fps (60 preferred for motion) | NearStream, Triple Whale; +61% on TikTok vs landscape |
| **R8** | Opening text density | ≤30 chars on-screen text in first 3s, single line | Torro / Brandefy 3-second-rule research |
| **R9** | No static holds >2.5s | Pattern interrupt every 2.5s minimum (cut, push-in, text swap, color shift) | Marketing LTB; +58% retention |
| **R10** | Beat structure | 0-3s hook → 3-8s promise → 8-24s proof/demo → 24-30s CTA. Target 70%+ retention past 3s, 60%+ completion | TikTok Ads Help, Opus.pro |
| **R11** | Hero element | Faces or motion fills ≥60% of frame in seconds 0-3 | Plang Phalla, TikTok Creative Center |
| **R12** | Length | 21-34s sweet spot for completion | TikTok Creative Center; YouTube Shorts data |
| **R13** | Caption type size | ≥80px (~4.2% frame height), ≥4.5:1 contrast, pill background or stroke — never thin sans on photo | Kapwing (92% mobile views are sound-off) |
| **R14** | End card hold | Final 2.0-2.5s static; wordmark + single CTA line (handle / link in bio / URL) | Shortimize, Versacreative — replays/follows are top algo signals |
| **R15** | Replay-loop | End frame matches start frame's color/composition for seamless loop | Opus.pro: 10%+ replay rate "significantly boosts distribution" |

### How rules become verifier checks

| Rule | Verifier check (proposed) | Status |
|---|---|---|
| R1 | First-frame DOM scan: no `.brand-mark` / `[data-wordmark]` visible at t<3s | TODO |
| R2 | Count `data-start` boundaries in 0-8s window; flag if <6 | TODO |
| R3 | Count caption-pill DOM elements with stagger; flag if 0 | TODO |
| R4 | All scenes' visible-text bounding box inside 1080×1920 - safe-zone insets | TODO |
| R5 | CTA-class element y-coordinate at end frame; flag if y > 1280 | TODO |
| R8 | First-second visible-text char count; flag if >30 | TODO |
| R9 | motionContinuity: extended — also flag any sample pair > 2.5s with kind=static OR near-static | partial (already in motion-continuity) |
| R12 | Comp duration outside 21-34s | TODO |
| R13 | Min font-size of `.qa-answer` / caption elements; flag if <80px | TODO |

---

## Part 2 — Community-app patterns (kindred-shape brands)

Distinct from B2B-explainer or hero-cinematic. Sourced from Olio (UK), Nextdoor (US), Buy Nothing Project (creator UGC), Karma (UK), Trade Me NZ, Upworthy. See `tasks/<id>.output` for per-brand evidence.

### The 7 patterns

1. **Open mid-action, never on a logo.** First 1.5s = a hand / a face / a haul. Brand reveal arrives at second 8-15 or only at end. *(Olio haul UGC, Nextdoor selfie reels, Buy Nothing skits, Upworthy lemons.)*

2. **Real human or real stuff fills the frame; the app comes second.** UI screen-recording shows up only at functional moments ("here's how I posted it"). Rest of the time hero = a face, a cardboard box of food, a porch. *(every example.)*

3. **Captions are sticker pills, not subtitle bars.** White-on-pill or branded-background, animated per-phrase, upper-third or center positioned. Not the auto bottom strip news brands use. *(Nextdoor, Olio, Karma, Upworthy.)*

4. **First-person voice, hyper-local specifics.** "I picked up…", "My neighbor just…", "POV: you're scrolling [local group]". Names of streets, suburbs, supermarkets — not "Save money on groceries." *(Olio, Nextdoor, Buy Nothing.)*

5. **Cut cadence under 3 seconds, often 1.5-2s.** Even slow emotional pieces use long holds inside short overall runtimes. Feed-native content rarely lets a shot breathe past 2.5s. *(matches R2 / R9.)*

6. **Audio is voiceover OR trending sound — almost never corporate music bed alone.** Hero brand films can use pure music (Olio kids singing); feed-native content is voice-first. Silent music-bed-only ads read as "ad" and underperform. *(Olio @app, Nextdoor, Buy Nothing UGC.)*

7. **Hero emotion is wholesome-specific, not aspirational.** "I can't believe she gave me this." "Look what was about to be thrown out." Small, concrete, earnest. Corporate failure mode = abstract aspiration ("Building stronger communities together"). *(every example.)*

### NZ-specific bonus pattern

**Direct-to-camera in front of a recognizable local landmark, Kiwi accent, audience-as-mate register.** Observed in @trademe_nz. Worth importing so kindred reads native NZ rather than imported-American.

---

## Part 3 — Cross-reference with internal playbooks

### Existing 5-beat structure (from `docs/playbooks/copy-and-script.md`)

| Beat | Time | Slot | Maps to rules |
|---|---|---|---|
| 1. Hook | 0-3.5s | Problem / question / scroll-stopper | R1, R8, R10, R11 + Pattern 1, 4, 7 |
| 2. Brand introduce | 3-8s | First wordmark + tagline | R10 |
| 3. What it does | 7-17s | Three actions / benefits / steps | R2 (3+ cuts inside this beat), R9 + Pattern 2 |
| 4. Proof | 16-24s | Real-world visual + tone-bite | Pattern 2, 7 |
| 5. CTA | 24-29s | Wordmark + URL + verb | R5, R14, R15 |

### Hybrid composition rule (from `docs/playbooks/copy-and-script.md`)

> Every scene has at least one real-world visual grounded in stock AND at least one HTML overlay carrying information or brand cue.

This is the same rule as Pattern 2. Re-affirmed.

### Shot count budget (from `docs/playbooks/cinematic-vertical-promo.md`)

> 14-17 shots for 27s. Under 12 = slideshow. 2-3 shots per narrated beat is the sweet spot.

This is R2 + Pattern 5 expressed as a count. ≥10 cuts in 30s ≈ 14-17 shots.

---

## Part 4 — Anti-patterns (what NOT to ship)

The failure modes that produce slideshows-with-motion instead of social videos. Each one fails one or more rules.

| Anti-pattern | Fails | Why |
|---|---|---|
| Open on animated brand wordmark | R1, Pattern 1 | Logo openers get scrolled past in 0.8s — A-pile/B-pile rule |
| 5 long scenes for 30s | R2, R9, Pattern 5 | Reads as PowerPoint slides not video |
| Numbered Q&A list ("01 / 02 / 03") | Pattern 7 | Blog-list shape, not feed-native |
| Body text 28-40px on busy bg | R13 | Captions need ≥80px + pill, not subtitle-bar fonts |
| CTA tagline at bottom of frame | R5 | Platform overlays cover bottom 25-35% |
| Pure-HTML composition (no real human / stuff) | R11, Pattern 2 | Reads as motion graphics not video |
| Music-bed only, no voice | Pattern 6 | Silent ads underperform on community-app feeds |
| Generic copy ("save money", "build community") | Pattern 4, 7 | No specific moment / place / person to lock onto |
| Slow entrance animations >0.5s | R9 | Tweens >0.5s are static frames in disguise |
| Decorative tiny screenshot in corner | R11, Pattern 2 | UI as decoration is the explainer-doc shape, not Reel |

---

## Part 5 — Audit: current faq-quick template against this doc

Audited against the 15 rules + 7 patterns. Pre-existing `compositions/templates/faq-quick-30s.html` as of commit `080b061`.

| Rule | faq-quick state | Pass / Fail |
|---|---|---|
| R1 (hook < 3s, no logo first) | Scene 1 (0-4s) opens on KINDRED wordmark + tagline | ✗ Fail |
| R2 (≥10 cuts in 30s) | 5 scenes = 5 cuts | ✗ Fail |
| R3 (sticker captions per word) | No per-word captions; cascade animation but no pills | ✗ Fail |
| R4 (safe zone) | Tagline in s5 sits in y=1280-1640 band — partly bottom safe-zone | ⚠ Marginal |
| R5 (CTA upper-center) | s5 CTA centered vertically, fine on y but inside bottom-overlay band | ⚠ Marginal |
| R6 (audio stinger first 0.5s) | Music bed faded in, no stinger | ✗ Fail |
| R7 (1080×1920 9:16) | ✓ | ✓ Pass |
| R8 (≤30 chars in first 3s) | s1 has "WHO WE ARE" + "Asked often." + "ANSWERED PLAINLY" + "Share with neighbours. Find local help." ≈ 70+ chars | ✗ Fail |
| R9 (no static holds >2.5s) | 17 near-static moments flagged, but mostly inside 0.5s sample windows. Real holds: scene 1 has ~2s of held wordmark mid-scene | ⚠ Marginal |
| R10 (0-3s hook etc) | No hook beat at all — beat 1 is brand intro | ✗ Fail |
| R11 (faces/motion ≥60% frame in 0-3s) | s1 0-3s shows hero-image (kindred app screenshot) at 720×600 = ~22% of frame area | ✗ Fail |
| R12 (21-34s length) | 31s assembled | ✓ Pass |
| R13 (caption ≥80px + pill) | `.qa-answer` is now 52px, no pill | ✗ Fail |
| R14 (end card ≥2s static) | s5 is 28-30s = 2s, with motion through. CTA elements still tweening at 30s | ⚠ Marginal |
| R15 (loop end-to-start) | s5 dark navy CTA card, s1 cream paper bg → not loopable | ✗ Fail |

**Patterns:**

| Pattern | faq-quick state | Pass / Fail |
|---|---|---|
| 1. Open mid-action, never on logo | Opens on logo | ✗ Fail |
| 2. Real stuff > app | App screenshot is decorative; no humans, no real-world | ✗ Fail |
| 3. Sticker pills not subtitle bars | No captions at all | ✗ Fail |
| 4. First-person + hyper-local | Generic narration ("informal the too between…") | ✗ Fail |
| 5. Cuts <3s, often 1.5-2s | 4-8s per scene | ✗ Fail |
| 6. VO or trending sound, not music-only | TTS VO present + music bed | ✓ Pass (but VO sounds robotic) |
| 7. Wholesome-specific not aspirational | "Just local. No money. No ads. No algorithm." is specific | ✓ Pass |

**Score: 2 pass, 5 marginal, 15 fail (out of 22 checks).** This is not a tweak gap — it's a wrong-template gap.

---

## Part 6 — What to do about it

Two options for kindred-nz, ranked by leverage:

**A) Build a new template `community-pov-30s` (recommended).** Shape per Part 2 patterns:

- s1 (0-3s) HOOK: a single Kiwi street, hands lifting bread from a doorstep, big sticker pill upper-third: *"Someone just gave me this 🍞"*. No brand.
- s2 (3-8s) BRAND TIE: phone in hand showing the Kindred listing that produced the bread. Sticker pill: *"From the Kindred app"*. First wordmark appearance.
- s3 (8-17s) WHAT IT DOES: 3-shot quick-cut montage — *give / ask / find* — each shot is a real moment (someone leaving a bag on a porch, someone messaging "anyone got a baby gate?", someone scrolling listings on the bus). Per-word captions.
- s4 (17-24s) PROOF: Trade Me NZ-style direct-to-camera in front of an NZ landmark / suburban street. *"Just local. No money. No ads. No algorithm."*
- s5 (24-30s) CTA: kindred wordmark + `kindred-nz.org` upper-center, sticker pill *"Free for every street in NZ."*, held static 2s.

Reuses faq-quick's brand-tokens-flow and CTA-concat fix. Different scene shapes.

**B) Reshape faq-quick into the 5-beat (less recommended).** faq-quick's "3 questions answered" structure is genuinely good for B2B SaaS / wellness clinic / explainer use cases. Keep it as-is for those briefs. For kindred / community / consumer brands, use a different template.

### Verifier upgrades to gate either path

Add the 9 TODO checks from Part 1's table to `scripts/verify-render.mjs`. Most can be DOM-based using the same per-second sample data. Estimated 2-3 hours.

---

## Part 7 — Glossary / abbreviations

- **Sticker pill** — text on a high-contrast rounded-rectangle background; positioned anywhere except bottom-subtitle-bar location. Standard on TikTok / Reels native posts.
- **Bottom subtitle bar** — full-width black/white auto-captions glued to bottom edge. Reads as news/explainer brand, not feed-native.
- **Beat** — a narrative unit (hook, brand, etc). Maps to one or more *shots*.
- **Shot** — a single uninterrupted camera-state. Within one beat there can be multiple shots (e.g. the "what it does" beat has 3 shots).
- **POV** — point-of-view; phone/camera is "you," subject acts on camera.

---

## References

**Platform docs:**
- TikTok Creative Best Practices: https://ads.tiktok.com/help/article/creative-best-practices?lang=en
- TikTok Creative Center (Inspiration): https://ads.tiktok.com/business/creativecenter/
- Meta Business Help (Reels safe zones): https://www.facebook.com/business/help/980593475366490
- YouTube Shorts retention guide (Opus.pro): https://www.opus.pro/blog/ideal-youtube-shorts-length-format-retention

**Community-app refs (per Part 2):**
- Olio @olio.app TikTok: https://www.tiktok.com/@olio.app
- Nextdoor TikTok: https://www.tiktok.com/@nextdoor
- Trade Me NZ TikTok: https://www.tiktok.com/@trademe_nz
- Buy Nothing Project skits (creator @kanececi): https://www.tiktok.com/@kanececi/video/7184856246615346474
- Olio "Wonderful World" hero film (Hell Yeah! 2021): https://www.thedrum.com/news/2021/11/02/ad-the-day-hard-hitting-olio-ad-highlights-grim-reality-household-waste

**Internal playbooks:**
- `docs/playbooks/cinematic-vertical-promo.md` — production playbook (cuts/shots/grade)
- `docs/playbooks/copy-and-script.md` — 5-beat structure + tone-bite library
- `docs/copy-research/short-form-microcopy.md` — word-level craft
- `docs/copy-research/video-screen.md` — pacing-per-second budget
- `docs/copy-research/direct-response.md` — AIDA / scroll-stopping hooks
