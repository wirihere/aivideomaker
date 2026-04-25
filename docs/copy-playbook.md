# HyperFrames Copy Playbook

> **The source of truth for how copy is written across the 25 templates and
> the auto-extractor.** Cold-readable. Distilled from five research docs
> in `docs/copy-research/`. Updated whenever a template or framework is
> added.
>
> **Why this exists:** the Kindred production render shipped with
> placeholder-quality copy. This playbook is the discipline that prevents
> the next one from doing the same.

## TOC

1. [Hierarchy of impact](#1-hierarchy-of-impact)
2. [The 8 frameworks](#2-the-8-frameworks)
3. [Per-template framework table (all 25)](#3-per-template-framework-table)
4. [Per-line rules (the constraints every line obeys)](#4-per-line-rules)
5. [Word-economy heuristics](#5-word-economy-heuristics)
6. [Voice mapping per vibe template](#6-voice-mapping-per-vibe-template)
7. [Concrete BEFORE / AFTER examples (all 4 vibes)](#7-before--after-examples)
8. [Framework input requirements (for the extractor)](#8-framework-input-requirements)
9. [Lint rules (machine-checkable)](#9-lint-rules)
10. [The "earned word" + Big Idea fields](#10-earned-word--big-idea)

---

## 1. Hierarchy of impact

Every line carries unequal weight. Optimise from the top.

```
Hook       ████████████████████   load-bearing — 0-3s decides everything
Headline   ███████████████        the line the viewer screenshots
Body       ████████               supports — adds the reason-why
CTA        ███████████████        if the hook earned attention, this earns the click
Kicker     ████                   small, but signals which slot you're in
```

**Weight by template type:**

| Template type | Hook weight | Headline weight | Body weight | CTA weight |
|---|---|---|---|---|
| Hero / promo (kinetic-pop) | 35% | 30% | 10% | 25% |
| Case study (documentary) | 15% | 25% | 35% (numbers) | 25% |
| Testimonial (warm) | 20% | 35% (quote) | 15% (attribution) | 30% |
| FAQ (quiet-premium) | 25% | 30% (question) | 30% (answer) | 15% |
| Trades urgency (kinetic-pop) | 40% | 25% | 10% | 25% |
| SaaS feature launch | 20% | 30% | 25% | 25% |
| Ecommerce | 25% | 25% | 15% | 35% (price+verb) |
| Real estate listing | 30% | 25% (address) | 25% (specs) | 20% |
| Restaurant / hospitality | 25% (visual hook) | 25% | 25% (menu) | 25% (book/visit) |
| Wellness clinic | 20% | 30% | 30% (treatments) | 20% |
| Founder story | 25% | 35% | 25% | 15% |
| Before/after | 30% | 30% | 25% (delta) | 15% |

**Implications:** for a 30s hero-promo, a brilliant body and a weak hook
fails the brief. For a 60s case study, a clever hook and a vague stat
fails the brief. Spend writing time proportional to the weight column.

---

## 2. The 8 frameworks

Every template's copy is structured by ONE framework. The extractor's
`--framework=` flag picks between these 8.

### PAS — Problem · Agitate · Solve

| Beat | Job | Per-line |
|---|---|---|
| Problem | Name the pain in their words | Hook + Scene 1 H1 |
| Agitate | Show the cost of inaction | Scene 1 body / Scene 2 setup |
| Solve | Brand collapses the tension | Scene 2-3 H1 + body |
| (Close) | Verb + URL + reason | Final scene CTA |

**Best for:** pain-led briefs. Trades, wellness clinics, problem-solver SaaS.
**Source-URL inputs:** problem statement (h1 / first paragraph), urgency cue
(time-sensitive language), brand mechanism (h2 or feature list).
**Refuses if:** source page has no clear pain language. Auto-falls-back to AIDA.

### BAB — Before · After · Bridge

| Beat | Job | Per-line |
|---|---|---|
| Before | Concrete sensory image of current state | Scene 1 |
| After | Concrete sensory image of new state | Scene 2-3 |
| Bridge | Brand is the only path between | Scene 3-4 |
| (Close) | Verb + URL | Final scene |

**Best for:** transformation briefs. Before/after, fitness, productivity tools.
**Source-URL inputs:** explicit before-and-after language (testimonials with
"used to / now" pattern), or numeric delta (87% / 3.2× / saved $X).
**Refuses if:** no measurable delta in the source. Falls back to FAB.

### STAR — Situation · Task · Action · Result

| Beat | Job | Per-line |
|---|---|---|
| Situation | The customer's context | Scene 1 |
| Task | What they were trying to do | Scene 2 setup |
| Action | What we did | Scene 2 main |
| Result | The measurable outcome | Scene 3 (numbers) |
| (Close) | Quote + CTA | Scene 4-5 |

**Best for:** case-study / proof-led briefs. case-study-60s,
saas-case-study-60s, trades-trust-builder-45s.
**Source-URL inputs:** customer-named outcome stat (mandatory), customer
quote, customer name + role.
**Refuses if:** no outcome stat traceable to source. Falls back to PASTOR
or downgrades to hero-promo.

### FAB — Feature · Advantage · Benefit (inverted)

| Beat | Job | Per-line |
|---|---|---|
| Benefit | Human-level outcome | Hook + Scene 1 H1 |
| Advantage | What that means functionally | Scene 2 H1 |
| Feature | The technical thing that does it | Scene 2 body / Scene 3 |
| (Close) | Verb + URL | Final scene |

**Best for:** product launches. product-launch-30s, saas-feature-launch-20s,
ecommerce-product-spotlight-30s.
**Source-URL inputs:** feature list (H2 / list-items), one outcome line
in benefits language, brand name + URL.
**Note:** always inverted. Benefit first. Engineers' impulse to lead with
the feature loses every test.

### AIDA — Attention · Interest · Desire · Action

| Beat | Job | Per-line |
|---|---|---|
| Attention | Stop the scroll | Hook (≤5 words) |
| Interest | Why it's relevant | Scene 1 body |
| Desire | The outcome they imagine | Scene 2-3 H1 |
| Action | The CTA | Final scene |

**Best for:** cold-traffic ads. social-reel-15s, hero-promo-30s when source
URL is content-thin.
**Source-URL inputs:** any signal — meta description, h1, first paragraph.
**The fallback framework:** when nothing else fits. Always works.

### Hero's Journey (condensed)

| Beat | Job | Per-line |
|---|---|---|
| Ordinary world | Founder's starting state | Scene 1 |
| Inciting incident | What changed / what they saw | Scene 2 |
| Trial | The hard part of building it | Scene 3 |
| Return | What's true now | Scene 4 |
| (Close) | Open invitation | Scene 5 |

**Best for:** founder-story-60s, realestate-agent-brand-30s,
trades-trust-builder-45s.
**Source-URL inputs:** founder name + paragraph in first-person, founding
year or origin event, current product / service.
**Refuses if:** no first-person founder language in source. Falls back to
STAR.

### Transformation arc

| Beat | Job | Per-line |
|---|---|---|
| Before state | Raw, specific, sensory | Scene 1-2 |
| Pivot moment | The decision / intervention | Scene 2-3 |
| After state | Equally specific | Scene 3-4 |
| Delta line | The measurable change | Scene 4 (numbers) |
| (Close) | "You can too" CTA | Final scene |

**Best for:** before-after-20s, trades-before-after-30s,
wellness-fitness-transformation-30s.
**Source-URL inputs:** before-state language, after-state language, optional
delta number. The delta is the load-bearing element.
**Refuses if:** no after-state. (PAS would be the right framework if only
the problem is described.)

### Q-Payoff (Question + Payoff)

| Beat | Job | Per-line |
|---|---|---|
| Question | The viewer's actual question | Scene 1 H1 (as question) |
| Payoff | The 3-second answer | Scene 1 body |
| Detail | One mechanism that earns trust | Scene 2 |
| (Repeat) | Next question / next payoff | Scene 3 |
| (Close) | "More questions? CTA" | Final scene |

**Best for:** faq-quick-30s, saas-product-tour-30s second half, hospitality
booking-question scenes.
**Source-URL inputs:** FAQ section (h2/h3 questions + answer paragraphs),
or pricing page (price as answer to "how much").
**Refuses if:** source has no FAQ-shaped content. Falls back to FAB.

---

## 3. Per-template framework table

All 25 templates and their default framework. The extractor's auto-pick
uses this table; `--framework=` overrides.

### Generic templates (compositions/templates/)

| Template | Default framework | Vibe | Why this framework |
|---|---|---|---|
| `hero-promo-30s.html` | **AIDA** | kinetic-pop | Hook → 3-up benefits → proof → CTA fits the 4-scene 30s structure |
| `case-study-60s.html` | **STAR** | documentary | Has space for full Situation → Task → Action → Result + quote |
| `social-reel-15s.html` | **AIDA** | kinetic-pop | 15s = hook → benefit → benefit → CTA, no room for narrative arc |
| `testimonial-45s.html` | **VOC pull-quote (BAB shaped)** | warm-community | Customer voice IS the framework; quote is the asset |
| `product-launch-30s.html` | **FAB** | kinetic-pop | Feature reveal demands feature → advantage → benefit |
| `founder-story-60s.html` | **Hero's Journey** | documentary | Founder narrative needs the arc to feel earned |
| `before-after-20s.html` | **Transformation** | kinetic-pop | The delta IS the message |
| `faq-quick-30s.html` | **Q-Payoff** | quiet-premium | Question + answer is the structure of the template |

### Vertical templates (compositions/verticals/)

| Template | Default framework | Vibe | Why |
|---|---|---|---|
| `ecommerce-product-spotlight-30s.html` | **FAB** | kinetic-pop | Product-led, feature → benefit close |
| `ecommerce-social-reel-15s.html` | **AIDA** | kinetic-pop | Hook → reveal → price reveal → CTA |
| `hospitality-cafe-vibe-15s.html` | **Sensory hook + Q-Payoff** | warm-community | Mood → menu → location → URL |
| `hospitality-restaurant-promo-30s.html` | **Sensory + FAB** | warm-community→documentary | Atmosphere → menu signals → booking |
| `hospitality-event-special-20s.html` | **AIDA + urgency** | kinetic-pop | Day stamp → highlights → date → book |
| `realestate-agent-brand-30s.html` | **Hero's Journey** | warm-community | Agent voice + values + how they work |
| `realestate-listing-reel-15s.html` | **AIDA** | kinetic-pop | Address → 3 highlights → CTA |
| `realestate-listing-tour-45s.html` | **FAB** | warm-community | Walk through features → benefits → book viewing |
| `saas-case-study-60s.html` | **STAR** | documentary | Same as generic case study, SaaS-specific slots |
| `saas-feature-launch-20s.html` | **FAB** | kinetic-pop | One feature, benefit-led |
| `saas-product-tour-30s.html` | **FAB → Q-Payoff** | quiet-premium | Feature reveal then "questions answered" |
| `trades-before-after-30s.html` | **Transformation** | kinetic-pop | Visual delta is the asset |
| `trades-service-callout-20s.html` | **PAS** | kinetic-pop | Pipe burst → cost rising → call now |
| `trades-trust-builder-45s.html` | **Hero's Journey** | warm-community | Owner-operator voice + work + values |
| `wellness-clinic-trust-45s.html` | **PAS + STAR** | warm-community | Pain → protocol → outcome |
| `wellness-fitness-transformation-30s.html` | **Transformation** | kinetic-pop | Body before → discipline → body after |
| `wellness-spa-mood-20s.html` | **Sensory + Q-Payoff** | quiet-premium | Atmosphere → treatments → book |

---

## 4. Per-line rules

These are **enforceable**. Every line in every template obeys these or
fails lint.

### Hook (≤7 words)

- **Must produce a question in the viewer's head.** "What does this
  mean? Where is this going? Is this for me?"
- **Cannot contain the brand name** (unless the brand IS the hook —
  e.g. "Apple" used as a complete sentence).
- **Single clause.** No "and", "but", or comma.
- **Verb-imperative or pattern-interrupt** for kinetic-pop / trades.
- **Sensory or possessive** for warm-community / hospitality.
- **Question or contradiction** for documentary / quiet-premium.
- **Single-syllable bias** for kinetic-pop social.
- **Hook patterns** (pick one):
  1. Imperative + object — "Stop checking your spam."
  2. Number + thing — "Three lies about pricing."
  3. Possessive + noun — "Your Tuesday morning, finally yours."
  4. Negation — "Don't buy this lawnmower."
  5. Curiosity gap — "What we got wrong."
  6. Ratio — "1 sold every 3 minutes."
  7. Identity ID — "If you're a [identity], read this."

### Headline (≤12 words)

- **Contains the BENEFIT, not the feature.** "Save 9 hours a week" not
  "Automated workflow engine."
- **Active voice.** Subject does the verb.
- **At least one non-substitutable word** (number, named place,
  brand verb, sensory adjective).
- **No filler words.** "Just / really / very / simply / kind of" are
  banned. (Toned-tuner strips them.)
- **Passes 4U test** (Useful + Urgent + Unique + Ultra-specific) with
  ultra-specific non-negotiable.
- **One clause.** Multi-clause moves to body or narration.
- **No corporate jargon** (kill list: leverage, utilise, synergy,
  ecosystem, solutions, stakeholders, holistic, world-class,
  cutting-edge, best-in-class, innovative, premium-as-adjective).

### Body (≤18 words)

- **One idea per line.**
- **One sentence.** No semicolons. No "and / but / which / that"
  joining clauses unless absolutely necessary.
- **Carries one of:** a measurement, a sensory image, a named
  mechanism, a time marker.
- **Replaces every adjective with the fact that makes it true** when
  possible. "Easy" → "three clicks, done." "Trusted" → "12,500
  customers, year nine."
- **Pronoun matches template rule** (see §6).
- **Reading speed test:** ≤4.5 seconds at 4 words/second.

### CTA (verb-first, 2-5 words preferred)

- **Verb is from Tier 1 list:** Get, Try, Start, Book, Visit, Buy,
  Shop, Save, Call, See, Read, Watch, Open, Join.
- **Banned:** "Click here", "Learn more" (alone), "Submit", "Find
  out more", "Discover more". "Discover" alone is fine for
  quiet-premium.
- **Pattern:** verb + (noun) + (optional reason). "Try free for 14
  days." "Book a 10-minute call." "Visit yourbrand.com today."
- **CTA scene answers three questions:** what to do, where, why now.
- **URL is on screen ≥1 second** in the lockup.
- **Single CTA.** No multi-button scenes. (For multiple destinations,
  render multiple videos.)

### Kicker (1-3 words, ALL CAPS)

- **Categorical, not promotional.** "THE OUTCOME", "WHAT WE DO", not
  "AMAZING RESULTS".
- **Distinct per scene.** Same kicker on two scenes = lazy.
- **Vibe-specific phrasing** (see §6).

### Numbers

- **Digits for ≥10**, words for ≤9 in narration.
- **Specific over round.** "97 customers" beats "100 customers" —
  feels counted, not estimated.
- **Percentage > absolute** when the audience doesn't know the
  baseline.
- **Currency placement:** before number for $/£; after for NZD/AUD
  ("$120" / "120 NZD").
- **Never invent.** §4 LEARNINGS hard rule. If not in source URL,
  not on screen.

### Pull-quotes (testimonial / case-study)

- **≤22 words.**
- **Names a specific moment**, not a generalisation.
- **Carries an emotional shift**, not just praise.
- **Attributable to a specific person + role.**
- **Test:** if the quote could be said about *any* product, it's not
  strong enough.

---

## 5. Word-economy heuristics

Every line passes three tests before it ships.

### The 50% rule

Cut half. Then cut half again. The line you end with is twice as good
as the line you started with.

**Workflow:** draft to the upper word cap, then halve, then halve. The
extractor's `compressionWorker` (Phase D) automates this — drafts at
2× the cap, compresses to the cap.

### The "so what" test

Read the line. Ask "so what?" If the line doesn't *force* the next
question, it's not earning its slot. "Industry-leading platform" → so
what? "Cuts admin time 62%" → "how?" — earned.

### The "if I removed this would the meaning survive" test

Cross out each word. If the meaning survives, the word isn't earning
its place. "We are a *really* fast service" — remove "really": "We are
a fast service." Meaning survives. Cut "really". Now: "We're fast.
Three-minute reply." Meaning *changed* — added a measurement. Both
words earned their place.

### The dictation test

Read the line aloud at video speed. If you stumble, re-write. Lines
that need a pause in the head don't work in the mouth.

### The hinge-word check

Does this line have a non-substitutable word? Number, named place,
brand verb, sensory adjective. If every word can be swapped for a
synonym, the line is filler.

---

## 6. Voice mapping per vibe template

The four vibe templates correspond to four locked voice profiles.

### warm-community

**Pronouns:** "we / us / our" lead. "You / your" close. Founder voice.
**Word bias:** near, neighbour, kitchen, hands, home, around the
corner, today, just down the road.
**Avoids:** jargon, hyperbole, exclamations, "world-class", "premium",
multiple-clause sentences.
**Tone:** plain, communal, grounded, sensory.
**Headline category:** voice-of-brand or simple-truth.
**Punctuation:** soft. Periods over exclamations. Em-dashes welcome.
**Per-scene rhythm:** medium pace, breathing room.

**Example slot fills:**
- Kicker: "FROM US TO YOU" / "AROUND THE CORNER"
- Hook: "Just down the road from you."
- Headline: "Local hands, helping hands. Always nearby."
- Body: "Pop in any Tuesday — kettle's on."
- CTA: "Visit kindred-nz.org" / "Drop in any time."

### kinetic-pop

**Pronouns:** "you / your" lead. "We" almost never (founder mode
exception only).
**Word bias:** now, today, win, fast, big, free, save, get, stop, go.
**Avoids:** hedges, multi-clause, third person.
**Tone:** punchy, declarative, energetic, slightly cheeky.
**Headline category:** simple-truth or contradiction.
**Punctuation:** crisp. Periods, occasional exclamation, rare em-dash.
**Per-scene rhythm:** fast pace, hard edits.

**Example slot fills:**
- Kicker: "INTRODUCING" / "THE PROOF" / "GO"
- Hook: "Stop paying for slow."
- Headline: "Built for the speed you actually work at."
- Body: "Ships in 3 days. Returns in 30."
- CTA: "Try free →" / "Shop now →"

### documentary

**Pronouns:** "they / their" lead. "We" allowed in founder mode. "You"
rare, only in CTA.
**Word bias:** since, after, before, the work, the people, in 2019,
across, observed, measured, decade.
**Avoids:** hype, second-person, exclamations, contractions in
headlines.
**Tone:** considered, third-person, factual, unhurried.
**Headline category:** simple-truth (numbers preferred).
**Punctuation:** restrained. Full stops. Em-dashes for asides.
**Per-scene rhythm:** slow, editorial, room to land.

**Example slot fills:**
- Kicker: "THE WORK" / "THE OUTCOME" / "SINCE 2019"
- Hook: "What changes when you stop guessing."
- Headline: "By 2024, the team had moved 87% of admin off-payroll."
- Body: "The change took a year. The decision took a week."
- CTA: "See the full case study at studionorth.co/case"

### quiet-premium

**Pronouns:** none preferred. Subject implied. "You" for CTA only.
**Word bias:** considered, made, quiet, intent, made-to-stay, single,
honest, slow.
**Avoids:** lists of three, alliteration, slogans, exclamations,
adjective stacks.
**Tone:** sparse, single-thought-per-line, restrained.
**Headline category:** simple-truth or metaphor.
**Punctuation:** periods only. No em-dashes. No exclamations.
**Per-scene rhythm:** glacial, breathing, near-silence between beats.

**Example slot fills:**
- Kicker: "MADE TO STAY" / "ONE QUESTION"
- Hook: "Considered. Quiet. Made to stay."
- Headline: "A single decision. Kept honest."
- Body: "Six pieces. One material. No more, no less."
- CTA: "Discover the collection."

---

## 7. BEFORE / AFTER examples

Concrete rewrites for each vibe template. The "BEFORE" lines are the
kind of placeholder copy currently in the templates. The "AFTER" lines
follow the playbook.

### warm-community (Kindred-style)

**Scene 1 — kicker, hook, body**

| Slot | BEFORE (placeholder) | AFTER (playbook-shaped) |
|---|---|---|
| Kicker | INTRODUCING | AROUND THE CORNER |
| Hook | Your big idea in five words. | A pram, a meal, a hand. |
| Body | A short supporting line that sets the stakes — what changes for whom. | When the day's a lot, your neighbours are right there. |

**Why AFTER works:** kicker is categorical and warm-specific.
Hook follows the rhythm-of-three pattern (1-syllable, 1-syllable, 1
syllable; concrete nouns). Body uses sensory possessive ("the day"),
warm-community pronoun ("your"), and is single-clause.

**Scene 4 — CTA**

| Slot | BEFORE | AFTER |
|---|---|---|
| Closer | Try it today. | Just local, just helping. |
| URL | yourbrand.com | kindred-nz.org |

**Why AFTER works:** closer compresses the Big Idea ("local",
"helping") in 4 words. The earned word is "just" — repeated,
deliberate. URL in lockup form.

### kinetic-pop (hero-promo / launch)

**Scene 1 — hero, scene 3 — proof**

| Slot | BEFORE | AFTER (FAB framework) |
|---|---|---|
| Kicker | INTRODUCING | NEW THIS WEEK |
| Hook | Your big idea in five words. | Save 9 hours every Friday. |
| Headline | A short supporting line that sets the stakes — what changes for whom. | The admin engine your team forgot to ask for. |
| Stat | 12,500+ | 9 hrs |
| Stat label | PEOPLE WHO TRUST US | SAVED EVERY WEEK |
| CTA verb | Try | Try free |
| CTA closer | Try it today. | Try free for 14 days. |

**Why AFTER works:** hook is benefit-led with measurement (4U test
hits Ultra-specific). Stat carries the unit of value the team cares
about. CTA is verb-first 4 words, includes the duration as the trust
signal.

### documentary (case-study / founder)

**Scene 1 — problem, scene 3 — outcome**

| Slot | BEFORE | AFTER (STAR framework) |
|---|---|---|
| Kicker | THE PROBLEM | UNTIL 2023 |
| Hook (S1 H1) | A clear, single sentence that names the pain. | Their team spent four hours a week on invoice chasing. |
| Body (S1 supporting) | A second line that grounds it — who it affects, how often, what's at stake when nothing changes. | Three of those hours were the same call, repeated. |
| Stat 1 | 87% | 87% |
| Stat 1 label | FEWER MANUAL STEPS | FEWER MANUAL STEPS |
| Quote | A short, specific quote that captures one human moment of change. | "We finished the quarter without a single Friday-night reconcile." |
| Attribution | First Last / ROLE — ORGANISATION | Mei Tan / OPERATIONS LEAD — STUDIO NORTH |

**Why AFTER works:** documentary stays third-person ("their team",
"three of those hours"). Numbers carry weight. Quote names a specific
moment ("Friday-night reconcile") — non-substitutable. Attribution is
specific, not generic.

### quiet-premium (FAQ / spa)

**Scene 1 — question, scene 2 — answer**

| Slot | BEFORE | AFTER (Q-Payoff framework) |
|---|---|---|
| Kicker | QUESTION ONE | ONE QUESTION |
| Hook (S1 question) | What's a typical question? | How long does a session take? |
| Answer | A typical answer to the question. | Ninety minutes. Then thirty for the conversation. |
| CTA | Click here. | Book a session. |
| URL | yourbrand.com | quiethealth.co |

**Why AFTER works:** quiet-premium pacing — sparse, single-thought
sentences. No adjective stacks. No exclamations. The answer "Ninety
minutes. Then thirty for the conversation." is two sentences, both
single-thought, both sensory ("the conversation" implies the
treatment + the human listening). CTA is verb-first, 3 words.

---

## 8. Framework input requirements

For the extractor: each framework demands certain content from the source
URL. If the source page lacks the required input, the framework refuses
and falls back.

| Framework | Hard requirements (must have) | Soft requirements (nice to have) | Fallback if missing |
|---|---|---|---|
| **PAS** | Pain language in source (h1 / paragraph) | Cost-of-inaction line | AIDA |
| **BAB** | Before-state language; after-state language; concrete sensory image of either | Numeric delta | FAB |
| **STAR** | Customer-named outcome stat; customer quote; customer name + role | Multi-stat row, before-context | PASTOR → hero-promo (downgrade) |
| **FAB** | Feature list (≥3 items in h2 / li); benefit language for ≥1 feature | Brand mechanism explanation | AIDA |
| **AIDA** | Any signal (meta description, h1, paragraph) | None | This is the fallback |
| **Hero's Journey** | First-person founder language; founding event / year; current product | Pivot-moment language | STAR |
| **Transformation** | Before-state; after-state; measurable delta | Date / time-frame | PAS |
| **Q-Payoff** | FAQ section (h2/h3 questions) OR pricing page | Multi-question structure | FAB |

**The "refuse-rather-than-fabricate" rule:** if hard requirements aren't
met, the extractor logs the gap and falls back. Never invents the missing
input. (LEARNINGS §4.)

**Implementation in `extract-copy.mjs`:** each framework gets a
`requirements()` predicate that scans the scraped object. The supervisor
calls predicates in order, picks the first satisfied, and emits a log
line for each refusal.

---

## 9. Lint rules

Machine-checkable rules the lint script enforces on every template.

### Hard errors (block render)

- Hook word count > 7
- Headline word count > 12
- Body word count > 18
- CTA contains banned phrase ("Click here", "Learn more" alone, "Submit", "Find out more")
- Headline contains kill-list jargon (leverage / utilise / synergy / ecosystem / solutions / stakeholders / world-class / cutting-edge / best-in-class / innovative / premium-as-adjective / holistic)
- Numeric stat present with no source-URL match (extracted-copy mode only — templates ship with placeholder stats that are explicitly marked)
- Brand name in hook (unless brand IS the hook)

### Warnings (informational)

- Headline contains 0 non-substitutable words (no number, no place, no sensory adjective)
- Multi-clause headline (≥2 commas)
- Three lines in same scene with identical word count ±1 (rhythm rule)
- Adjective from soft-strip list ("fast", "easy", "great", "trusted",
  "amazing", "awesome", "premium") with no measurement justification
- Pronoun count mismatch with vibe-template default (e.g.
  warm-community scene with no "we / our"; documentary scene with "you")
- Identical kicker on adjacent scenes

### Info-level (lint --verbose)

- 4U-test partial pass (≤2/4 of Useful / Urgent / Unique / Ultra-specific)
- Hook syllable count > 12 (kinetic-pop only)
- CTA missing "why now" beat

---

## 10. Earned word + Big Idea

Two metadata fields the extractor produces alongside copy. Both are
human-readable; both pass to the orchestrator for asset / music
selection.

### `earnedWord`

The single word the video is teaching. The CTA scene must include this
word. The kicker / hook should pre-load it.

**Test:** if the closer dropped the earned word, would the video lose
meaning? If yes, it's earned. If no, find a better earned word.

**Examples:**
- Kindred → "local" (or "neighbour")
- Apple "Think Different" → "different"
- Nike "Just Do It" → "just"
- Squarespace "Make It Real" → "real"
- A clinic → "rest" / "kept" / "honest"
- A trades-truck → "right" / "first time"

### `bigIdea`

The one-sentence strategic insight the video carries. Compressible to
≤15 words. Visualisable. Surprising-but-inevitable.

**Pattern templates per vertical:**

- Hospitality: "[Place] is the [emotional space] of [neighbourhood]."
- SaaS: "Your [hard task] without [hated friction]."
- Real estate: "[Address] is [the way you want to live]."
- Wellness: "[Treatment] for [recurring problem people endure]."
- Trades: "[Trades work] done [the way that protects the customer]."
- Charity / community: "[Help] [scale-down to human level]."
- Founder story: "[Founder] built it after [specific moment]."

**For the extractor:** the `bigIdea` field is mandatory in the copy doc.
If the extractor can't compose one from source signals, it logs the gap
and offers a default ("[Brand] for [audience]") with a `⚠ generic
big-idea` warning.

### Both fields surface in the playbook-aware extractor's output:

```json
{
  "slug": "...",
  "framework": "STAR",
  "bigIdea": "Studio North gave their ops team back Friday nights.",
  "earnedWord": "Friday",
  "narration": "...",
  "beats": [...],
  "cta": {...}
}
```

The orchestrator can use `earnedWord` to pick the music swell point and
`bigIdea` to brief the visual asset selection (Pexels / Unsplash query
seed).

---

## Appendix A: per-template "first lines" canon

The opening hook / kicker pair for each of the 25 templates. These are
the *target quality bar* for the placeholder copy. Template authors fill
in their template's slot with copy that *sounds like* the line below
(tuned to whatever the source URL provides at extract time).

| Template | Kicker | Hook target |
|---|---|---|
| hero-promo-30s | NEW THIS WEEK | Save 9 hours every Friday. |
| case-study-60s | UNTIL 2023 | Their team spent four hours a week on invoice chasing. |
| social-reel-15s | DON'T MISS | Stop paying for slow. |
| testimonial-45s | CUSTOMER STORY | Mei Tan was tired of Friday-night reconciles. |
| product-launch-30s | LAUNCHING TUESDAY | The kettle that knows your alarm. |
| founder-story-60s | SINCE 2019 | She built it after her mother got the bill. |
| before-after-20s | THE 90-DAY MARK | Six minutes of work. Forty hours back. |
| faq-quick-30s | THREE QUESTIONS | How long does a session take? |
| ecommerce-product-spotlight-30s | NEW IN | Run six miles, look like one. |
| ecommerce-social-reel-15s | THIS WEEK ONLY | The boots ten thousand bought twice. |
| hospitality-cafe-vibe-15s | ON QUEEN STREET | Your Tuesday morning, finally yours. |
| hospitality-restaurant-promo-30s | BOOK FRIDAYS | Three courses. Two seats left. |
| hospitality-event-special-20s | THIS SATURDAY | Pizza, wine, the porch lights on. |
| realestate-agent-brand-30s | TWELVE YEARS HERE | She sold the street before she lived on it. |
| realestate-listing-reel-15s | 14 OAK ROAD | Three beds, one view, the back garden you wanted. |
| realestate-listing-tour-45s | OPEN SUNDAY | Walk through the kitchen first. |
| saas-case-study-60s | UNTIL 2023 | Their ops lead spent Fridays chasing invoices. |
| saas-feature-launch-20s | SHIPPED TODAY | Drafts that finish themselves. |
| saas-product-tour-30s | NINETY SECONDS | The bits you'll use every day. |
| trades-before-after-30s | LAST TUESDAY | The leak ran six metres. Now it doesn't. |
| trades-service-callout-20s | RIGHT NOW | The leak's getting bigger. We're 12 minutes away. |
| trades-trust-builder-45s | FAMILY-RUN, 28 YRS | The first call we make is to you. |
| wellness-clinic-trust-45s | OUTPATIENT CARE | The pain that wakes you up — addressed. |
| wellness-fitness-transformation-30s | TWELVE WEEKS | Six minutes a day. Then more. |
| wellness-spa-mood-20s | MADE TO STAY | Ninety minutes. Then thirty for quiet. |

Each is ≤7 words for hook, ≤3 for kicker. None invent facts; all are
*shapes* the extractor can populate from a real source URL.

---

## Changelog

- **2026-04-25** — Initial playbook (this document). Covers all 25
  templates, 8 frameworks, 4 vibes. Seeds Phase D extractor upgrade.

---

## See also

- `docs/copy-research/direct-response.md`
- `docs/copy-research/brand-storytelling.md`
- `docs/copy-research/modern-digital.md`
- `docs/copy-research/video-screen.md`
- `docs/copy-research/short-form-microcopy.md`
- `LEARNINGS.md §3` — Copy generation pipeline
- `scripts/extract-copy.mjs` — playbook-aware extractor
