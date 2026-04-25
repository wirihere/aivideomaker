# Short-Form + Microcopy — Research Notes

> Worker focus: the word-by-word craft of short copy. 5-word hooks,
> 2-word CTAs, the "earned word" rule. References: Twitter copy
> patterns, Loom video copy, Slack onboarding, headline databases
> (Boron Letters, Jacky and Cooper).

## Sources mined

- **Twitter/X copy patterns** — high-performing brand and personal
  account templates 2018-2025; threads as the per-tweet headline
  unit; pull-quote analytics.
- **Loom** — in-product video copy, replay-link copy, "watch in 90s"
  patterns.
- **Slack** — onboarding flows, app-launch microcopy, channel
  descriptions.
- **Linear / Notion / Figma** — modern SaaS empty-state and tooltip
  copy.
- **Mailchimp microcopy library** — error messages, success messages,
  empty-state encouragement.
- **The Boron Letters** (Halbert) revisited from a microcopy lens.
- **Headline databases**: BlogAbout (HubSpot), CoSchedule Headline
  Studio templates, Jonathan & Cooper Glassman headline catalogues
  (referenced via copy-craft trade press).
- Supporting: Kinneret Yifrah *Microcopy: The Complete Guide* (2017);
  Torrey Podmajersky *Strategic Writing for UX* (2019).

## What "short-form / microcopy" means for video

When the brief is 15s, every word fights for room. There is no scene
where you can be casually verbose. This research isolates the
word-level craft — picking the *right* word, in the *right* slot,
because at this scale the wrong word is the whole video's failure.

The patterns below are tested at the unit-of-language level: the
3-word hook, the 2-word CTA, the 1-word emphasis. They are the layer
beneath the framework choices.

## 1. The "earned word" rule revisited at the word level

From the previous research (video-screen.md): every video should teach
one word. At the microcopy layer, **every line should hinge on one
word, too.**

For each line:
- The headline-line word is the *promise* word.
- The body-line word is the *mechanism* word.
- The kicker-line word is the *category* word.
- The CTA-line word is the *action* word.

**Rule:** if the line's hinge word is interchangeable with three other
words (e.g. "fast / quick / rapid / speedy"), the line is not yet
written. Find the specific word the brand earned.

**For our pipeline:** the playbook should add a "hinge-word check" to
the lint rule. Every slot's value must contain at least one
non-substitutable word — a number, a named outcome, a brand verb, an
unusual adjective. If every word can be swapped for a synonym, the line
is filler.

## 2. The 5-word hook — Twitter / Loom patterns

Cross-referenced from high-performing Twitter brand accounts (Notion,
Linear, Stripe, Vercel — pre-X-era and post-) and Loom replay-link
hooks: the highest-performing hook patterns are 3-5 words.

**The five-word hook templates:**

| Pattern | Example | Use for |
|---------|---------|---------|
| **Imperative + object** | "Stop checking your spam." | Trades / wellness |
| **Number + thing** | "Three lies about pricing." | SaaS / case-study |
| **Possessive + noun + adjective** | "Your Tuesday morning, finally yours." | Hospitality / wellness |
| **Negation** | "Don't buy this lawnmower." | Ecommerce contrarian |
| **One-syllable per word** | "Made by us. Sold here." | Trades / wellness |
| **Curiosity gap** | "What we got wrong." | Founder-story |
| **Ratio** | "1 sold every 3 minutes." | Ecommerce |

**The pattern that fails:** five words that include the brand name. The
brand name eats 1-2 of the 5 word slots and leaves no room for the
hook.

**For our pipeline:** the extractor should pick a hook pattern from
this menu based on the source URL signal. Ecommerce pages with stat
counters → "ratio" pattern. Founder pages with personal language →
"curiosity gap." Trades pages with safety messaging → "imperative +
object."

## 3. The 2-word CTA — landing-page and SaaS patterns

CTA buttons that test well across modern SaaS landing pages converge
on 2-word verb-noun pairs:

| Verb | Noun | Used by |
|------|------|---------|
| Try | free | Notion, Linear |
| Get | started | universal |
| Book | a call | Cal.com, Calendly |
| Read | docs | Stripe, Vercel |
| See | demo | Figma, Loom |
| Save | $X | retail |
| Join | waitlist | startup launch |
| Shop | now | retail |
| Watch | (replay) | Loom |
| Open | app | Slack, Linear |

**Three-word CTAs that consistently outperform:**

- "Try free for 14 days." — adds the duration as the trust signal.
- "Book a 10-minute call." — adds the duration as the friction signal.
- "Visit [brand].com today." — adds the recency as the urgency signal.

**Pattern that fails:** "Click here to learn more about our solutions."
12 words, three of which are filler ("Click here", "more about",
"our solutions"), and the verb is buried.

**For our pipeline:** the playbook's CTA verb table maps verb → preferred
2-3 word formulation. The extractor refuses CTAs that are >5 words.

## 4. The microcopy of empty states — Slack / Notion / Linear

Modern SaaS empty-state copy is the densest microcopy in any product.
Patterns:

- **One-line description.** "Your first message to the team." (Slack)
- **One-line invitation.** "Send a welcome." (Slack)
- **One verb-led action.** Single button with imperative verb.
- **Implicit second person.** No "you" required when the camera is
  pointed at "you" anyway.

**Example: Slack's #general channel empty state**
> "This is the very beginning of #general. ▸ Add a description"

In 14 words, Slack: anchors the moment ("very beginning"), invites
ownership ("Add a description"), and gives a verb-led CTA. No filler.

**For our pipeline:** body slots in our templates should adopt empty-state
discipline. Don't write a paragraph; write the single line that earns
the slot's right to exist.

## 5. The "every word fights for its place" rule — Halbert revisited

Halbert in the Boron Letters: "If a word doesn't earn its keep, kill it."
Apply to the microcopy of our slots:

**Words that almost never earn their keep on a hero scene:**
- "Just" (almost always filler — "we just want to help")
- "Really" (always filler — "we really care")
- "Very" (always filler — "very fast")
- "Simply" (always filler)
- "Solution" (corporate-speak; replace with the actual mechanism)
- "Innovative" (claim without proof)
- "World-class" (impossible to verify; meaningless)
- "Cutting-edge" (instant cliché)
- "Premium" (use only if it modifies a price; never as adjective)
- "Best-in-class" (instant cliché)
- "Leverage" / "Utilise" / "Synergy" / "Ecosystem" (corporate jargon)

**Words that almost always earn their keep:**
- Numbers (any specific number)
- Place names
- Verbs of motion (run, build, fix, ship, save)
- Sensory adjectives (warm, sharp, slow, bright)
- Time markers (today, this week, now, before, after)

**For our pipeline:** the toneTuningWorker already strips some of these
(leverage, utilise, simply, very). The playbook should expand the kill
list and make it canonical. Phase D should add the rest to the
extractor.

## 6. The single-syllable rule — speed under stress

Words read fastest when they are one syllable. A line of single-syllable
words feels urgent. A line of three-syllable words feels measured. A
line of mixed syllable counts feels rhythmic.

**Hook patterns by syllable count:**
- All one-syllable: feels urgent ("Stop. Look. Buy now.")
- All three-syllable: feels formal ("Considered. Crafted. Revolutionary.")
- Mixed: feels conversational ("We make things you'll love.")

**Pipeline application:** kinetic-pop hooks should bias toward
single-syllable words when possible. Quiet-premium can mix. Documentary
can use longer words for gravitas. The extractor doesn't need to count
syllables programmatically, but the playbook should give per-vibe
guidance.

## 7. The "show, don't tell" microcopy

Adapted from Sullivan's *Hey Whipple* down to the line level:

| Tells (weaker) | Shows (stronger) |
|----------------|------------------|
| "Easy to use" | "Three clicks. Done." |
| "Friendly support" | "Real humans. 9-minute reply." |
| "Trusted brand" | "12,500 customers. Year nine." |
| "High quality" | "Made in Christchurch. Built to last." |
| "Affordable" | "$49. No subscription." |

**Rule:** if a sentence contains an adjective the audience has heard
1000 times ("easy", "trusted", "fast"), replace the adjective with the
fact that *makes* the adjective true.

**For our pipeline:** the playbook codifies this as the "adjective →
measurement" rule. The extractor flags every adjective in the kill list
when it appears in the headline / body / CTA slot.

## 8. The micro-rhythm of three

Across copy traditions: groups of three feel complete. "Veni, vidi,
vici." "Liberty, equality, fraternity." "Stop, look, listen." "Just do
it" (3 words). "Go to market" (3 words). "Made in Italy" (3 words).

**Why three works:**
- Two feels like opposition (this vs. that).
- Three feels like progression (this, this, *and this*).
- Four feels like a list (one of many).

**Application to our templates:** the three-up benefit row pattern is
not coincidental — humans store three items as a complete set. Our
hero-promo, ecommerce-spotlight, and saas-product-tour all use 3-up
structures, and the *titles* in those slots should be 1-3 words each
(GIVE / ASK / SUPPORT in Kindred is a clean example).

**For our pipeline:** when a template has a 3-up row, the playbook
specifies the slot as "1-3 words, single concept" — not phrases, not
sentences. The extractor extracts three category labels from the
source page (h2 / list-item language) and maps them to slots.

## 9. The "I" / "we" / "you" calculus

| Pronoun | Effect | Use for |
|---------|--------|---------|
| **You / your** | Direct address; viewer is centre | Default for kinetic-pop, warm-community, ads |
| **We / us / our** | Shared in-group; relational | Founder voice, community brands |
| **I / my / me** | Single voice; testimonial | Pull-quotes, testimonials only |
| **They / them** | Third person; outside view | Documentary, case-study about a customer |
| **One / someone** | Generic; abstract | Almost never — feels stiff |

**The calculus:** in the first line, "you" outperforms "we" outperforms
"I" outperforms "they." Exceptions are template-specific:
testimonial-45s scene 2 (the quote) is the one place "I" leads.
documentary scenes lead with "they" or omit pronoun.

**For our pipeline:** the playbook locks pronoun defaults per vibe
template. The toneTuningWorker already implements partial logic
(documentary strips "you"); the playbook makes it complete.

## 10. The pull-quote pattern — testimonials and case-studies

The pull-quote is its own microcopy form. Best practice across modern
brand video:

**Pull-quote anatomy:**
- ≤22 words total
- One concrete moment (not a generalisation)
- One emotional shift (not just praise)
- Attributable to a *specific* named person + role

**Strong vs weak pull-quotes:**

| Weak (generic) | Strong (specific) |
|----------------|-------------------|
| "It's been a great experience." | "I closed three deals on the train ride home." |
| "They really care about customers." | "They called *me* when I'd missed an invoice — to check I was OK." |
| "Best decision we made this year." | "Six weeks in, our weekly admin time fell from 9 hours to 90 minutes." |

**Rule:** if the quote could be said about *any* product, it's not
strong enough. Strong quotes are non-substitutable.

**For our pipeline:** testimonial-45s and case-study-60s rely on this.
The playbook tells the extractor to *prefer* paragraph-level quotes
that name a specific moment over generic praise lines, even if the
generic line is shorter.

## 11. The number formatting rule

Numbers carry conversion impact, but only if formatted right:

- **Use digits, not words**, for numbers >= 10. ("12,500" not "twelve
  thousand five hundred.")
- **Use words for numbers <= 9** in narration, but digits on screen.
  ("Three", spoken; "3", written.)
- **Currency before number** in en-US ("$120"); after in
  en-NZ/AU ("$120 NZD" or "120 dollars").
- **Round numbers feel claimed; specific numbers feel observed.**
  "100 customers" sounds aspirational; "97 customers" sounds counted.
- **Percentage > absolute** when the audience doesn't know your scale.
  ("87% lift" beats "increased by 4,200" if the audience doesn't know
  your baseline.)

**For our pipeline:** the ttsSafetyWorker already spells out integers
≤12. The playbook adds: on-screen, prefer specific over round; in
narration, words for ≤12 and digits for >12.

## 12. Active-voice-by-default

The single highest-impact stylistic rule for short copy: active voice.
Subject does the verb does the object. "We built it." Not "It was
built by us."

**Why:** active voice is shorter, faster to read, more memorable. Every
test confirms it.

**Pipeline rule:** the extractor should reject sentences that are
passive in the headline or hook slots. Body slots may use passive
sparingly when the actor is unknown ("Made in Italy" — passive but
fine because the maker is implied).

## 13. The 50% rule — Halbert / Hopkins / every great copywriter

Cut half. Then cut half again. The line you end with is twice as good
as the line you started with.

**Workflow for the extractor:**

1. summarizeWorker gets candidate lines from the URL.
2. beatStructuringWorker picks one line per slot.
3. **NEW playbook step:** halve every line. If a body slot allows 18
   words, draft 36, then cut to 18. The compression is the quality.

**For phase D:** add a `compressionWorker` step between
beatStructuring and toneTuning. It targets the upper word cap and
forces deletion until the line fits.

## 14. The dictation test — Halbert

Halbert in the Boron Letters: "If you can't say it out loud without
stumbling, don't write it."

**Microcopy application:**
- Read every line aloud at video speed.
- Lines that need a pause to understand are too dense.
- Lines that have multiple clauses joined by "which" or "that" are
  almost always too dense.
- Lines with two pronouns ("you'll see your team's progress") slow
  reading; cut to one pronoun ("see your team progress").

**For our pipeline:** the playbook tells the extractor to prefer
single-clause sentences for body slots. Multi-clause sentences move to
the narration stream where the voice can pause.

## 15. The brand voice in 4 axes — for the unit level

From brand-storytelling.md, applied at the word level:

| Vibe | Word choice | Example slot replacements |
|------|-------------|---------------------------|
| **warm-community** | Plain, communal, sensory | "near", "we", "around the corner", "kitchen" |
| **kinetic-pop** | Punchy, declarative, energetic | "now", "today", "win", "fast", "big" |
| **documentary** | Considered, third-person, factual | "since", "after", "the work", "the people" |
| **quiet-premium** | Sparse, single-thought, restrained | "considered", "made", "quiet", no adjective stacks |

The vocabulary tables above are not exhaustive but they're the seeding
words the extractor's tone-tuner should bias toward when picking
between candidates from the source URL.

## Short-form / microcopy distillation — patterns to lift

1. **Hinge-word check** — every line has at least one non-substitutable
   word.
2. **5-word hook menu** — pattern table by template type.
3. **2-word CTA** + verb-noun pair.
4. **Empty-state discipline** — body lines write like Slack channel
   descriptions.
5. **Kill-word list** — "just / really / very / simply / leverage /
   utilise / world-class / innovative / cutting-edge / synergy /
   solutions / stakeholders / premium" + more.
6. **Single-syllable bias** for kinetic-pop hooks.
7. **Adjective → measurement** rule.
8. **Rhythm of three** for 3-up rows.
9. **Pronoun calculus** — pinned per template.
10. **Strong pull-quote = specific moment, not generic praise.**
11. **Number formatting rules** — digits ≥10, words ≤9, percentage
    over absolute.
12. **Active voice default**, passive only for "Made in" cases.
13. **The 50% rule** — extractor's compressionWorker halves every
    line.
14. **Dictation test** — prefer single-clause for body slots.
15. **Per-vibe vocabulary table** — tone-tuner biases word choice.

## How this maps to HyperFrames per-line constraints

- **Hook (≤7 words)** — 3-5 word patterns from menu; single-syllable
  bias for kinetic-pop; non-substitutable hinge word.
- **Headline (≤12 words)** — adjective-replaced-with-measurement;
  active voice; one clause; hinge word present.
- **Body (≤18 words)** — empty-state discipline; single-clause
  preferred; reason-why or measurement; pronoun matches template
  rule.
- **CTA** — 2-3 word verb-noun + optional duration / urgency; verb
  from Tier 1 list.
- **Kicker** — 1-3 words, category-defining, all caps.

This research is the unit-level layer beneath frameworks. It tells the
extractor *which words* fill the slot, after the framework has decided
*what* the slot says. Together with the other four research traditions,
it seeds Phase B's playbook with a complete top-to-bottom craft model:
framework → arc → slot → word.
