# Modern Digital + Conversion Copy — Research Notes

> Worker focus: the post-2010 conversion-copy lineage — voice-of-customer
> mining, A/B-tested headline frameworks, scannable rhythm, CTA verb
> selection, and the move from "writer's instinct" to "evidence-led copy."

## Sources mined

- **Joanna Wiebe** — Copyhackers (founded 2011); the canonical body of
  work on conversion copy and voice-of-customer
- **Ann Handley** — *Everybody Writes* (2014, expanded 2022); the
  reference for content-led brand voice
- **Sean D'Souza** — *The Brain Audit* (2009); Psychotactics
- **MarketingExperiments / MECLABS** — landing-page conversion research,
  Flint McGlaughlin's "messaging frameworks"
- **Brian Dean / Backlinko** — modern headline / SERP testing patterns
- Supporting: ConversionXL (CXL), Unbounce blog, Optimizely test
  case studies, Nielsen Norman Group writing-for-the-web research

## What "modern digital" means for video copy

Where direct-response classics tested print headlines and brand
storytelling polished agency craft, modern digital copy lives in the
intersection of analytics, A/B testing, and a viewer who can scroll
away in 0.6 seconds. The copy is *evidence-led*: every line should be
defensible as the version that beat the alternatives.

For HyperFrames, this tradition gives us:
- a method for sourcing copy from the audience (VOC mining)
- frameworks for headlines that have actually beaten alternates
- the rhythm rules for scannable on-screen text
- the discipline of CTA verb selection (not "submit" or "click here")

## 1. Voice-of-Customer (VOC) mining — Wiebe

Wiebe's central contribution: **the highest-converting copy comes
straight from the customer's mouth, not the writer's.** Her workflow:

1. Pull review-text, support tickets, social mentions, post-purchase
   surveys.
2. Tag every phrase by job: pain, dream, hesitation, transformation.
3. Sort by frequency. Top 5 per category = candidate phrases.
4. Splice top phrases into headlines. The exact wording moves the
   conversion needle more than rewrites.

**For our pipeline:** even though the HyperFrames extractor cannot mine
review sites at extract-time, the playbook can declare that the
extractor should *prefer* paragraph-style first-person language ("we
struggled with…", "what changed for us…") over heading-style brand
language ("Industry-leading X solutions"). When both exist on the
source page, lift the first-person. That's a single rule with outsized
quality impact.

**The "one sentence per job" pattern:** Wiebe insists each landing-page
slot does exactly one job (introduce, justify, prove, close). Same
applies to scenes. A scene that tries to introduce AND prove is a
scene the viewer doesn't trust. Pick one job per scene.

## 2. The 4U headline framework — Wiebe / Michael Masterson

Headlines that convert hit four U's:

- **Useful** — does the headline promise something the viewer wants?
- **Urgent** — is there a reason to act now (time, season, scarcity)?
- **Unique** — is the angle one the viewer hasn't seen 50 times?
- **Ultra-specific** — are there numbers, places, named outcomes?

A great headline hits 4/4. A workable one hits 3/4. A tired one hits
1-2.

**For our pipeline:** the lint rule the playbook should encode — every
hero-scene H1 must score ≥3/4 on the 4U test, with **ultra-specific**
non-negotiable. If the source URL gives us no specificity, the extractor
should output a clearly-marked "needs specificity" warning rather than
ship a vague H1.

## 3. The FAB framework — Features, Advantages, Benefits

A staple of landing-page copy classes since the 1980s, refined for web
by ConversionXL and others:

- **Feature** — what the product technically does. ("256-bit encryption.")
- **Advantage** — what that means functionally. ("Your data can't be
  read in transit.")
- **Benefit** — the human-level outcome. ("Sleep without worrying about
  the breach you read about this morning.")

**The cardinal rule:** never sell the feature. Always sell the benefit.
Features earn the trust that lets the benefit land. This is the
opposite of how engineers write product copy — they default to feature
> advantage > benefit (the order they invented it). Conversion copy
flips it: benefit > advantage > feature.

**For our pipeline:** product-launch and saas-feature-launch templates
default to FAB inverted. Body slot reads: outcome line first, mechanism
line second, feature line last (or omitted if 30s budget).

## 4. The PASTOR framework — Ray Edwards

Modern expansion of PAS:

- **P**roblem
- **A**mplify
- **S**tory
- **T**estimony
- **O**ffer
- **R**esponse

For 60s templates with budget for a quote/testimonial scene, PASTOR is
PAS + the missing two beats (story + testimony). It's why
case-study-60s and testimonial-45s naturally fit a longer arc — they
have room for the testimony beat the 30s templates don't.

**For our pipeline:** PASTOR is the recommended framework for
case-study-60s, founder-story-60s, and trades-trust-builder-45s.

## 5. The 7-second / 3-second rules — Nielsen Norman Group

Web users scan, not read. Nielsen Norman tracking studies show:

- The viewer reads 20-28% of words on a typical page in their first
  pass.
- F-shaped reading pattern dominates: top, then top-left of body, then
  scroll.
- A scannable page beats a non-scannable page on every metric — even
  when the scannable version has 20% less information.

**For video on-screen text:** the equivalent rule is "any line that
takes more than 1.2 seconds to read at 1.0× speed will be skipped by
half the audience." The math:

- Average reading speed: 200-250 words/minute = ~4 words/second
- A 7-word headline = 1.7-2.0 seconds to read; viewers see 80% of it
- A 12-word headline = 3 seconds to read; viewers see 60% of it
- An 18-word body = 4.5 seconds to read; viewers see ~50% of it

**For our pipeline:** the per-line word caps in the playbook (hook ≤7,
headline ≤12, body ≤18) come directly from this research. The extractor
must enforce them, not soft-recommend them.

## 6. The 5-Second Test — usability practice

A landing-page diagnostic: show a user the page for 5 seconds, take it
away, ask "what is this product, who is it for, what should you do?" If
the user can't answer all three, the page fails.

**Video equivalent:** at the 5-second mark of any HyperFrames video,
the viewer should already know:
- What the brand is (kicker / brand chip)
- What it's for (hook + headline)
- That something else is coming (visual rhythm)

**For our pipeline:** the extractor must guarantee the brand name appears
on screen within the first 5 seconds. The playbook codifies this as a
hard rule — every template's scene 1 must include either the wordmark
or the brand chip.

## 7. CTA verb selection — Backlinko / MarketingExperiments

CTA testing across thousands of landing pages converges on these
rankings:

**Verbs that consistently outperform "Submit" / "Click here" / "Learn
more":**

| Tier | Verbs |
|------|-------|
| **Tier 1** (action-direct) | Get, Try, Start, Book, Visit, Buy, Shop, Save |
| **Tier 2** (action-soft) | See, Show, Read, View, Watch, Open |
| **Tier 3** (avoid) | Submit, Click here, Learn more, Find out, Discover (when alone) |

**Pattern that beats single-verb:** verb + noun + (optional) reason —
"Try free for 14 days." "Book a 15-minute call." "Get the demo,
3-minute watch."

**Pattern that wins for hesitant audiences:** verb + outcome ("Save
$120 a year") rather than verb + product ("Buy the plan").

**For our pipeline:** the CTA verb is locked per template per playbook
table. The extractor reads `template type → verb tier`, and refuses to
write "Click here" or "Learn more" anywhere. This is a code-enforceable
rule.

## 8. The Brain Audit — Sean D'Souza

D'Souza's *The Brain Audit* (2009) gave conversion copy the "seven bags"
model — what a buyer mentally checks before deciding:

1. **Problem** they have right now
2. **Solution** they're hoping for
3. **Target profile** ("am I the kind of person you serve?")
4. **Objections** they will raise next
5. **Testimonials** that pre-answer those objections
6. **Risk reversal** ("what if it doesn't work?")
7. **Uniqueness** ("why this one over the alternatives?")

**For video templates:** 15s budgets cover bags 1-2 only. 30s adds 3 +
4 implied. 60s case-study can hit all 7 if the source URL has the
material.

**Pipeline implication:** the extractor's per-template requirement
list comes from this. STAR (case-study) needs bags 1, 2, 5, 6, 7
present in the source. If the source page has no testimonials, the
extractor must either downgrade the template (60s case-study → 30s
hero-promo) or flag the gap.

## 9. The clarity-over-cleverness rule — Handley

Ann Handley's *Everybody Writes* drilled home: clarity wins every test.
Every. Time.

Specific rules:
- **Cut filler words ruthlessly.** "Just," "really," "very," "kind of,"
  "I think." Each one weakens the sentence.
- **Verbs > nouns.** "We help X" > "We are a helping company for X."
- **Active voice > passive.** "We build X" > "X is built by us."
- **Replace adjectives with measurements.** "Fast" → "loads in 200ms."
  "Tasty" → name the ingredients. "Trusted" → number of customers.
- **Read it aloud.** Whatever's awkward to say is awkward to read.

**For our pipeline:** the toneTuningWorker (already in extract-copy.mjs)
implements much of this — it strips "very", "simply", "just", and
"utilise". The playbook should expand this dictionary and document the
rule: "every adjective that can be replaced with a measurement, must
be."

## 10. The "scroll-stopping" hook — modern social-video patterns

Cross-referenced from TikTok / Reels / YouTube Shorts conversion
research (Bigger Cake, Buffer, Later case studies 2023-25):

**Hook patterns that hold the first 3 seconds:**

| Pattern | Example |
|---------|---------|
| Pattern interrupt | "Stop doing X." (where X is what they're doing right now) |
| Numbered promise | "3 things I wish I knew about Y." |
| Curiosity gap | "The reason your X is broken (and it's not what you think)." |
| Direct ID | "If you're a [identity], you need to see this." |
| Stakes statement | "Most people lose $X/year on this." |
| Question hook | "Are you doing this with your [X]?" |

**Pattern that fails:** ANY hook that opens with the brand name. Brand
goes in scene 2 at earliest unless the brand is itself the hook (Apple).

**For our pipeline:** social-reel-15s and ecommerce-social-reel-15s
templates should default to one of these hook patterns. The extractor
picks based on source-URL signal — if the page leads with a stat, use
"Stakes statement"; if with a question, use "Question hook"; if with a
benefit, use "Numbered promise."

## 11. The conversion-copy rhythm rule — MarketingExperiments

Flint McGlaughlin's MECLABS research found that **rhythm beats
information density on landing pages.** Specifically:

- Lines of similar length feel boring. Vary.
- Lines of wildly different length feel chaotic. Vary within a band.
- Two-syllable words feel firm. One-syllable words feel terse.
  Three-syllable words feel formal. Mix.
- One short line in a paragraph of medium lines = the line that lands.

**For on-screen video text:** the rhythm rule says scene 1 should NOT
have lines of identical length. Hook (5 words) → headline (10 words) →
support (16 words) creates a visual cascade. Hook (8) → headline (8) →
support (8) feels like a wall.

**For our pipeline:** the per-line word caps are *upper bounds*, not
targets. The playbook should specify line-length variance — kicker
short, headline medium, support varied. The extractor should reject
beats where every line is identical length ±1 word.

## 12. The post-pandemic copy drift — what changed 2020-25

Patterns that emerged in modern digital copy in the last 5 years:

- **First-person plural is back.** "We built this for…" replaces "X is
  a tool for…" — humans selling to humans.
- **The single-sentence email opener.** Long intros lose. "Here's what
  changed this week" beats "I hope this finds you well."
- **The "you" first.** Replacing "I" with "you" in opening lines lifts
  email open-to-reply by ~30%.
- **The micro-CTA.** Instead of one big CTA, multiple smaller ones
  ("see the demo", "skim the docs", "talk to us"). Each removes
  friction for a different stage of awareness.

**For our pipeline:** the playbook should default to second-person
"you" hooks for kinetic-pop and warm-community templates, and
first-person plural "we" for documentary founder-stories. The CTA scene
remains single — videos can't host micro-CTAs the way emails can — but
the URL slot should be a *primary* destination, not a hub page.

## Modern-digital distillation — patterns to lift into the playbook

1. **VOC over brand-voice** — when a source page has first-person
   testimonials, prefer them over headings.
2. **4U headline test** — every H1 must hit 3/4 with ultra-specific
   non-negotiable.
3. **FAB inverted** — benefit-first body, mechanism second, feature
   last (or omitted at 30s).
4. **PASTOR for 60s briefs** — PAS + Story + Testimony + Offer +
   Response.
5. **Reading-speed word caps** — hook ≤7, headline ≤12, body ≤18.
   Code-enforced.
6. **5-second brand-on-screen rule** — every video.
7. **CTA verb tier table** — Tier 1 default; Tier 3 banned.
8. **Brain Audit gap-check** — STAR / case-study refuses to ship if
   testimony missing.
9. **Clarity dictionary** — strip filler words; replace adjectives
   with measurements.
10. **Hook pattern menu** — six patterns to pick between based on
    source signal.
11. **Rhythm rule** — varied line-length per scene; reject identical
    triples.
12. **Modern voice defaults** — second person for kinetic-pop; first
    plural for warm-community founder-mode.

## How this maps to HyperFrames per-line constraints

- **Hook (≤7 words)** — picked from the six-pattern menu, second
  person, ultra-specific.
- **Headline (≤12 words)** — passes 4U test, benefit-led.
- **Body (≤18 words)** — FAB-inverted, with measurement instead of
  adjective.
- **CTA** — Tier 1 verb + URL + reason. Tier 3 verbs raise lint
  errors.
- **Voice** — locked to vibe template. Filler-word dictionary applied
  by toneTuningWorker.

This research seeds Phase B's playbook's enforceable rules — most of
which the extract-copy.mjs upgrade in Phase D will implement
programmatically.
