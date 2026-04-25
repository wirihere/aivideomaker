# Brand Storytelling + Cinematic Copy — Research Notes

> Worker focus: extract the patterns from the brand-side / cinematic copy
> tradition — the lineage that holds the audience's attention with story
> rather than direct sales pressure. Pulls from agency-bred craft, not
> mail-order tested response.

## Sources mined

- **David Ogilvy** — *Confessions of an Advertising Man* (1963); *Ogilvy
  on Advertising* (1983)
- **Luke Sullivan** — *Hey Whipple, Squeeze This: The Classic Guide to
  Creating Great Ads* (4th ed., 2012)
- **George Tannenbaum / Sasson** — *MadMen Unbuttoned* and similar
  craft-of-headline writing in trade press
- **Teresa Iezzi** — *The Idea Writers* (2010, on copywriting in the
  digital era)
- Supporting: Bill Bernbach (DDB) memos; Helmut Krone's "Lemon" / "Think
  Small" Volkswagen work; Wieden+Kennedy Nike doctrine; Apple's
  "Think Different" copy line.

## What "brand storytelling" means for video copy

Where direct-response asks "did they buy?", brand storytelling asks "did
they remember the brand and feel something true about it?" The two are
not opposed — Ogilvy ran direct-response *and* brand campaigns, and his
rule was "you cannot bore people into buying your product." But the
craft is different: brand copy carries a single Big Idea, lets the
visuals breathe, and treats every line as a candidate for the audience's
long-term memory.

For HyperFrames, this tradition gives us patterns for templates where
emotion outweighs urgency — testimonial, founder-story, case-study,
restaurant-mood, real-estate-agent-brand, wellness-spa-mood.

## 1. The Big Idea — Ogilvy

Ogilvy's most famous edict: "Unless your advertising contains a Big Idea,
it will pass like a ship in the night."

Operationally, a Big Idea is:
- **One** strategic insight — not three "messages."
- Compressible into a sentence the client can repeat back.
- Visualisable — you can see it before you read it.
- Surprising but inevitable — you nod and think "that's been true the
  whole time."

Examples Ogilvy treated as canonical:
- "At 60 miles an hour the loudest noise in the new Rolls-Royce comes
  from the electric clock." (Big Idea: Rolls-Royce engineering is so
  good the *clock* becomes the limiting factor.)
- "Only Dove is one-quarter moisturizing cream." (Big Idea: Dove is not
  soap. It's a different category.)

**For our pipeline:** every video should have ONE Big Idea, surfaced as
the kicker + hook + CTA-line trio. If the same idea isn't traceable
across those three slots, the video is fragmented. The extractor should
produce a `bigIdea` field that becomes the spine of the script.

**Big Idea template per vertical:**
- Hospitality: "[Place] is the [emotional space] of [neighbourhood]."
- SaaS: "Your [hard task] without [hated friction]."
- Real estate: "[Address] is [the way you want to live] you'll find."
- Wellness: "[Treatment/practice] for [recurring problem people endure]."
- Trades: "[Trades work] done [the way that protects the customer]."

## 2. The "Fact-but-poetic" line — DDB / Volkswagen

Bill Bernbach's school taught that the best brand lines are factual *and*
beautiful. The fact gives the line credibility; the rhythm gives it
memorability.

The classic VW Beetle ads — "Lemon." (one word; the car beneath had a
faulty glove-compartment chrome strip; the rest of the copy explained
the inspection rejecting it). The line was a *fact* — VW really had
rejected that car — and a *cultural pun* — "lemon" was American slang
for a bad car. Both meanings landed at once.

**Operational pattern:** a brand line that does double duty —
- (a) an industry-standard term used in the literal sense, and
- (b) a phrase that resonates emotionally with the brand promise.

Volkswagen, Apple ("Think Different" — grammatically wrong on purpose),
and Nike ("Just Do It" — declaration, not advice) all ride this trick.

**For our pipeline:** the closer line ("Just local, just helping" in
Kindred) wants this double duty. It's a fact (the org IS local) and a
philosophy (small-scale, no fanfare). The framework comment in our
templates should ask the extractor to look for this double-meaning when
producing closer copy.

## 3. The Narrative Arc — Sullivan

Luke Sullivan's *Hey Whipple* taught a generation of copywriters that
ads should feel like stories, not bulletpoints. His three-act condensed
ad arc:

| Act | Function | Length share |
|-----|----------|-------------|
| **Setup** | Anchor the world. One image, one fact. | First 25% |
| **Conflict / Reveal** | The thing that's not what you thought. | Middle 50% |
| **Resolution** | The brand emerges as the natural answer. | Final 25% |

**Sullivan's craft rules** (the ones that survive 12 years later):
- Don't open with the brand name. Open with the *interesting thing*.
- Lay the table; don't serve the meal first.
- The headline is the joke; the visual is the setup. Or vice versa —
  but never both. Redundant headline-visual pairs waste 50% of the frame.
- "Show, don't tell" applies to copy too. Whenever a line is about to
  *describe* a feeling, find the action that makes the viewer feel it.

**For our pipeline:** founder-story-60s and case-study-60s map directly
onto Sullivan's three-act structure. Hero-promo-30s gets a compressed
version (4 beats: setup-tease-prove-close).

## 4. Headline craft — the four types

Sullivan's working taxonomy of "headlines that aren't tired":

1. **The simple-truth headline.** A fact, plainly stated, that the
   audience didn't know. ("At 60 miles an hour…")
2. **The contradiction headline.** Two ideas the audience thought were
   opposed. ("Be a tough mother." — Subaru)
3. **The metaphor headline.** A specific image the brand can own.
   ("Get a Mac" / "I'm a Mac, I'm a PC.")
4. **The voice-of-brand headline.** A line the brand-as-character would
   actually say. (Innocent Drinks: "Made by us, drunk by you.")

**For our pipeline:** the playbook should give each template type a
default headline category. Hero-promo / launch → simple-truth or
contradiction. Founder-story / testimonial → voice-of-brand. Mood /
hospitality → metaphor.

## 5. Brand voice — making the brand a character

Iezzi's *The Idea Writers* observation: in the always-on era, brands
that survive are brands that talk like *someone* — not a committee.
Voice = a consistent character the audience can predict.

**Voice axes** (Iezzi-derived, useful for our 4 vibe templates):

| Axis | Endpoints | Maps to vibe template |
|------|-----------|----------------------|
| Warmth | Cool ↔ Warm | warm-community = Warm |
| Formality | Formal ↔ Casual | quiet-premium = Formal; kinetic-pop = Casual |
| Volume | Quiet ↔ Loud | quiet-premium = Quiet; kinetic-pop = Loud |
| Cleverness | Plain ↔ Witty | warm-community = Plain; kinetic-pop = Witty; documentary = Plain |

**Concrete voice mappings** (for the playbook):
- **warm-community** — "we, neighbour, near, kitchen, hands, around the
  corner." Avoids: jargon, hyperbole, exclamations.
- **kinetic-pop** — "you, now, big, fast, win, today." Avoids: hedges,
  long sentences, third person.
- **documentary** — "they, since, after, by 2025, the work, the people."
  Avoids: hype, second-person, exclamations.
- **quiet-premium** — single thoughts, no conjunctions. "Considered.
  Quiet. Made to stay." Avoids: lists of three, alliteration, slogans.

## 6. Apple keynote copy — the modern brand-storytelling reference

Apple's keynote scripts are perhaps the cleanest commercial brand-copy
artifact of the modern era. Patterns to lift:

- **One claim per slide.** Never two. The pause between is the rhythm.
- **The number is the headline, not the body.** "12 hours." Then,
  three seconds later: "Battery life." The number lands first; the
  category clarifies after — opposite of how amateurs write it.
- **The contradiction beat.** "Thinner. Yet stronger." "Smaller. Yet
  faster." The pause between is the *sell*.
- **Verbs that promise.** "Disappears", "tracks", "knows", "remembers."
  Never "supports", "enables", "facilitates."
- **The "and one more thing" trick.** A surprise in the last 10% that
  reframes the whole video. (For us: a final on-screen line that recasts
  the kicker. e.g. closer "Just local, just helping" in Kindred recasts
  the opener "From your kitchen table" — both lines are about the *scale*.)

**For our pipeline:** quiet-premium templates and product-launch should
adopt the Apple "number-first, category-second" body pattern when the
brief carries a numeric stat.

## 7. Nike — verb-led brand copy

Nike's W+K copy lineage is verb-led. "Just Do It" is the family motto;
every campaign descends from it. Patterns:

- **Imperative mood, second person.** "Run." "Don't stop." "Go for it."
- **One word can be the whole frame.** No verb-object pair needed. The
  visual carries the object.
- **The line is a *dare*, not a description.** It doesn't tell you what
  the product does — it tells you what *you* will do.
- **Counter-intuitive pairs.** "Find your greatness." "The greatness
  isn't in winning. It's in showing up." (London 2012 campaign.)

**For our pipeline:** kinetic-pop and trades-urgency templates lift
Nike's verb-imperative pattern for hooks and CTAs. The hook is a dare;
the CTA is the next dare.

## 8. Dollar Shave Club — internet-era copy that respects the viewer

DSC's launch video (~2012, written by founder Michael Dubin):
"Our blades are f***ing great." 90 seconds, $4,500 to make, $25M Series A
within months. What it taught:

- **Self-aware copy.** Acknowledge the viewer is being sold to. Don't
  pretend.
- **Concrete pricing in the first 30 seconds.** No coyness.
- **Comedy = trust shortcut.** A joke is a unit of intimacy.
- **The brand's voice is the founder's voice.** Polish kills it.

**For our pipeline:** founder-story and trades-trust-builder templates
benefit from this honesty. The closer should sound like the founder
talking, not a brand committee.

## 9. Squarespace / Mailchimp / Dropbox — onboarding video copy

Modern SaaS onboarding videos refined the pattern of "explain a product
in 90 seconds without sounding like a manual." Key tactics:

- **Frame the user's task before the product appears.** "You have a
  band. You have a portfolio. You need a website." Then Squarespace.
- **Show one thing at a time.** Resist the urge to demo every feature.
  Three features beats six. One outcome per scene.
- **The voiceover talks past the on-screen text.** They are not
  redundant. The VO carries narrative; the text carries the noun.
- **The CTA is always optional-feeling.** "If you want, here's where
  to start." Never aggressive — the demo is the sell.

**For our pipeline:** saas-product-tour, saas-feature-launch templates
should adopt the "VO and on-screen-text fight different jobs" rule. The
extractor should output two related but non-identical strings per beat:
the spoken line and the on-screen line.

## 10. The "earned" closing line — across all brand-storytelling

Every great brand video earns its closing line by the time it lands. The
closer is not announced — it arrives. The pattern: setup carries an
emotional charge → middle sustains it → closer collapses the charge into
a phrase the audience has been *almost* thinking the whole time.

Examples:
- *Apple, "1984"*: 60 seconds of dystopia → hammer thrown → "On January
  24th, Apple Computer will introduce Macintosh. And you'll see why
  1984 won't be like '1984'." The closer recasts the dystopian video as
  a *promise*.
- *Volkswagen, "Snow Plough"*: Driver gets to work in a blizzard while
  others struggle → "Have you ever wondered how the man who drives the
  snow plough drives to the snow plough? This one drives a Volkswagen."
- *John Lewis Christmas spots*: 90s of narrative → tagline ("Show them
  how much you love them this Christmas") that costs nothing if the
  story has earned it; means everything if it has.

**For our pipeline:** the CTA scene's spoken/on-screen line should
satisfy the "earned" test. If the closer could come at *any* point in
the video and still make sense, it isn't earned. Test: read the closer
without the previous beats. Does it feel hollow? Then it has been earned.

## 11. The Big Idea brief template — Ogilvy-derived

Ogilvy taught that you can't write copy until you've written a brief that
the writer can defend. For our extractor, this means producing an
intermediate `brief` object before the script:

```
{
  bigIdea:        "string — the one-sentence strategic insight",
  promise:        "string — what the viewer gets if they act",
  proof:          "string — the one fact that makes the promise believable",
  voice:          "warm-community | kinetic-pop | documentary | quiet-premium",
  audienceLevel:  "1-5 (Schwartz awareness)",
  massDesire:     "survival | status | freedom",
  closerEarn:     "string — what the closer compresses"
}
```

Every line of script should map back to one of those fields. If a line
maps to *none*, it's filler — cut it.

## Brand-storytelling distillation — patterns to lift into the playbook

1. **Big Idea** = mandatory; one strategic insight per video.
2. **Three-act narrative arc** = setup / conflict / resolution; sized
   to template length.
3. **Headline category** = simple-truth / contradiction / metaphor /
   voice-of-brand; pick per template type.
4. **Brand voice axes** = warmth / formality / volume / cleverness;
   each vibe template has fixed values.
5. **Number-first, category-second** body pattern (Apple).
6. **Verb-led imperative hooks** (Nike).
7. **Self-aware founder-voice closer** (DSC).
8. **VO ≠ on-screen-text** (SaaS onboarding) — they tell two different
   parts of the same story.
9. **Earned closer** = closer must compress a charge built earlier.
10. **Big Idea brief** = intermediate document the extractor produces
    before scripting.

## How this maps to HyperFrames per-line constraints

- **Hook** — voice-of-brand headline category for documentary; metaphor
  for hospitality/wellness; verb-imperative for kinetic-pop.
- **Headline** — simple-truth or contradiction; never both jobs in one
  line.
- **Body** — number-first when a stat exists; reason-why when not.
- **Closer** — must satisfy the "earned" test. Extractor flags closers
  that don't connect back to the kicker / hook.
- **Voice** — locked to vibe template (axis values fixed in the playbook).

This research seeds Phase B's playbook. Big Idea, three-act arc, and
voice-axes are the additions that turn direct-response patterns into
brand-aware copy — exactly what the Kindred render needed and didn't
have.
