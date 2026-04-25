# Playbook — Website-to-Video Stacks

A **stack** is a coordinated set of choices across every dimension of the video — transitions, atmospheric layers, music, copy tone, pacing, and TTS voice. Pick one stack at the start of a project and let it constrain every downstream decision.

Why stacks: a whip transition + cinematic strings + corporate copy clash. The viewer feels something is "off" without being able to name it. Stacks prevent that mismatch by defining a coherent feel, then propagating it through every choice.

This is the master playbook. It lives upstream of [music.md](music.md), [copy-and-script.md](copy-and-script.md), [transitions.md](transitions.md), [atmospheric-polish.md](atmospheric-polish.md), and [cards-library.md](cards-library.md) — those documents tell you HOW to do each thing; this one tells you WHICH to do.

---

## How to pick a stack

Look at the brand's website with one question in mind: **what does the viewer feel after 6 seconds?**

- They feel *welcomed* and *neighbourly* → **Warm Community**
- They feel *energised* and *can't-look-away* → **Kinetic Pop**
- They feel *informed* and *trusting an expert* → **Documentary Considered**
- They feel *quietly impressed* and *aspirational* → **Quiet Premium**

If two stacks match, pick the one with the lower energy ceiling — viewers downgrade harshly when energy doesn't match the brand. A wedding venue with whip transitions reads as wrong; a TikTok-native skincare brand with a documentary score feels embalmed.

If none match, stop. Don't hybridise stacks until you've shipped 3 single-stack videos. Hybrids are a precision move, not a default.

---

## Stack 1 — Warm Community

**Vibe:** Cream-and-natural. Hand-knit feel. Neighbourhood noticeboard, not tech product. The viewer should feel a doorstep welcome.

**Best for:** community apps, charities, NGOs with a people focus, locally-rooted brands, social-impact products, parenting / wellbeing / mutual-aid services.

**First proven on:** Kindred — `kindred-nz.org` ([renders/aivideomaker_2026-04-25_12-54-16.mp4](../../renders/aivideomaker_2026-04-25_12-54-16.mp4)).

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Hook → Brand introduce | **Color wash** | Brand color sweeps in. The "moment of arrival." Once per video. |
| Brand → Features | **Soft cross-dissolve** | Same-tone calm. |
| Features → Proof | **Soft cross-dissolve** | |
| Proof → CTA | **Soft cross-dissolve** with subtle brand-color pulse | Build to action without yelling. |

Never: whips (too kinetic — see Stack 2 for whips), hard cuts, slide-pushes (too tech), light leaks (too lifestyle). The warm-community feel needs slow ease, not energy injection. Whips read as a different brand voice and break the trust the rest of the stack is building.

**Lesson learned 2026-04-25 (Kindred render):** initially used whip+whoosh on two cuts. Looked technically correct but felt out-of-character — community brand reading as a kinetic-pop ad. Removed both whips, all soft cross-dissolves with one color-wash for brand arrival. Render felt right.

### Atmospheric layers

- ✅ Music bed: warm acoustic guitar, light percussion, 80-100 BPM
- ✅ Camera push-in: 1.0 → 1.03 every scene
- ✅ Vignette: subtle, multiply blend
- ✅ Film grain: 0.08 opacity, slow drift
- ✅ Particles on dark scenes only (teal/brand-color scenes)
- ✅ Light beam on the longest calm scene
- ✅ Paper-grain drift on cream scenes

### Music

Search keywords: `warm acoustic guitar community`, `gentle acoustic folk`, `documentary acoustic piano`, `inspirational acoustic uplifting`. BPM range 80-100. Avoid: synth, electronic, drum-heavy, vocal samples.

Default volume `0.18` under narration; can swell to `0.45` between phrases.

### TTS voice

| Setting | Value |
|---|---|
| Voice | `en-NZ-MollyNeural` (NZ projects) or `en-AU-NatashaNeural` (warmer) |
| Rate | `-10%` |
| Pitch | default or `+2Hz` |

Avoid: US voices (foreign for NZ/AU brands), heavy male voices (too authoritative for community).

### Copy tone

- Conversational, sentence fragments OK ("No money. No ads. Just local.")
- Verbatim brand copy from site is the gold standard
- Hand-knit phrases: "your street", "your neighbours", "close to home"
- 12-18 word narration sentences; 6-8 for emphasis beats
- Never: jargon, acronyms without context, corporate verbs (deliver, leverage, optimise)

### Pacing — 5-beat / 25-30s

```
0.0–3.5s   Hook            (text-only, cream)
3.0–8.0s   Brand introduce (brand-color, big wordmark + tagline)
7.5–16.5s  Features        (3-up cards, narrated cue per row)
16.0–24.5s Proof           (kinetic headline + photo/phone)
24.0–29.5s CTA             (wordmark, URL, pill)
```

0.5s overlap between scenes for transitions to live in.

---

## Stack 2 — Kinetic Pop

**Vibe:** Scroll-stopping. Pop-cultural energy. Bright, fast, percussive. The viewer should feel *I can't look away*.

**Best for:** DTC consumer brands, lifestyle apps, creator tools, fitness, beauty, anything targeting Gen Z, anything where vertical-format scroll is the primary distribution channel.

**Status:** Not yet proven. Promote when first shipped.

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Every cut | **Whip + whoosh** | Yes, every one. Vary direction (left/right/up). |
| Optional within scene | **Light leak flash** | Coloured wash on emphasis beats. |

Never: cross-dissolves (too slow), color washes (too long for the pacing), match-cuts (require setup time the pacing doesn't allow).

### Atmospheric layers

- ✅ Music bed: synth-driven, drum-heavy, 110-130 BPM
- ✅ Camera push-in: aggressive 1.0 → 1.06 (more obvious zoom)
- ✅ Particles: dense, sharper (no blur), brand-color tinted
- ✅ Light leaks during transitions
- ❌ Film grain (too cinematic, dulls the punch)
- ❌ Paper-grain drift (too soft)
- ❌ Long vignettes (compresses the energy)
- ✅ Quick scale-pulses on key elements with the music's kick

### Music

Search keywords: `upbeat electronic motivation`, `energetic pop dance`, `tiktok trending beat`, `epic build-up drop`. BPM range 110-130. The music's kick should land on every transition — pre-listen and align cuts to drops.

Default volume `0.30` under narration (sit higher than Warm Community's 0.18 — kinetic energy needs the music forward).

### TTS voice / captions

| Setting | Value |
|---|---|
| Voice | `en-US-AriaNeural` or `en-GB-RyanNeural` `+5%` |
| Rate | `+5%` to `+10%` |

Or, more often, **skip TTS entirely** and use **kinetic captions** sized to fill 70% of frame width, one phrase per cut.

### Copy tone

- Punchy. ALL CAPS allowed for hero words.
- Single-word sentences: "WAIT." "WHAT?" "FINALLY."
- Hook every 2 seconds. The viewer's thumb is on the scroll button.
- Active voice, exclamation marks earned not sprinkled
- Never: long sentences (>10 words), "we believe", "our mission", anything that sounds like a board meeting

### Pacing — 7-9 beats / 25s

```
0.0–2.5s   Hook (the one question)
2.5–5.0s   Reveal 1 (first answer)
5.0–7.5s   Reveal 2 (build)
7.5–10.0s  Reveal 3 (climax)
10.0–14.0s Demo / proof
14.0–18.0s Stat / payoff
18.0–22.0s Brand
22.0–25.0s CTA
```

No scene >4s. Cut on every kick.

---

## Stack 3 — Documentary Considered

**Vibe:** Serious, evidence-based, slow and deliberate. The viewer should feel *I am being respected and informed*.

**Best for:** B2B SaaS targeting senior decision-makers, professional services (legal / financial / medical), AI research, serious technology, healthcare, regulated industries.

**Status:** Not yet proven. Promote when first shipped.

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Every cut | **Cross-dissolve** | 0.6-0.8s, slower than default. |
| Once per video | **Match cut** | Bridges a narrative pivot. Optional. |

Never: whips (cheap), color washes (too theatrical), slide-pushes (too tech), light leaks (too lifestyle).

### Atmospheric layers

- ✅ Music bed: cinematic strings, piano, 60-80 BPM
- ✅ Camera push-in: very subtle 1.0 → 1.02
- ✅ Heavy film grain: 0.12 opacity (analog-camera feel)
- ✅ Strong vignette: 0.25 alpha on edges
- ❌ Particles (too playful)
- ❌ Paper-grain drift (too soft)
- ❌ Light beams (too theatrical)
- ✅ Slow camera tilt or parallax on photos

### Music

Search keywords: `documentary cinematic emotional`, `piano strings reflective`, `inspirational documentary score`, `slow building cinematic`. BPM range 60-80. Avoid: drums on beat, vocal samples, anything from a "trending" playlist.

Default volume `0.22` — slightly forward to support the gravitas, but never compete with narration.

### TTS voice

| Setting | Value |
|---|---|
| Voice | `en-AU-WilliamNeural` (NZ/AU briefs) or `en-GB-RyanNeural` |
| Rate | `-12%` |
| Pitch | default |

Authoritative baritone. Pronounces acronyms with dots (`A.C.C.`, `M.B.I.E.`). Reads with measured weight.

### Copy tone

- Clear, factual, structured. Senior-decision-maker tone.
- Longer sentences (15-25 words) — but read at -12% rate, they breathe naturally
- Evidence anchors: dates, named sources, quoted phrases (must be real — see [copy-and-script.md](copy-and-script.md) hard rule on inventing facts)
- Voice-of-authority, never voice-of-friend
- Active verbs but quiet ones: "demonstrates", "establishes", "shows", "confirms"
- Never: exclamation marks, ALL CAPS, "amazing", "game-changing"

### Pacing — 5 beats / 30-35s

```
0.0–5.0s    Hook (a question or a fact, not a hype line)
5.0–11.0s   Context (what's happening, who's affected)
11.0–20.0s  Evidence (the proof — case study, stat, quote)
20.0–28.0s  Resolution (what the brand does about it)
28.0–35.0s  CTA (subtle, "Learn more" not "Buy now")
```

Scenes can hold 6-8s. Don't rush. Don't cut on the music's beat — cut between sentences, on the breath.

---

## Stack 4 — Quiet Premium

**Vibe:** Hushed, considered, expansive negative space. The viewer should feel *this is for someone who doesn't need to be sold*.

**Best for:** luxury products, hospitality, fashion, premium subscriptions, high-touch services, anything where the brand's competence is implied not declared.

**Status:** Not yet proven. Promote when first shipped.

### Transitions

| Cut | Use | Notes |
|---|---|---|
| Every cut | **Slow cross-dissolve** | 0.8-1.2s, glacial by other stacks' standards. |
| Once per video | **Match cut** | Quietly impressive, story-continuity. |

Never: whips (loud), color washes (theatrical), light leaks (busy), particles (cluttered).

### Atmospheric layers

- ✅ Music bed: ambient pad, sparse piano, 50-70 BPM, no vocals
- ✅ Camera push-in: 1.0 → 1.025 (almost invisible)
- ❌ Film grain (too analog, breaks the polish)
- ❌ Particles (too theatrical)
- ❌ Light beams (too broadcast)
- ✅ Whisper-soft vignette: 0.1 alpha
- ✅ Hold scenes long (6-10s) without motion — let typography breathe

### Music

Search keywords: `ambient piano minimal`, `cinematic quiet emotional`, `sparse atmospheric`, `meditation cinematic`. BPM range 50-70. Or no music at all — silence as luxury.

Default volume `0.12` — barely there, present but never demanding.

### TTS voice

Often: **no narration**. Let typography and music carry the story.

If narration: `en-GB-LibbyNeural` or `en-US-JennyNeural` at `-15%`. Whisper-soft, almost private.

### Copy tone

- Short. Single-line scenes, sometimes single-word.
- Lots of held silence. Em-dashes for thinking pauses.
- No CTAs that command — invitations only ("Discover the collection")
- Never: percentages, urgency words, "limited time", "act now"

### Pacing — 4 beats / 30-40s

```
0.0–8.0s    Hold one image / typography card
8.0–18.0s   Hold a second
18.0–28.0s  Hold a third
28.0–35.0s  Brand reveal + invitation
```

The longer you hold, the more premium it reads. If a scene feels too long, hold it longer.

---

## Stack picker — quick decision matrix

| Question | Warm | Kinetic | Documentary | Quiet |
|---|:-:|:-:|:-:|:-:|
| Brand is community / social impact | ✅ | | | |
| Brand is scroll-native / Gen Z | | ✅ | | |
| Brand sells to senior decision-makers | | | ✅ | |
| Brand is luxury / aspirational | | | | ✅ |
| Music has lyrics on stock | ✅ | ✅ | | |
| Run time is 25-30s | ✅ | ✅ | | |
| Run time is 30-40s | | | ✅ | ✅ |
| Need a CTA-pill button | ✅ | ✅ | | |
| Need a "Learn more" link only | | | ✅ | ✅ |
| Trust comes from warmth | ✅ | | | |
| Trust comes from authority | | | ✅ | |
| Trust comes from peer signals | | ✅ | | |
| Trust comes from understatement | | | | ✅ |

---

## Why this matters for the Website-to-Video method

The brand-extraction step gives us **what the brand looks like** — colours, fonts, copy, imagery. The stack picks **what the brand feels like** — pace, voice, atmosphere, transitions. Without a stack, brand-extraction alone produces a "moodless" render that uses the right palette but feels like a slide deck.

In the pipeline:

```
1. Brand extraction (URL → palette/fonts/copy)         [tokens-<brand>.css]
2. Stack pick      (gut + decision matrix above)       [docs/playbooks/stacks.md]
3. Asset fetch     (music search per stack)            [music.md]
4. Script + TTS    (copy tone + voice per stack)       [copy-and-script.md]
5. Composition     (transitions + atmospherics per stack)  [transitions.md, atmospheric-polish.md, cards-library.md]
6. Render
```

Stack picked at step 2 propagates through every subsequent step. If a stack switch happens mid-build, redo from step 3 — don't try to "patch" a render to a new stack.

---

## Building a new stack

If a brand doesn't fit any of the four, don't shoehorn — propose a new stack. Authoring rules:

1. **Mood paragraph** — one sentence describing what the viewer should feel after 6 seconds.
2. **Best for** — at least 5 use cases. If you can't think of 5, the stack is too narrow.
3. **Transitions table** — at least 2 transition types named with explicit "use here / never here" rules.
4. **Atmospheric checklist** — every atmospheric layer marked ✅ or ❌. No "maybe".
5. **Music search keywords + BPM range + volume default**.
6. **TTS voice + rate** OR explicit "no narration".
7. **Copy tone** — 3-5 do/don't bullet points.
8. **Pacing template** — beat sheet with timestamp ranges, total run-time.
9. **First proven on** — empty until shipped, then fill in with render path.

Stacks that aren't proven on a real render are drafts. Mark them clearly.
