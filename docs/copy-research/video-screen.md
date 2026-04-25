# Video + Screen-First Copy — Research Notes

> Worker focus: how words land WITH motion. The patterns that emerge when
> copy lives on screen — pacing per second, kicker-headline-body anatomy,
> the moment-to-moment economy of attention. References: Apple keynotes,
> Nike spots, Dollar Shave Club, Squarespace, Mailchimp, Dropbox onboarding.

## Sources mined

- **Apple keynote scripts** — Steve Jobs era and post-Jobs (2007-2025).
  Patterns from iPhone, iPad, MacBook, AirPods, Vision Pro launches.
- **Nike commercial library** — Wieden+Kennedy work, especially
  long-form (60-90s) hero spots: "Failure" (Jordan), "Find Your
  Greatness" (London 2012), "Dream Crazy" (Kaepernick 2018), "You
  Can't Stop Us" (2020).
- **Dollar Shave Club** — "Our Blades Are F***ing Great" (2012);
  follow-up films through 2018.
- **Squarespace** — Super Bowl spots (Lake Bell 2014, "Real Talk" with
  Adam Driver 2020, "Make It Real" 2021).
- **Mailchimp** — "Mailshrimp/Failchimps" 2017 SXSW campaign;
  "Behind the Brand" series.
- **Dropbox onboarding** — feature-launch videos (Paper, Capture, Dash)
  and acquisition-era animation.
- Supporting: Pixar's Story Rules (Emma Coats); Aaron Sorkin "intent and
  obstacle"; Lisa Cron *Story or Die* (2021).

## What "screen-first copy" means

Copy on screen is not the same craft as copy on paper. Three facts
re-shape the rules:

1. **The viewer is in motion.** Scrolling, walking, driving, half-watching.
2. **Time is the constraint.** A page can be re-read; a video plays once
   at the speed the editor chose.
3. **Words and visuals fight for attention.** They are not additive —
   they compete unless deliberately choreographed.

Every pattern below is a way to manage these three constraints.

## 1. The pacing-per-second budget

Field-tested on the kind of brand videos we render (15-60s, motion-heavy,
text-on-screen):

| Time | Words on screen | Words spoken | What can land |
|------|-----------------|--------------|---------------|
| 1s | ≤4 | ≤3 | Hook, brand chip, one image |
| 2s | ≤7 | ≤6 | A claim |
| 3s | ≤12 | ≤9 | A claim + a detail |
| 5s | ≤18 | ≤15 | A complete thought |
| 8s | ≤30 | ≤24 | A problem + setup |
| 12s | ≤42 | ≤36 | A small narrative beat |

**Speech rate:** TTS at default speed = ~3 words/second. Edge TTS at the
voice we use in this project sits around 2.8-3.2 wps. Reading rate on
screen for hero-sized text = ~4 words/second. So **on-screen text
*can* outrun narration**, but never beat the cadence of the music
underneath it.

**The 30s template budget:** narration = 60-90 words; on-screen text
across all scenes = 30-50 words. Most of the on-screen text lives in
hooks, headlines, and CTA — body lines should be sparing.

## 2. The kicker-headline-body anatomy

Best practice across modern brand video, derived empirically from Apple,
Nike, Squarespace, Mailchimp:

```
KICKER       — uppercase, accent colour, 1-3 words, 18px equivalent
              ↓ provides categorical context
HEADLINE     — display weight, 60-180px, 5-12 words
              ↓ provides the line that matters
BODY         — body weight, 28-40px, 1 sentence ≤18 words
              ↓ provides the supporting fact / mechanism
```

**Why this stack works:**
- The eye reads top-down and the kicker sets up the headline.
- The kicker is in tiny type but **emotional**: it tells the viewer
  *why* this scene exists ("THE PROBLEM", "THE OUTCOME", "FROM OUR
  CUSTOMERS").
- The headline is the *load-bearing* line. The video could lose the
  body and still work; could not lose the headline.
- The body justifies. It carries the reason-why. Often the only line
  that explains *how*.

**Apple's variant:** "[Number]. [Category]. [One-line thesis]." —
"30 hours. Battery life. The longest we've ever shipped." The kicker is
the number, the headline is the category, the body is the thesis. Kicker
*is* the data point.

**For our pipeline:** templates already use this anatomy. The playbook
should make the slot semantics explicit so the extractor populates them
correctly — kicker carries the *category*, headline carries the *claim*,
body carries the *reason*.

## 3. The "lockup" — Apple's signature transition

Apple keynote videos have a recurring rhythm: a long shot of the product
→ slow zoom → "lockup" — the product, the wordmark, and a one-line
descriptor settle together. The lockup is the *period* at the end of a
visual sentence.

**Anatomy of a lockup:**
- Brand wordmark, top-or-side
- Hero element (product, headline) centred
- One-line descriptor or number, beneath or beside
- Held for 1.0-1.5 seconds — long enough to be photographed, long
  enough to be a thumbnail

**For our pipeline:** every CTA scene wants to end on a lockup. The
playbook should define lockup = wordmark + URL + verb-led closer line,
held in final position for ≥1 second (no exit animation in the last
beat). Several of our templates already do this; the playbook
formalises it.

## 4. The Nike "verb + earned credit" pattern

Nike spots invariably resolve on a verb-led line that the viewer has
*earned* through 60-90 seconds of imagery. "Just Do It" works because
60 seconds of athletes failing and trying again has set up "Just" as
permission and "Do It" as the only path forward.

**Three structural traits:**

1. **The closer is a *command*, not a description.** Imperative mood.
   Second person implied.
2. **The closer is *short*.** "Just Do It" — 3 words. "Made for runners.
   Made by us." — 7 words. Compression is the point.
3. **The closer is *earned*.** The video's prior 80% has loaded the
   word with meaning. "Greatness" (London 2012) means nothing in
   isolation; means everything after a minute of amateur athletes.

**For our pipeline:** documentary and warm-community closers should
adopt this pattern when the brief carries a Big Idea worth earning.
Kinetic-pop closers are punchier, less earned (they don't have time)
but still verb-led.

## 5. The Dollar Shave Club rhythm — comedy-led B2C

DSC's debut ad is a master class in sustained tone. 90 seconds, ~140
words spoken (1.5 wps — slow on purpose), every line either:

- A claim ("Our blades are great")
- A joke that *justifies* the claim ("Are the blades any good? No. Our
  blades are f***ing great.")
- A self-aware aside that buys trust ("Stop forgetting to buy your
  blades every month.")

**Three patterns to lift:**

1. **The claim-and-undercut.** Make a corporate-sounding claim, then
   undercut it with self-awareness. The undercut is what makes the
   claim trustable.
2. **The "you" frame, not the "we" frame.** "Stop forgetting…" not "We
   help you remember…"
3. **The price-on-screen rule.** DSC's price ($1, $6, $9 tiers) was
   on screen for ~8 seconds — long enough to be photographed and
   shared. Confidence with price = confidence with product.

**For our pipeline:** trades-trust-builder, ecommerce-spotlight, and
SaaS-feature templates can lift the claim-and-undercut for their voice
when the source URL has an honest founder paragraph. Less appropriate
for documentary or quiet-premium.

## 6. Squarespace — the "user task before product" rule

Squarespace's commercials almost never lead with the product. They lead
with the user's situation:

- "You have a band. You have a portfolio. You have a story."
- "Whatever you do, do it real."
- "Make it real with Squarespace."

**Pattern:** scene 1 sets the user's identity. Scene 2 names the
product. Scene 3 shows the action. Scene 4 lockup.

**Why it works:** the viewer self-identifies before the brand asks for
attention. They've been told the video is *about them* before they're
told what to buy.

**For our pipeline:** founder-story-60s and warm-community hero-promos
benefit from this opening pattern. Hook should name the user's
identity ("If you run a small kitchen...", "For anyone who's tried
to..."). Brand chip arrives in scene 2.

## 7. Mailchimp — voice-first brand voice

Mailchimp's brand voice (mid-2010s peak) was the model for "small
business friendly without being twee." Patterns:

- **Sentences end mid-thought, then a kicker.** "Send beautiful emails.
  And actually have fun doing it."
- **The brand uses conversational filler when humans would.** "It's,
  like, the easiest thing." (Used sparingly. Not in everything.)
- **Jokes that the audience can predict are *good* — they signal
  shared culture.** Mailchimp's "Mailshrimp / Failchimps" SXSW campaign
  played on the idea that *everyone* mishears the brand name. The joke
  was that Mailchimp knew it.

**Pipeline implication:** the playbook should give kinetic-pop a permit
to use mid-sentence breaks and conversational asides in body lines
ONLY — not headlines, not CTAs. Quiet-premium and documentary cannot
use this register.

## 8. Dropbox onboarding — the "show one feature, then stop" rule

Dropbox's product-launch animations (Paper, Capture, Dash) hit one
feature each. They do NOT demo the full product. The structural choice:

- 0-5s: state the user's current friction
- 5-15s: show the new feature *resolving* that friction
- 15-25s: show one expansion ("And it works with the rest of your
  stack")
- 25-30s: CTA to learn more

**Lesson for our pipeline:** product-launch and saas-feature-launch
templates should resist the urge to cram three features in. **One
feature per launch video.** If the brief has three features, render
three videos, not one. The playbook should encode this as a hard rule.

## 9. The "voice over vs. on-screen text" choreography

Modern brand video uses VO and text as *separate channels*. They are
not redundant — they tell two halves of the same story. Best-in-class
patterns:

- **VO carries the through-line; text carries the noun.** VO says "the
  little engineering decisions add up"; text says "30 hour battery."
- **VO sets up the surprise; text delivers it.** VO says "you might
  not think this is possible"; text says "$0/month."
- **Text appears slightly *before* the VO references it.** ~150ms.
  This trains the eye to land on the text right as the voice
  validates it. Reverse order feels like sloppy ADR.

**For our pipeline:** the extract-copy.mjs output should produce a
narration string AND a beats array — they should describe the same
thought from different angles, not echo each other. The playbook's
"VO ≠ on-screen-text" rule is the diagnostic for whether copy is
modern.

**Anti-pattern:** narration that recites the on-screen text. This is
how amateur explainer videos read. The voice loses purpose because
the eye has already caught up. Avoid.

## 10. The "moment economy" — Pixar / Sorkin

Aaron Sorkin's screenwriting maxim: every scene should have an
*intent* and an *obstacle*. Same for video scenes. Pixar's Emma Coats
once shared 22 story rules; the relevant ones for brand video:

- "You admire a character for trying more than for their successes."
- "Story setups that you'd hate as a viewer, will probably also fail
  as a writer."
- "Trim the fat, then do it again."

**For 30-60s brand video, the version of "intent and obstacle" that
works:**

| Scene | Intent (what scene wants viewer to feel) | Obstacle (what's in the way) |
|-------|-----------------------------------------|------------------------------|
| Setup | "I should keep watching" | The setup line is the obstacle being introduced |
| Reveal | "Oh — that's the answer" | The brand's mechanism is the resolution |
| Proof | "I believe it" | The number / quote earns belief |
| CTA | "I should act" | The single-step CTA removes the last obstacle |

**For our pipeline:** every scene's `intent` and `obstacle` could be
a future field in the copy doc — explicit story scaffolding that the
extractor checks against the source URL. For now, the playbook
documents it as a per-template rubric to keep scenes from blurring.

## 11. The "earned word" rule

Across Apple, Nike, DSC, Squarespace: every video has a SINGLE word
the rest of the video is teaching. "Greatness" (Nike). "Different"
(Apple "Think Different"). "Real" (Squarespace "Make It Real").
"Great" (DSC).

**The earned word always:**
- Is short (1-2 syllables)
- Is plain (everyday word, not jargon)
- Lands in the closer
- Has been pre-loaded by the prior 80% of the video

**Test:** read your script. What's the one word the video is teaching?
If you can't name it, the video doesn't have one. Add one.

**For our pipeline:** the playbook should add an `earnedWord` field to
the copy doc. The extractor must identify which single word the brief
should teach (it usually appears 2-3× in the source URL, often in the
brand's own taglines or H1s). The CTA scene must include that word.

## 12. Vertical / portrait video — the new constraint

Field shift since ~2018: portrait video (1080×1920) demands different
copy patterns than landscape:

- **Less horizontal width = shorter line lengths.** Headlines that
  worked on landscape spill in portrait. The playbook word caps
  (≤12 for headline) are tuned for portrait specifically.
- **Eye anchors differently.** Portrait viewers' eyes drop to the
  centre-bottom (where their thumb is). Hooks should land top-half;
  CTAs land bottom-half.
- **Text-on-image is now expected.** Portrait video is often watched
  muted. On-screen text must carry the message even with sound off.
  Narration is supplementary, not primary.

**For our pipeline:** social-reel-15s, ecommerce-social-reel-15s,
hospitality-cafe-vibe-15s, before-after-20s are portrait. They
should default to "muted-readable" — every key claim must appear as
on-screen text, not just narration. The playbook should mark these
templates as "muted-friendly" and require an on-screen text
representation of every narration beat.

## 13. The "three-word rule" — modern social video

Tested across 10K+ TikTok/Reels videos by social-media analytics
firms (Buffer, Later, Influencer Marketing Hub): the highest-performing
hooks are 3-7 words. Three-word hooks dominate views; seven-word hooks
dominate completion rate.

**Three-word hooks that test well:**
- "Stop doing X."
- "X changed everything."
- "Don't buy X."
- "Y people lie."
- "Read this first."

**For our pipeline:** the playbook should permit (encourage) hooks of
3-5 words for kinetic-pop social-reels. The extractor's per-second
preset for 15s should bias to shorter hooks — currently the cap is 7,
but a 3-5 word hook on a fast template outperforms.

## Video / screen-first distillation — patterns to lift

1. **Pacing-per-second budget table** — locks word count to scene
   duration.
2. **Kicker-headline-body anatomy** — categorical / claim / reason.
3. **The lockup** — held final beat with wordmark + URL + closer.
4. **Verb-led closer + earned credit** (Nike).
5. **Claim-and-undercut** (DSC) — for trades / SaaS founder voice.
6. **User task before product** (Squarespace) — for warm-community
   hero-promos.
7. **One feature per launch video** (Dropbox).
8. **VO ≠ on-screen text** — they tell different parts of the same
   story.
9. **Intent + obstacle per scene** — every scene has both.
10. **Earned word rule** — every video teaches one word.
11. **Portrait = muted-readable** — on-screen text must be
    self-sufficient.
12. **Three-word hooks** allowed and encouraged for kinetic-pop social.

## How this maps to HyperFrames per-line constraints

- **Hook (≤7 words)** — three-word hooks fine on portrait reel; no
  brand-name in hook.
- **Headline (≤12 words)** — claim-led, sized for muted reading at
  1.0× speed.
- **Body (≤18 words)** — reason-why, varied length from hook (rhythm
  rule).
- **CTA** — verb-led, lockup-held, earned-word-bearing.
- **Narration ≠ on-screen text** — extractor produces both, distinct.
- **Earned word** — flagged in metadata, must appear in CTA scene.

This research seeds Phase B with the choreography rules — how words
land WITH motion. The next research worker (short-form / microcopy)
covers the unit-level word craft that fills these slots.
