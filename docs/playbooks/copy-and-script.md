# Playbook — Copy & Script

How to write narration and on-screen copy for HyperFrames promos. Hard rules, patterns that land, and the things that have bitten us.

---

## Hard rules (non-negotiable)

### Never invent facts about real brands
**No fake stats, sources, quotes, testimonials, dates, or numbers.** If a fact isn't verifiable from a primary source the user has pointed to (their site, a doc they shared, a public dataset), don't write it.

Bit us once: an early Claim Mate promo contained "1 in 3 ACC claims declined", "MBIE review 2024", "2,400 Kiwis helped", "twelve thousand dollar average outcome". User caught it — none were verified. Cost a re-script.

**If verified stats aren't available, replace numbers with brand voice.** Examples:
- ❌ "1 in 3 ACC claims declined" → ✅ "A decline isn't the end."
- ❌ "12,000 dollar average outcome" → ✅ "We turn no into a path forward."
- ❌ "Trusted by 50,000 Kiwis" → ✅ "Built for the way New Zealanders live."

For verbatim copy from the brand's own site, that's allowed and encouraged — quote them directly. See "Brand extraction" below.

### No Māori / te reo words in TTS narration
Edge TTS (and most neural TTS) butcher Māori pronunciation, undermining the authenticity those words are meant to add.

Use English equivalents in narration:
- ❌ "Built in Aotearoa" → ✅ "Built in New Zealand"
- ❌ "from Tāmaki Makaurau" → ✅ "from Auckland"
- ❌ "kaupapa" / "whānau" / "kia ora" — drop, paraphrase

**Visual on-screen text CAN still use te reo** — only TTS narration is banned. If the brand uses te reo prominently (e.g. "Aotearoa" appears on their site), put it on-screen as a typeset overlay; have the voice say "New Zealand".

### Don't trust stock asset filenames
Stock site filenames are uploader-chosen, not standardised. `phone-doc.jpg` was actually a stressed woman with hand on forehead (wrong emotional beat). `denied-letter.jpg` was a "SPECIAL OFFER" stamp.

Always extract a preview frame and read the asset before placing:
```bash
ffmpeg -ss 0.5 -i <file> -frames:v 1 preview.jpg
```
Then use the Read tool on the JPG. Especially dangerous for emotionally-coded scenes where the wrong beat undermines the message.

---

## Verbatim brand copy — the gold standard

When pitching a real brand, **the brand's own website copy is the safest, most on-tone source you have**. Extract it via:

```bash
curl -sL <url> > /tmp/raw.html
grep -oE '<(title|h1|h2|h3)[^>]*>[^<]+</\1>' /tmp/raw.html
grep -oE '<meta name="description" content="[^"]+"' /tmp/raw.html
```

Then capture the verbatim hero/tagline/feature lines into `DESIGN.md` under a "Verbatim copy" section. Use these directly — invent nothing.

Worked on Kindred (2026-04-25): Hero "Share with neighbours. Find local help." · Tagline "The community app powered by kindness." · Three actions verbatim from the app: "Give what you've got." / "Ask for what you need." / "Find local help." Every line traceable back to kindred-nz.org.

---

## Copy-for-TTS rules

### Acronyms — write the dots
Plain `ACC` might read as "ack" on some voices; `A.C.C.` reads letter-by-letter on every voice. Same for `M.B.I.E.`, `I.R.D.`, `N.H.S.`

### Numbers — spell out
- ❌ "2 minutes" → ✅ "two minutes"
- ❌ "$12,000" → ✅ "twelve thousand dollars"
- ❌ "100%" → ✅ "one hundred percent"

Zero risk across voices. The TTS handles the digits but stumbles on currency symbols and decimals.

### Sentence rhythm
- 12–18 words is the sweet spot for narration sentences
- 6–8 words for emphasis beats — short bursts that punch ("No money. No ads. No algorithm.")
- Read aloud yourself first — if you stumble, the TTS will too

### What to avoid in narration
- Back-to-back `-tion` words (liaison → decision → compensation = unnatural liaison)
- Long parentheticals — break them into short sentences
- Foreign words the voice won't know — substitute or write phonetically
- Em-dashes in long sentences — Edge TTS pause behaviour around `—` is inconsistent (~250ms but variable)

### Pause control via punctuation
Edge TTS pause durations (verified):
- Comma `,` ≈ 180ms
- Period `.` ≈ 350ms
- Em-dash `—` ≈ 250ms (inconsistent)
- **Double line break (paragraph) ≈ 500ms — most reliable**
- Ellipsis `...` is effectively ignored

For a deliberate pause: use a paragraph break (blank line) in the source text, not punctuation tricks.

---

## Script structure that lands

### The 5-beat vertical promo (25–30s, 1080×1920)

Verified on Claim Mate v5 ("Ninety Days") and Kindred ("Share with neighbours"):

1. **Hook (0–3.5s)** — The problem or the question. Text-only or text-led; one bold concept on screen. Examples: "Did A.C.C. decline your injury treatment?" · "Your street's full of useful things."
2. **Brand introduce (3–8s)** — The name, the line, the look. First moment the brand mark appears. Examples: "Claim Mate. Specialist appeal advocacy." · "Kindred. The community app powered by kindness."
3. **What it does (7–17s)** — Three actions, three benefits, three steps. The longest scene; let it breathe. Stagger card entrances to narration sentence boundaries.
4. **Proof / why it matters (16–24s)** — Photo or video carrying the human moment + a tone-bite headline. Examples: "Specialist advocates. No win, no fee." · "No money. No ads. No algorithm. Just local."
5. **CTA (24–29s)** — Wordmark, URL, fine print, action pill. Final scene = only place exits / fade-outs are allowed.

Crossfade overlaps: 0.5s between scenes. No jump cuts.

### Scroll-stopping hooks

For TikTok/Reels-format vertical, the first 1–2 seconds decide whether the viewer scrolls. Worked on Claim Mate v4:
- Text-only hook scene (no photo) with bold stacked typography
- One word at hero size (280px+) anchored canvas-centre
- Overlay element (DENIED stamp / question mark / red X) slams in at t≈1.0s
- Then cut to the photo/video that grounds the problem

The hero word doesn't have to be the brand — it's the **emotional anchor**. ACC. NINETY. NEIGHBOURHOOD. KINDNESS. Make it the thing the viewer's brain locks onto.

---

## Hybrid composition — the user's standing preference

The user prefers compositions that **mix real-world visuals with HTML/CSS information layers**. Not pure-stock (just a montage), not pure-HTML (motion-graphics with no soul). The blend is what lands.

**Rule of thumb:** every scene should have at least one real-world visual grounded in stock AND at least one HTML overlay carrying information or brand cue. If a scene is all one or all the other, flag it as intentional or fix it.

| Layer | Carries | Examples |
|---|---|---|
| Stock photo / video | Human, emotional, real-world | stressed person, hands typing, phone in hand, workspace, exterior shot |
| HTML/CSS overlay | Information, brand, structure | DENIED stamp, step cards 01/02/03, data reveals "90 DAYS" / "$0", brandmarks, CTA wordmarks, legal strips |
| Brand SVG | Hero brand moment | logo with built-in SMIL animation, played via `<img>` |

Confirmed on v5 "Ninety Days": neither pure-stock nor pure-HTML — the blend was what landed. Default to this hybrid unless the brief explicitly calls for cinematic-only or pure-type.

---

## Script generation workflow

1. **Read the brand's site / `DESIGN.md`** for verbatim copy and tone-of-voice.
2. **Identify the emotional anchor** — what one feeling does this video need to leave the viewer with? "You're not stuck." "You're not alone." "Your neighbours have got you."
3. **Write the 5-beat outline first** — one line per scene. Don't write narration yet.
4. **Write narration scene-by-scene**, hitting the word-count budgets above. Read each line aloud.
5. **Run TTS first** ([playbooks/tts-and-narration.md](tts-and-narration.md)) — get measured duration before sizing scenes.
6. **Adjust narration if it's >30s** — trim parentheticals, shorten sentences, drop adjectives.
7. **Lock the script.** Don't rewrite mid-render — fix in next version.

---

## Tone-bite library (reusable phrases)

Phrases that test well with NZ-targeted brand promos. Verified to read cleanly in Edge TTS en-NZ-Molly / en-AU-William:

- "A decline isn't the end."
- "You're not alone."
- "No money. No ads. No algorithm. Just local."
- "Specialist advocates. No win, no fee."
- "Free for every street in New Zealand."
- "Built for the way New Zealanders live."
- "We turn no into a path forward."

Avoid for now:
- Anything with "Aotearoa", "kia ora", "whānau" (Māori words — see hard rules)
- "Game-changing", "revolutionary", "disruptive" — corporate-pitch slop
- "We're a bunch of..." — anything self-deprecating that undercuts the brand
- Numbers without source (see hard rules)

---

## When the user gives feedback on copy

Listen carefully to two specific patterns:

1. **"Make it more conversational"** → drop the corporate verbs (provide, deliver, leverage), shorten sentences, contract auxiliaries (you've, we'll, they're), end on a sentence with one syllable.
2. **"More authoritative"** → switch voice (en-AU-William over en-AU-Mitchell), reduce ellipses, end statements with periods not questions, drop modifiers (very, really, just, simply).

Both happened on Claim Mate v4. Both worked.
