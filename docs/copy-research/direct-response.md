# Direct-Response Classics — Research Notes

> Worker focus: extract the durable frameworks that direct-response copywriting
> has used for ~100 years to move people from indifference to action. We are
> mining patterns the HyperFrames pipeline can apply per template, not retelling
> the history.

## Sources mined

- **Claude Hopkins** — *Scientific Advertising* (1923)
- **John Caples** — *How To Make Your Advertising Make Money* (1983);
  *Tested Advertising Methods* (1932/1997)
- **Gary Halbert** — *The Boron Letters* (1984/2013)
- **Eugene Schwartz** — *Breakthrough Advertising* (1966)
- **Dan Kennedy** — *Magnetic Marketing*; *The Ultimate Sales Letter* (2011)
- Supporting: David Ogilvy *Confessions* / *Ogilvy on Advertising*; Robert Collier
  *The Robert Collier Letter Book* (where the chains overlap)

## What "direct-response" means for video copy

Direct response = "this piece of communication has a single measurable
conversion goal, and every word fights for that goal." The viewer is
expected to *do something* — click, call, book, share. That mindset
forces the copy to earn each second. For 15–60s video templates, this
maps cleanly: every scene must move the viewer one step closer to the CTA,
or it is dead weight.

Hopkins' line "advertising is salesmanship in print" survives because
sales conversations have a rhythm: get attention, build interest, close.
Video copy follows the same arc — just at higher speed, with less room
to drift.

## 1. AIDA — Attention, Interest, Desire, Action

Origin: attributed to E. St. Elmo Lewis (~1898), refined by Caples.

The oldest framework still in use. Maps to a 4-beat video naturally:

| Beat | Job | HyperFrames slot |
|------|-----|------------------|
| **A**ttention | Stop the scroll. Pattern interrupt, big claim, or contradiction. | Scene 1 hook (≤3s) |
| **I**nterest  | Tell them why it's relevant to *them* specifically. | Scene 2 setup |
| **D**esire    | Show the outcome they want. Make them imagine using it. | Scene 3 proof / benefit |
| **A**ction    | Tell them exactly what to do, with the verb first. | Scene 4 CTA |

**Caples' key insight:** Interest dies if the headline doesn't pre-promise
the desire. So the headline (scene 1 H1) must already telegraph the payoff.
Caples' famous "They Laughed When I Sat Down at the Piano…" works because
"laughed → played" is the *desire* compressed into the *attention* line.

**For our pipeline:** AIDA is the default for hero-promo, social-reel,
product-launch — any "convert a cold viewer in 15-30s" template.

## 2. PAS — Problem, Agitate, Solve

Origin: Dan Kennedy formalised it; older roots in Hopkins' "Hopkins Tested
Method."

The most reliable framework when the audience already feels a pain. Three
beats, deliberately uncomfortable in the middle:

1. **Problem** — name the pain in their language. "Your Tuesday morning
   feels like Wednesday afternoon."
2. **Agitate** — twist the knife. Show the cost of *not* solving. Specific
   imagery beats abstract claims.
3. **Solve** — collapse the tension with the product. The relief is the
   close.

**Kennedy's rule:** the agitation must use *their* words, not yours. If
your audience says "burnt out," don't write "experiencing diminished
productivity." This is voice-of-customer fed forward.

**For our pipeline:** PAS is the bedrock for trades-service-callout (busted
pipe → leak getting worse → call now), wellness-clinic-trust (recurring
pain → losing hours → here's the protocol), and ecommerce ads with a
clear pain trigger.

## 3. BAB — Before, After, Bridge

Origin: variant of PAS popularised in modern copywriting blogs; lineage
back to Hopkins' "Reason-Why" advertising and Halbert's "you have a problem
and I have the answer" letters.

Best when the transformation IS the product:

1. **Before** — your current state, with concrete sensory detail.
2. **After** — your future state, equally concrete.
3. **Bridge** — the product/service is the only thing that gets you from
   one to the other.

**Halbert's rule** (from the Boron Letters): the Before must be a movie,
not an essay. "You wake up at 3am wondering if the deal closed" is a
movie. "Stress about deals" is an essay.

**For our pipeline:** BAB is the default for before-after-20s,
trades-before-after-30s, and wellness-fitness-transformation-30s. It is
also the secondary framework when STAR (case-study) lacks a measurable
"after" stat.

## 4. The 5 Levels of Awareness — Schwartz

From *Breakthrough Advertising*. The most useful framework Schwartz gave
us: every prospect sits at one of five levels relative to your offer.
Your copy must meet them where they are.

| Level | They know… | Your headline must… |
|-------|-----------|---------------------|
| **1. Unaware** | Nothing about the problem | Open with an emotional hook or story (not the product) |
| **2. Problem-aware** | They have a pain, no idea about solutions | Lead with the pain: "Tired of X?" |
| **3. Solution-aware** | A category exists, not your brand | Lead with the differentiator: "The only Y that does Z" |
| **4. Product-aware** | Know your brand, haven't bought | Lead with proof / offer: stats, reviews, urgency |
| **5. Most aware** | Know your brand, ready | Lead with the offer / price / "ready when you are" |

**Why this matters for video:** the SAME product needs different first
scenes for cold (unaware) vs. retargeted (most-aware) audiences. A
hero-promo built for level-2 will fail to convert level-4. The structural
template stays the same — only the hook changes.

**For our pipeline:** the playbook should let `--framework=` accept an
awareness modifier (e.g. `PAS-aware-2`, `FAB-aware-4`) so the extractor
picks the right opening beat from the source URL.

## 5. Mass Desire — Schwartz

Schwartz: "Copy cannot create desire for a product. It can only take the
hopes, dreams, fears, and desires that already exist in the hearts of
millions of people, and *focus* those already-existing desires onto a
particular product."

Implication for video: the headline doesn't *create* a feeling — it picks
up a feeling the viewer already carries (longing, frustration, ambition,
relief) and bolts the brand to it. The HyperFrames extractor's job is to
find which mass desire the source page is signalling, not to invent one.

**Three mass desires every brief sits inside:**

- **Survival / safety** — "Don't lose your house," "Sleep through the
  night," "Stop the leak before it flares."
- **Status / belonging** — "What kind of person buys X," "Be seen on Y
  street," "Join the club."
- **Time / freedom** — "Get your weekends back," "Leave the office at 5,"
  "Less admin, more work that matters."

Most templates land naturally on one of these axes. Trades = survival
(trust + urgency). SaaS = freedom (time saved). Wellness = survival
(health) crossed with status (the kind of person who books a clinic).
E-commerce = status or freedom depending on the product. Real estate =
status + safety. Restaurant = belonging.

The kicker copy ("WHO WE ARE", "THE OUTCOME") should reflect the dominant
mass desire of the brief, not be generic.

## 6. The Headline Tests — Caples & Halbert

Caples ran A/B tests on print headlines for decades. His findings still
apply word-for-word to video Scene-1 H1s:

- **Self-interest beats clever.** "How to lose 10kg by July" outsells "A
  bold new way of thinking about weight." Always.
- **News beats restatement.** "Introducing the X" or "New: Y" outperforms
  "We've always made the best Y."
- **Specificity beats generality.** "62% less admin time" beats "save
  time on admin."
- **Numbers in the headline boost CTR.** Two-digit > one-digit > word.
- **Question headlines work IF the question matches the prospect's
  internal monologue** ("Do you make these mistakes in English?").

Halbert added: **the AIDA hook is the headline; the headline is the ad.**
80% of the impact lives in the first 7 words. If your video's first
on-screen line is forgettable, nothing later will save it.

## 7. The Halbert "Greased Slide"

From the Boron Letters: every sentence's job is to make the reader read
the *next* sentence. Apply to video: every scene's job is to make the
viewer not skip the next scene. If the scene-1-to-scene-2 transition is
weak, the rest of the timeline doesn't matter.

**Greased slide tactic for video:** end each scene one beat before the
viewer has finished processing it. The rhythmic "huh? wait—" is what
holds attention. We see this in good kinetic-pop work: hook (3s, ends
with a single emphasized word), reveal (5s, ends mid-thought), proof (5s,
ends with the number rising), CTA (2s).

## 8. The "Reason-Why" Body Copy — Hopkins

Hopkins' core idea: **claims without specific reasons feel like marketing;
claims with specific reasons feel like reporting.** "Cleanest beer" is
claim. "Brewed in glass-lined enamel tanks because steel taints the
flavour" is reason. (His Schlitz campaign — same brewing process every
brewery used; he just *told the story* and Schlitz went from #5 to #1.)

For HyperFrames body lines (≤18 words): never just claim. Always include
ONE concrete mechanism. "Faster checkout" → "Faster checkout — three
fields, one tap." "Better support" → "Better support — humans answer in
under 9 minutes."

If the source URL doesn't have the reason-why, the extractor must refuse
to write the line, not invent it (LEARNINGS §4).

## 9. The "You" Test — Kennedy

Read the copy out loud. If "you" / "your" appears in the first 7 words
and again in every paragraph, the reader feels addressed. If "we" / "our"
dominates, the brand sounds inward-facing.

**Direct-response default:** second person, present tense, active voice.
"You'll see…", "You stop the leak before it spreads," "Your team gets
their evenings back." Even for B2B.

**Exceptions:** documentary-vibe templates (case-study, founder-story)
move to third person — "She built it after her mother…" — because the
weight of an outside narrator is the point.

## 10. The Long Copy / Short Copy Decision

Halbert and Hopkins agreed: long copy beats short copy whenever the
purchase is considered (cars, B2B SaaS, real estate). Short copy beats
long copy whenever the purchase is impulsive (consumer apps, quick-serve
food, fashion).

For our 15s/30s/45s/60s template lengths:

- **15s** — single mass desire, single hook, single CTA. Cannot afford a
  reason-why beat. Pure attention/desire/action — interest is implied.
- **30s** — fits a full PAS or AIDA. Room for one reason-why line.
- **45s** — testimonial / quote-led arc. Room for setup → quote → outcome
  → name → CTA.
- **60s** — full case-study arc. Room for STAR + a quote + a CTA. Numbers
  carry the weight in the middle third.

## 11. Halbert's "A-pile / B-pile" rule

In direct mail, the recipient sorts envelopes into A (open this) and B
(throw away). Your hook decides the pile. The video scroll equivalent is
the first 0.8 seconds — before the viewer's thumb commits.

Implications for scene-1:
- **Visual + hook word are co-equal.** A great hook on a boring shot
  fails. A boring hook on a great shot fails. Both must hit.
- **The hook word is one of: the pain word, the desire word, or the
  brand-defining contradiction.**
- **Avoid neutral verbs** ("Discover", "Learn", "Find out") in the hook.
  Save them for the CTA. Hook verbs are sharper: "Stop", "Get", "Skip",
  "Quit", "Build", "Win".

## 12. Kennedy's "Single, simple, clear" close rule

Every CTA must answer three questions in the viewer's head, simultaneously,
in 2-4 seconds:

- **What do I do?** (the verb — "Visit", "Book", "Try")
- **Where do I do it?** (the URL or shop name)
- **Why now and not later?** (the offer / urgency / first-timer benefit)

If a CTA scene only answers two of three, scroll wins. If it tries to
answer four (multiple verbs, multiple URLs, list of features), confusion
wins. **One verb, one place, one reason.**

## Direct-response distillation — the patterns we'll lift into the playbook

1. **AIDA** = default 4-beat structure for hero-promo / social-reel /
   product-launch.
2. **PAS** = default for trades, wellness clinics, "fix this pain" briefs.
3. **BAB** = default for before-after, transformation, fitness verticals.
4. **5 Levels of Awareness** = picks the *opening beat* for the chosen
   framework based on the source URL's signal.
5. **Mass Desire** = chooses which *category* of headline to write
   (survival / status / freedom).
6. **Reason-Why body copy** = body lines must carry one specific mechanism,
   never a bare claim.
7. **The "You" test** = direct-response templates lock to 2nd person.
8. **The greased-slide rule** = scene transitions must end on tension.
9. **One verb, one place, one reason** = every CTA scene's three slots.
10. **Specificity beats generality, every time.** Numbers, named places,
    real time-frames > "fast", "premium", "trusted".

## How this maps to HyperFrames per-line constraints

- **Hook (≤7 words)** — Schwartz's mass desire + Caples' specificity:
  "Tired of slow checkouts?" / "Tuesday morning, finally yours."
- **Headline (≤12 words)** — Caples' "self-interest + concrete benefit":
  "Cut admin time by 62% — without changing your stack."
- **Body (≤18 words)** — Hopkins' reason-why: claim + mechanism, single
  idea per line.
- **CTA (verb-first)** — Kennedy's three answers: "Book a 10-minute call
  → studionorth.co." Never "Click here." Never "Learn more."

This research seeds Phase B's playbook. Frameworks PAS, BAB, AIDA, and
the awareness-modifier are the load-bearing patterns that the extractor
will need to pick between based on the source URL.
