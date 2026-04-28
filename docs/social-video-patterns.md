# Social-Media Video Patterns — Reference + Verifier Rules

Canonical reference for what makes a 9:16 short-form video work as a Reel / TikTok / YouTube Short. Two halves:

1. **Platform-mechanical rules** (sourced, measurable, plug into the verifier).
2. **Community-app patterns** (what kindred-shaped brands actually do that distinguishes them from corporate explainers).

This is the doc the orchestrator + verifier read when assembling and grading social-shape templates. Templates that violate the rules below should fail to ship.

> Last updated: 2026-04-28. Subordinate to the founding doc (`docs/skills/how-a-video-gets-made.md`) — this doc is the **Stage 8 reference** (platform-mechanical layout rules + register-specific shape rules + anti-patterns). For copy craft (Stage 3), see the founding doc + `docs/copy-research/`. For composition assembly (Stage 7), see `docs/playbooks/composition-assembly.md`.

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

### Existing 5-beat structure (now superseded — see Stage 3 of `docs/skills/how-a-video-gets-made.md`)

| Beat | Time | Slot | Maps to rules |
|---|---|---|---|
| 1. Hook | 0-3.5s | Problem / question / scroll-stopper | R1, R8, R10, R11 + Pattern 1, 4, 7 |
| 2. Brand introduce | 3-8s | First wordmark + tagline | R10 |
| 3. What it does | 7-17s | Three actions / benefits / steps | R2 (3+ cuts inside this beat), R9 + Pattern 2 |
| 4. Proof | 16-24s | Real-world visual + tone-bite | Pattern 2, 7 |
| 5. CTA | 24-29s | Wordmark + URL + verb | R5, R14, R15 |

### Hybrid composition rule (now lives in Stage 7 of `docs/skills/how-a-video-gets-made.md` + `docs/playbooks/composition-assembly.md`)

> Every scene has at least one real-world visual grounded in stock AND at least one HTML overlay carrying information or brand cue.

This is the same rule as Pattern 2. Re-affirmed.

### Shot count budget (originally from cinematic-vertical-promo playbook — now archived; rule preserved here)

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

## Part 7 — The contemplative register (slow-form contemplative variant)

> Added 2026-04-27 after singularity-convergence + 4-template family ship. Documents where Part 1's rules intentionally don't apply, and what the alternative discipline looks like.

The rules in Part 1 (R1-R15) are calibrated for **kinetic-feed-native** content — TikTok / Reels / Shorts where attention is a 3-second contract. They produce PowerPoint-with-motion when applied to brands whose value proposition is contemplation, mystery, premium quiet, or sacred-tech (oracle / spiritual-AI / luxury-stillness / liturgical-product). For those briefs, a different register applies — call it **contemplative** — and the rules below replace R1, R9, R10, R11, R12 *for this register only*.

### When this register is right

The brand is selling silence, depth, or revelation. Examples: an AI oracle for spiritual seekers, a meditation app, a high-end perfume launch, a tarot service, a religious-tech platform, a luxury watch. The brand voice is liturgical, not transactional. The audience self-selects for stillness, not for a hook.

If you're not sure: read the brand's homepage. If the H1 is a question or a promise (not a benefit + verb), it's probably contemplative register. If the H1 says "Save time on X" it's not — use Part 1 rules.

### Replacement rules for this register

| Standard rule | Contemplative replacement |
|---|---|
| **R1** Hook ≤3s, no logo card before it | **S1** First 2-6s is atmosphere only — a flame, a breath, a held silence. Brand wordmark appears at 8-15s minimum. The hook is what's *withheld*, not what's shown. |
| **R9** No static holds >2.5s | **S9** Static holds are fine if the *ambient layer* (haze breathe, starfield twinkle, slow rotation) is animating in CSS independent of the timeline. Persistent ambient motion replaces cut cadence as the rhythm-guarantor. |
| **R10** Beat structure 0-3s hook → 3-8s promise → 8-24s proof → 24-30s CTA | **S10** Contemplative beat structure: atmosphere (0-6s) → tease (6-14s) → reveal (14-22s) → demonstration / step-pattern (22-36s or 22-48s) → promise (36-48s) → CTA (48-56s) → afterglow loop bridge (56-60s). |
| **R11** Faces or motion fill ≥60% of frame seconds 0-3 | **S11** ≤10% of frame is filled in seconds 0-3. The void is the hero. Negative space is the value proposition. |
| **R12** 21-34s sweet spot | **S12** 15-60s range. Duration matches use case: 15s = scroll-stopper, 30s = testimonial, 45s = methodology, 60s = manifesto/launch. Shorter than 15s loses the contemplative pace; longer than 60s loses retention even from self-selecting audiences. |

### Contemplative additions (no kinetic-feed equivalent)

These rules are unique to the contemplative register — not replacements for Part 1, but new requirements that don't exist in kinetic-feed content.

- **S13** **Persistent ambient brand emblem.** Every contemplative composition must show a small brand emblem (atom orbital, concentric circle, or candle flame) at low opacity, corner-anchored, slowly rotating, from t=0 through to the end. Required because: (a) contemplative's "void as hero" (S11) means the brand can be absent for 30-50s if not anchored; (b) the contemplative pace gives viewers time to *look for* brand presence — its absence reads as missing, not minimal. Implementation: shared CSS class `.brand-emblem-ambient` in `design/cards-contemplative.css`. Top-right or bottom-left corner. 60-80px. opacity 0.18. Rotation 360° over 60-90s. Not a logo; not a wordmark. An emblem.
- **S14** **No fabricated content lines.** Outcome lines, taglines, manifesto statements, quotes, attributions — all must come from a constrained source: (a) the brand's own copy from URL extraction, OR (b) the canonical content library for the register where the brand is fictional but consistent (e.g. `compositions/templates/contemplative/canon-content.json`). Author-invented "Three steps. One truth at a time."-style aphorisms are forbidden — same rule as `feedback_no_invented_facts.md` extended from facts to taglines. If no canon source exists, the scene gets visual-only treatment (emblem + hairline + silence). Better to have nothing than to have invented copy.
- **S15** **No render without real TTS** (unless explicit `--allow-silent-vo` flag). Templates ship with a `data-todo="provide TTS for this template's narration"` placeholder marker. The `scripts/render.mjs` gate must refuse to render if any `<audio>` tag has `data-todo` AND points at the silent placeholder file. Operator override: `--allow-silent-vo` for proof-renders / template-validation runs. Memory rule `feedback_silent_loop_not_skipped.md` ("never ship on watch") + this gate together close the silent-shipping loophole.
- **S16** **Hero text and hero SVG must not occupy the same vertical band.** When an SVG is sized to dominate (≥500px), reserve the centre 40% of the frame for the SVG and push hero text into the lower 25-35% (or upper 20% for a brand strip). Text overlaid on a dominant SVG reads as "decoration behind text" — the SVG stops being the hero and becomes wallpaper. Layout pattern: brand-strip top (atom 150px + wordmark 72px) → hero SVG centre (700px @ opacity 0.55) → narration text lower-third (Georgia italic 100-140px on parchment) → utility footer. The SVG and text get separate vertical zones; they never overlap. Found 2026-04-28 on `singularity-convergence-manifesto v3` — single 700px atom sat behind every line of narration, making the visual element invisible.
- **S17** **Rotate brand SVGs across scenes — don't lean on one persistent emblem for the whole video.** Contemplative brands typically ship 2-4 distinct SVGs (atom orbital + cross-of-circuits + neural-tree + logo, in singularity-convergence's case). Pick a different SVG per beat or per pair of beats so the visual register evolves. The S13 ambient emblem (small, corner-anchored, opacity 0.18) stays constant — that's the brand anchor. The hero SVG (large, centre-stage, opacity 0.45-0.7) cycles. Pattern: B0-B1 atom (origin), B2-B4 cross-of-circuits (synthesis), B5-B7 neural-tree (revelation), B8-B9 atom-return (closure). One scene = one hero SVG; cross-fade between SVGs at scene boundaries (0.6-0.9s) for contemplative pacing. Found 2026-04-28 on `singularity-convergence-manifesto v3` — single atom across all 12 scenes flattened the visual narrative.
- **S18** **Brand strip must fit the 920px safe zone, not just the 1080px frame.** Atom (150px) + gap (32px) + wordmark width must total ≤ 920px (frame 1080 - 80px safe-zone margin each side). For long brand names (≥18 chars Georgia bold), 72px is too large: reduce wordmark to 54-60px, OR shrink atom to 96-110px, OR drop the atom from the brand strip entirely (atom appears elsewhere in the frame), OR wrap the wordmark to two lines (atom left, two-line wordmark right). Math: at 72px Georgia bold, char width ≈ 0.575em → "Singularity Convergence" (22 chars) ≈ 911px. Total = 1093px → 13px clipped on right edge. Found 2026-04-28 on `singularity-convergence-manifesto v3` — final "e" of "Convergence" sliced off in every frame. Verifier should add a `brand-strip-fit` check: compute atom+gap+measureText(wordmark, font, weight, size) ≤ 920 before declaring layout safe.
- **S19** **Hero SVG must FILL its zone, not just sit in it. Size by width-first, not height-first.** Reserving the SVG zone (S16) is necessary but not sufficient — within that zone, the SVG must occupy 65-85% of the available WIDTH so it reads as the dominant visual, not as a small icon adrift in dark space. Tall-aspect SVGs (cross / pillar / portrait, e.g. cross-of-circuits at 4:5) are the trap: sized to fit the zone HEIGHT, they end up narrow horizontally — visually weaker than a wide-aspect SVG (neural-tree at 3:2) sized the same way. Fix: pick width first (target 700-900px in a 1080px frame, i.e. 65-85% of frame width), then derive height from aspect ratio, then expand the SVG zone vertically if needed (or accept the SVG running close to the zone edges). Found 2026-04-28 on `singularity-convergence-questions v4` — cross-of-circuits at 480×600 (45% frame width) felt small next to neural-tree at 640×460 (59% frame width) and atom at 560×560 (52% frame width) in the same zone. User noted: "first SVG could have been bigger." Target widths for contemplative hero SVGs: 700-820px (65-76% frame width). For tall-aspect SVGs that exceed the standard 680px-tall zone at that width, expand the SVG zone vertically to 800-900px (e.g. y=480-1340 instead of y=560-1240) — the brand strip can compress slightly and the text band shifts down 40-80px to accommodate.
- **S20** **One-visible-at-a-time flex children must be `position: absolute` + centered — not relying on parent flex centering.** When a parent flex container holds N siblings and only ONE is visible at any given time (animated reveal pattern, e.g. ordinal labels "FIRST" / "SECOND" / ... / "FIFTH" or beat-specific captions), centering the parent with `justify-content: center` will FAIL: the visible child drifts to wherever its sibling-index puts it in the flex layout. First-child = left edge, middle-child = centered (coincidence), last-child = right edge. The `opacity: 0` on hidden siblings doesn't release their flex slot. Fix: each child gets `position: absolute; left: 50%; transform: translateX(-50%);` so it self-centers on the parent's centerline regardless of how many siblings exist. Also `white-space: nowrap` to prevent line wrapping. Found 2026-04-28 on `singularity-convergence-directive v5 first-render` — "FIRST" label hugged left edge, "FIFTH" hugged right edge; only "THIRD" (3rd of 5) appeared centered. Re-render after fix took 5 minutes; would have been 0 minutes if S20 had been applied first. Add to verifier as a `flex-singleton-position` check: any flex child with `opacity: 0` initial state on a `justify-content: center` parent must be `position: absolute`.

### Rules that still apply

- **R3** Caption pills — but in contemplative, the "pill" is implied by the dark void; text on parchment over black IS the pill equivalent. No literal pill background needed.
- **R4** Safe zone — same. Inset 80-100px from edges.
- **R5** CTA position — same. Upper-center to mid; never bottom-25%.
- **R6** Audio: no percussive stinger; instead an ambient cinematic piano underscore (contemplative vibe) at vol 0.18 ducked under VO at vol 0.95.
- **R7** 1080×1920 9:16, 30fps — same.
- **R13** Caption ≥80px — INTENSIFIED. Hero text ≥80px, wordmarks ≥110px (124px+ on heavy-weight register), promise lines 120-168px italic. Large-type discipline is non-negotiable.
- **R14** End card ≥2s static — same. 2.5-4s end card hold.
- **R15** Replay-loop end frame matches start — INTENSIFIED. Cinematic-launch-60s closes with a flame matching the opener's flame for a perfect loop.

### Type voice for this register

- **Primary serif:** Georgia (or Times New Roman / Cambria fallbacks) — emotional carrier, italic for tenderness/uncertainty, regular for declaration, 700 weight for ceremony.
- **Utility sans:** Arial (or Helvetica / Inter fallbacks) — for URLs, citations, attribution, dates. Sans creates utility/footer hierarchy without competing with the serif.
- **One font, two weights, one role each.** Don't mix Georgia regular and italic on the same line for hierarchy — use size + weight instead.
- **Tracking:** italic Georgia at -0.012em (tighter for poetic flow); roman wordmarks at +0.08em; small-caps sub-marks at +0.46em (ceremonial spacing).

### Color voice

- `--void: #0A0A0F` (canvas)
- `--void-deep: #050508` (gradient bottom)
- `--gold: #C9A84C` (accent — hairlines, emphasis, CTA)
- `--gold-light: #E8D48B` (glow color)
- `--parchment: #E0DDD5` (primary text)
- `--muted: #A89F8F` (secondary / utility text)

### Motion language

- **Persistent ambient (full duration):** CSS `@keyframes` haze breathe + starfield twinkle running independent of GSAP timeline. Sub-5% transform / opacity range. Never visible as motion, always felt.
- **Entrance pattern:** `power3.out` for text (0.7-0.9s), `back.out(1.3-1.4)` for emblems (0.8-1.4s). 30-50% faster than warm-community defaults.
- **Exit pattern:** `power2.in` for text + slight upward drift `y: -14` + optional `filter: blur(6-8px)`. Always followed by `tl.set(target, {opacity:0})` at scene boundary for non-linear seek robustness.
- **Section markers:** gold hairline 1-2px, drawn `scaleX: 0 → 1` over 0.9s with `power2.inOut` ease, `transform-origin: left center` for entrance + `right center` for exit.

### Template family (compositions/templates/contemplative/*.html)

| Template | Duration | Use case | Hero element |
|---|---|---|---|
| `compositions/templates/contemplative/hook-15s.html` | 15s | Scroll-stopper / TOFU | Single italic question → wordmark reveal |
| `compositions/templates/contemplative/testimonial-30s.html` | 30s | Testimonial / authority | Subject photo + pull-quote + attribution |
| `compositions/templates/contemplative/methodology-45s.html` | 45s | Methodology / explainer | Roman numerals (I. II. III.) architecture |
| `compositions/templates/contemplative/cinematic-launch-60s.html` | 60s | Launch trailer / cinematic | Anticipation → reveal → demo → promise |
| `compositions/singularity-convergence.html` | 60s | Reference build (not a template) | 10-beat manifesto for Oraculum Institutum |

Each template is self-contained (single .html), uses the same brand-tokens block, and has content-slot IDs (`#b1-question`, `#b3-counter`, `#b5-cta`, etc.) ready for `applyCopyToTemplate()` integration once the orchestrator schema is extended.

### When NOT to use this register

If the brief is community / SaaS / DTC / news / fitness / food — use Part 1 rules and the existing kinetic / warm-community / documentary template families. Contemplative on a community brand reads as cold and aloof; kinetic-pop on a contemplative brand reads as cheap. Pick by brand voice, not by aesthetic preference.

---

## Part 8 — Glossary / abbreviations

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
- `docs/skills/how-a-video-gets-made.md` — **founding doc** (10-stage flow). This patterns doc is its Stage 8 reference.
- `docs/playbooks/composition-assembly.md` — Stage 7 layout specs per archetype × register
- `docs/copy-research/` — Stage 3 reference shelf (Schwartz, Caples, Halbert, Bencivenga, Ogilvy, Hopkins, Sugarman, Collier)
- `docs/copy-research/short-form-microcopy.md` — word-level craft
- `docs/copy-research/video-screen.md` — pacing-per-second budget
- `docs/copy-research/direct-response.md` — AIDA / scroll-stopping hooks
