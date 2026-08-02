# Script & Copy — Model Selection Playbook

> **Goal:** produce the best script and caption we can for a social-video ad or
> image post — and know what each level of quality costs per generation.
>
> This playbook is the **model-selection layer** that sits on top of Stage 3
> (`docs/skills/how-a-video-gets-made.md#stage-3`). It does NOT restate the
> craft methodology — Schwartz, Caples, BAB/AIDA, the 8-question rubric, the
> anti-pattern list all live there. Read Stage 3 first; this doc answers the
> question Stage 3 leaves open: *"which LLM actually does this well, and what
> does it cost?"*

## TL;DR

For short ad work (15-30s video script + image caption), even the practical
premium tier is **~$0.016 per generation**. For one-off ads the cost
difference between tiers is cents — the right call is usually the best model
that fits the latency you need. Drop down only for iteration loops or bulk
multi-language runs.

| Use case | Pick | Cost/script | Latency |
|---|---|---:|---:|
| **Hero ad / brand launch — practical top tier** | `anthropic:claude@opus-4.8` | $0.016 | 8s |
| **Value pick — near-top quality at half the price** | `anthropic:claude@sonnet-4.6` | $0.007 | 10s |
| **Fast iteration — cheapest practical option** | `openai:gpt@5.4` | $0.007 | 4s |
| **Absolute best quality, cost-no-object (rare)** | `anthropic:claude@fable-5` | $0.13 | 31s |

Anthropic dominates the top of the field for copywriting. **`anthropic:claude@opus-4.8`
is the recommended top tier** — tightest CTAs, strong brand-voice lifting, 8s
latency. Fable 5 produced slightly better output in the probe but at 8× the
cost; reserve it for one-off hero work where the marginal quality gain matters
more than the price. OpenAI's and Google's flagships were tested and did **not**
match Claude at this task — see "Models that underwhelmed" below.

The ladder is wired into `scripts/lib/runware-models.mjs` → `RECOMMENDED.text`.
Browse live with `npm run runware:models` then `pick text` (returns Opus 4.8
by default).

---

## The probe that produced this ladder

Eight models were probed on the **same** task on 2026-08-02: write a 20-second
TikTok script + Instagram caption for **Bin Sparkle Full Care** (a real
service on a real brand site). Every model got the identical prompt, including:

- The brand's actual tagline patterns and voice description (scraped from
  `binsparkle.nz`)
- The product facts (allowed to use only these — no invention)
- Ten explicit craft constraints (Caples question hook, no brand name in beat 1,
  concrete nouns only, no clichés, etc.)
- The deliverable spec (5-beat table + 3-paragraph caption)

The reference answer (written by the assistant following Stage 3) lives at
`videos/binsparkle/SCRIPT-fullcare.md` — that's the bar.

### Results, ranked

| Rank | Model | Cost | Latency | Quality | Why it placed here |
|---|---|---:|---:|---|---|
| 1 | `anthropic:claude@fable-5` | $0.130 | 31s | A+ | Best voice lift. Used Sarah's testimonial as on-screen proof (no other model did). Caption lifts "no lock-in, no awkward phone calls" verbatim. **Not the default pick — 8× Opus 4.8's cost for a marginal gain. Reserve for one-off hero work.** |
| 2 | `anthropic:claude@opus-4.8` | $0.016 | 8s | A | **Recommended top tier.** Tightest CTA ("Bin Sparkle. From fifty-five a month."). Best beat-4 payoff: "You don't touch it. You don't think about it. It just happens." |
| 3 | `anthropic:claude@sonnet-4.6` | $0.007 | 10s | A− | Curiosity hook variant ("What if your wheelie bin just… sorted itself?"). Caption has minor invention ("No hidden bits" — not on the site). |
| 4 | `google:gemini@3.1-pro` | $0.051 | 42s | B+ | Smart brand-voice lifting ("Three steps. *That's it.*") but 8× Opus's cost and 5× latency. Bad value. |
| 5 | `openai:gpt@5.4` | $0.007 | 4s | B+ | Solid conventional copy, fastest of all models. Doesn't lift brand voice as cleverly as Claude. |
| 6 | `google:gemini@3.5-flash` | $0.026 | 15s | B | Generic script ("Do you hate dragging…"). Caption strong. Disappointing at flagship tier. |
| 7 | `openai:gpt@5-mini` | $0.006 | 24s | B | Same cost as GPT-5.4, slower, slightly more verbose. |
| 8 | `openai:gpt@5.5` | $0.027 | 12s | B+ copy, **F** on constraints | Decent lines but **named Hamilton after being explicitly told not to** — constraint-following failure on a flagship is disqualifying. |

**Note on the recommendation vs. the ranking:** Fable 5 scored highest on
quality but isn't the default pick because the cost/quality curve bends hard
at the top — $0.13 vs $0.016 for a quality gap that's a margin, not a step.
Opus 4.8 is the smart default; reach for Fable 5 when one hero asset has to
be the best it can possibly be and the budget allows.

### Models that underwhelmed (and why)

- **`openai:gpt@5.5`** — flagship-tier pricing but missed an explicit
  constraint ("do NOT name Hamilton"). A flagship that ignores instructions
  is a liability for brand-controlled copy.
- **`google:gemini@3.5-flash`** and **`google:gemini@3.1-pro`** — generic
  hook patterns ("Do you hate…", "Who else hates…") that the rubric flags
  as weak. Gemini 3.1 Pro is also 8× the cost of equivalent-quality models.
- **`openai:gpt@5-mini`** — same price as GPT-5.4 on this task, slower. No
  reason to pick it over 5.4 for copywriting.

---

## Cost in real terms

A typical 20-second ad script + caption is **~3,000 input tokens + ~1,000
output tokens**. Per-generation cost across the ladder:

| Model | Per script | 5 iterations | 10 iterations |
|---|---:|---:|---:|
| `anthropic:claude@fable-5` | $0.13 | $0.65 | $1.30 |
| `anthropic:claude@opus-4.8` | $0.016 | $0.08 | $0.16 |
| `anthropic:claude@sonnet-4.6` | $0.007 | $0.035 | $0.07 |
| `openai:gpt@5.4` | $0.007 | $0.035 | $0.07 |

**Decision rule:** for one-off ads, default to Opus 4.8 ($0.016 is irrelevant
for a single deliverable and you get the practical top tier). For hero work
where the absolute best matters, reach for Fable 5. For iteration loops, drop
to Sonnet 4.6 — the savings compound across hundreds of generations.

Per-task costs come back live from the API via `includeCost: true` and are
tracked against `RUNWARE_DAILY_CAP` ($2 default). Check with
`npm run runware:usage`.

---

## The prompting pattern that gets good output

The probe used ONE prompt for all eight models. The Claude Fable 5 output
scored A+ **not because Fable 5 is magic, but because the prompt did three
specific things**. Reproduce them:

### 1. Brand context comes in VERBATIM, not paraphrased

Bad: *"Bin Sparkle is a friendly NZ bin-cleaning service."*
Good: *"Tagline pattern: short assertion + italic kicker. Examples on the
site: 'Stinky bins? We've got you, mate.' / 'Three steps. That's it.' /
'Plain answers. No fine print.' / 'Honest prices. No surprises.'"*

The model can't lift the brand's voice if it doesn't see the brand's actual
words. Always scrape the site first (`scripts/lib/scrape-page.mjs`) and paste
real taglines, real CTAs, real testimonials into the prompt.

### 2. Facts and constraints are separated and explicit

The prompt has two distinct blocks:

```
PRODUCT FACTS (use only these — do not invent):
- ...

CRAFT CONSTRAINTS (mandatory — outputs breaking these fail):
1. ...
2. ...
```

The "use only these — do not invent" line is what catches most models. The
probe's GPT-5.5 failure (inventing Hamilton) is exactly the failure mode
this guard exists for; Sonnet 4.6's "No hidden bits" invention shows even
Claude can slip on this — keep the line.

### 3. The deliverable format is pinned

The prompt ends with:

```
DELIVERABLES (return exactly these two, no preamble, no commentary):

=== VIDEO SCRIPT ===
Beat sheet table with columns: # | Voiceover | On-screen text

=== IMAGE POST ===
- On-image text (one short line, top-left placement)
- Caption (3 short paragraphs, ~50-60 words total, same angle as the video)
```

Without this, models wrap the answer in "Sure! Here's a script that…"
preamble, or skip the on-screen text, or write a 200-word caption. Pinning
the format is most of the quality lift.

The full reusable prompt template lives at the bottom of this doc
("Reusable prompt template").

---

## The iteration pattern — generate with one model, critique with another

A single generation is rarely the final. The probe data shows models have
**different blind spots**:

- Claude Fable 5: best overall but invented "One simple monthly plan" (it's
  not simple, it's the only plan)
- Claude Opus 4.8: tightest CTAs but didn't use the testimonial
- GPT-5.5: missed a constraint
- Sonnet 4.6: invented "No hidden bits"

A model reviewing **its own** output shares its blind spots. The fix:

1. **Generate** with the chosen tier (Fable 5 for hero, Opus 4.8 for daily)
2. **Critique** with a *different* family — Claude generates, GPT critiques
   (or vice versa). Pass the output + the 8-question rubric.
3. **Revise** with the original model, passing the critique back.

Cost for the loop: 1× generate + 1× critique + 1× revise ≈ 3× the
per-script cost. For Opus 4.8 that's ~$0.05 for a hero ad; for Sonnet 4.6
it's ~$0.02. Still trivial.

---

## The eight outputs, in full

These are the actual probe responses, lightly formatted. They're the
evidence behind the rankings above. Read them in order — the quality jump
from GPT-5.5 (#8) to Claude Fable 5 (#1) is visible line by line.

### #1 — `anthropic:claude@fable-5` ($0.130, 31s) — A+

**Video script:**

| # | Voiceover | On-screen text |
|---|---|---|
| 1 | Still dragging your wheelie bin to the kerb in your pyjamas? | Kerb. Pyjamas. Wheelie bin. *Again?* |
| 2 | What if someone else did that — every single collection day? | Someone else could do this. |
| 3 | That's Bin Sparkle Full Care. Your bins go out, then come back in. Not by you. | **Bin Sparkle Full Care** — bins out, bins back in |
| 4 | And once a month, they get a proper wash. | "Smells like nothing now — magic!" — Sarah, real customer |
| 5 | Bin Sparkle. One simple monthly plan. From fifty-five a month. | **Bin Sparkle** · From $55 a month |

**Caption:**

> That walk to the kerb in your pyjamas? You can stop doing that.
>
> Full Care means we put your bins out every collection day, bring them back
> in after the truck, and give them a proper wash once a month.
>
> One simple monthly plan. No lock-in, no awkward phone calls. From
> fifty-five a month.

**Why it won:** Beat 4 uses the site testimonial as on-screen proof (only
model to do this). "Not by you" in beat 3 is the sharpest reveal phrasing.
Caption lifts "no lock-in, no awkward phone calls" verbatim. Beat-1
on-screen text uses the brand's own italic-kicker pattern (*Again?*).

### #2 — `anthropic:claude@opus-4.8` ($0.016, 8s) — A

**Video script:**

| # | Voiceover | On-screen text |
|---|---|---|
| 1 | Still running out in your pyjamas to drag the bin to the kerb? | Still doing this in your pyjamas? |
| 2 | Truck comes early, you forget, and it sits full for another week. | Miss the truck = a full week of stink |
| 3 | Bin Sparkle takes it out, brings it back in, and washes it once a month. | Bin Sparkle: out, back in, washed. |
| 4 | You don't touch it. You don't think about it. It just happens. | You never touch the bin again. |
| 5 | Bin Sparkle. From fifty-five a month. | Bin Sparkle — from $55/month |

**Caption:**

> You know that mad dash to the kerb in your pyjamas before the truck? Yeah,
> we're done with that.
>
> Bin Sparkle puts your wheelie bin out on collection day, brings it back in
> after the truck, and gives it a proper wash once a month.
>
> You don't lift a finger. From fifty-five a month, no lock-in, no fine
> print. *That's it.*

**Why #2:** Beat 4 ("You don't touch it. You don't think about it. It just
happens.") is the strongest payoff of any model. Beat 5 is the tightest CTA
— brand name + price, nothing else. Caption uses "*That's it.*" italic
kicker perfectly. Loses to Fable 5 only because it didn't find the
testimonial move.

### #3 — `anthropic:claude@sonnet-4.6` ($0.007, 10s) — A−

**Video script:**

| # | Voiceover | On-screen text |
|---|---|---|
| 1 | What if your wheelie bin just… sorted itself? | What if your bin just sorted itself? |
| 2 | Someone puts it out on collection day, brings it back in after the truck, and washes it once a month. | Out on collection day. Back in after the truck. Washed once a month. |
| 3 | That's the Full Care service from Bin Sparkle. | **Bin Sparkle** Full Care |
| 4 | You don't lift a finger. You don't even have to get out of your pyjamas. | You stay in your pyjamas. We handle the kerb. |
| 5 | From fifty-five a month. Check it out at binsparkle.nz | From $55/month — binsparkle.nz |

**Caption:**

> Bin Sparkle's Full Care means your wheelie bin goes out, comes back in,
> and gets a proper wash — without you touching it once.
>
> One bin from $55 a month. No lock-in. No hidden bits.
>
> Honestly? Your street clothes have never been so safe. 👉 binsparkle.nz

**Why #3:** Curiosity hook variant ("What if your wheelie bin just… sorted
itself?") is strong and uses "sorted" — a kiwi-ism on the site. Beat 4 ties
back to pyjamas nicely. Caption slips: "No hidden bits" isn't on the site
(minor rubric #6 violation), and the emoji + "street clothes" pun is
off-brand for the warm-casual voice.

### #4 — `google:gemini@3.1-pro` ($0.051, 42s) — B+

**Video script:**

| # | Voiceover | On-screen text |
|---|---|---|
| 1 | Who else hates dragging the wheelie bin to the kerb in their pyjamas? | Hate dragging bins in your pyjamas? |
| 2 | You remember the rubbish right as you get into bed. | Remembering the rubbish in bed. |
| 3 | Bin Sparkle does the job. We put your bins out, pull them back in after the truck, and wash them once a month. | Bin Sparkle: Out, in, and washed monthly. |
| 4 | Three steps. That's it. | Three steps. *That's it.* |
| 5 | Get Full Care at Bin Sparkle dot NZ. From fifty-five a month. | Get Full Care at binsparkle.nz. From $55/month. |

**Why #4:** Beat 4 directly lifts the site's "Three steps. *That's it.*"
pattern — smart. But the hook ("Who else hates…") is weaker than the
specific-scenario hooks above. At $0.051 and 42s latency, it's both slower
and pricier than the Claude options that beat it on quality.

### #5 — `openai:gpt@5.4` ($0.007, 4s) — B+

Solid, fast, conventional. Doesn't lift brand voice as cleverly as Claude
but hits every constraint. The reliable workhorse for fast iteration.

### #6 — `google:gemini@3.5-flash` ($0.026, 15s) — B

Generic script — "Do you hate dragging your dirty wheelie bin to the street
every week?" is the kind of hook the Stage 3 anti-patterns warn against.
Caption is strong (uses "*We've got you, mate.*" and "*Plain answers. No
fine print.*" verbatim).

### #7 — `openai:gpt@5-mini` ($0.006, 24s) — B

Same cost as GPT-5.4, slower, slightly more verbose. No reason to pick it
over 5.4 for copywriting.

### #8 — `openai:gpt@5.5` ($0.027, 12s) — B+ copy, F on constraints

Decent lines but the caption says **"Live in Hamilton now, expanding
NZ-wide"** despite the prompt explicitly saying "Do NOT name Hamilton." A
flagship that ignores an explicit constraint is a liability for
brand-controlled copy. The full output is in `scratch/probe-text-models-flagship.md`.

---

## Reusable prompt template

Copy-paste this, swap in the brand's real values. This is the exact prompt
shape that produced the A+ Fable 5 output above.

```
You are writing a [DURATION]-second [PLATFORM] script and a [PLATFORM]
caption for [BRAND]'s [PRODUCT/SERVICE].

BRAND CONTEXT (verbatim from [URL]):
- Tagline pattern: [describe the pattern with 3-4 real examples]
- Brand voice: [3-5 adjective cluster + what they position against]
- Testimonial on site: "[exact quote]" — [attributor]

PRODUCT FACTS (use only these — do not invent):
- [fact 1]
- [fact 2]
- [fact 3]
- [location/availability rules, including what NOT to mention]

AUDIENCE: [who] / [awareness level: unaware → most-aware] / [what they know
already vs what the script has to tell them]

CRAFT CONSTRAINTS (mandatory — outputs breaking these fail):
1. Video script: N beats, ~DURATION seconds when read aloud at TTS pace.
2. Each beat = VO line + on-screen text (sound-off viewing is the default).
3. Hook (beat 1) is [Caples archetype: news / question / story / command].
   First line must stop a scroll in 1.5 seconds. Brand name MUST NOT be in
   the hook.
4. Use concrete nouns ([2-3 examples]). NO abstractions ([2-3 anti-examples]).
5. Conversational register: contractions, plain words, second person.
6. NO clichés: "game-changing", "revolutionary", "introducing",
   "say goodbye to", "in a world where".
7. NO invented facts, stats, or claims. Stick to the product facts above.
8. Brand name lands at beat 3 (the reveal) and at the end (CTA).
9. Price goes last, whole ("From fifty-five a month", not "$55 only!").
10. Read each line aloud in your head — if you'd stumble, rewrite it.

DELIVERABLES (return exactly these two, no preamble, no commentary):

=== VIDEO SCRIPT ===
Beat sheet table with columns: # | Voiceover | On-screen text

=== IMAGE POST ===
- On-image text (one short line, top-left placement)
- Caption (3 short paragraphs, ~50-60 words total, same angle as the video)
```

The Stage 3 sub-docs name the choices that go in each slot:
- Awareness level → `docs/skills/how-a-video-gets-made.md` Job C (Schwartz)
- Framework (BAB/AIDA/PAS/etc.) → Stage 3 "frameworks" section
- Hook archetype → Stage 3 "Caples four hook archetypes"
- Tone coordinate → Stage 3 Job B (5-axis table)

---

## How to run a generation

The probe scripts (`scripts/_probe-text-models-*.mjs`) are throwaway but
show the exact API shape. For a real run:

1. Scrape the brand site (`scripts/lib/scrape-page.mjs`) — copy real
   taglines, testimonials, product facts.
2. Fill in the prompt template above.
3. Pick the tier from the ladder — `node scripts/lib/runware-models.mjs pick text [budget|balanced|premium]`.
   Default (no tier) is premium = Claude Opus 4.8.
4. Call the model via the existing `textInference` pattern in
   `scripts/lib/runware-vision.mjs` (it does the cost-guard bookkeeping).
5. Score the output against the Stage 3 8-question rubric. If any "no",
   revise that line surgically (not the whole script) and re-score.
6. For hero work, run the critique-with-different-model loop in the
   "Iteration pattern" section above.

Total cost for a finished hero script + caption with full iterate-critique
loop: **~$0.40** (Fable 5 × 3 calls). For daily work: **~$0.05** (Sonnet 4.6
× 3 calls, or single Opus 4.8 call + revise).

---

## Image-post specific notes

The probe had each model write BOTH a 20s video script AND a static image
caption. A few patterns held across models:

- **The image caption is the harder deliverable.** Video has 5 beats to
  build a case; the caption has to land the same angle in ~50 words.
  Models that did the caption well (Fable 5, Opus 4.8) reused the video's
  hook verbatim — repetition across surfaces is a feature.
- **On-image text wants 3-5 words, not a sentence.** The strongest on-image
  lines in the probe were noun-heavy staccato: "Kerb. Pyjamas. Wheelie bin.
  *Again?*" (Fable 5) and "Out. In. Washed." (multiple models).
- **No emojis unless the brand uses them.** Bin Sparkle's site has none.
  Sonnet 4.6 adding 👉 to the caption read off-brand. The default is no
  emoji unless the brand's own posts use them.

For static image posts, the workflow is identical to video — same prompt
template, same model ladder. The only swap is the deliverable spec.

---

## Open questions

- **Image generation for the post itself** isn't covered here. The on-image
  text + caption is the copywriter's job; turning it into an actual image
  post needs a separate model (probably a text-to-image one — see
  `docs/runware-models.md` → image-gen, currently unresearched).
- **Long-form (60s+, founder stories).** The probe was 20s. Long-form
  scripts may shift the model ranking — Opus 4.8's tightness may matter less
  when you have 60 seconds to fill. Re-probe if/when a long-form job lands.
- **DeepSeek and other budget alternatives.** `deepseek:v4-flash` was
  rejected as invalid AIR id in the initial probe; the correct id hasn't
  been chased. Worth probing if a true budget tier (sub-$0.005/script)
  becomes important for bulk volume.

---

## Reference

- **Stage 3 (the craft methodology this playbook sits on top of):**
  `docs/skills/how-a-video-gets-made.md#stage-3`
- **The reference script (the "what good looks like" bar):**
  `videos/binsparkle/SCRIPT-fullcare.md`
- **The model ladder + chooser:** `scripts/lib/runware-models.mjs` →
  `RECOMMENDED.text`. Browse with `npm run runware:models` → `pick text`.
- **Cost guard + spend reporter:** `npm run runware:usage`.
- **Raw probe outputs:** `scratch/probe-text-models.md`,
  `scratch/probe-text-models-claude.md`, `scratch/probe-text-models-flagship.md`.
- **Stage 3 craft research (deeper than this playbook):**
  `docs/copy-research/{brand-storytelling,direct-response,modern-digital,short-form-microcopy,video-screen}.md`
