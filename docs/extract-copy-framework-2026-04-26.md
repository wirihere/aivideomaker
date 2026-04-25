# `extract-copy.mjs --framework=<name>` — AI-assisted copy generation

Phase D of the copy supervisor. Extends `scripts/extract-copy.mjs` with a
brand-brief mode that calls Claude to generate playbook-compliant copy
without a source URL. The original URL-mode pipeline is unchanged — this
is additive only.

## When to use

| Mode | Input | Pipeline | API key |
| --- | --- | --- | --- |
| **URL mode** (existing) | `<url>` | scrape → summarize → beat → tone → tts-safety | none |
| **Framework mode** (new) | `--framework=<name> --brand="…"` | playbook-aware prompt → Claude → JSON | `ANTHROPIC_API_KEY` |

Use framework mode when you have a brand brief but no scrapeable site
yet (pre-launch, internal tool, content too thin to summarize).

## Supported frameworks

The 9 frameworks accepted by `--framework=` (matches the
`docs/copy-apply-2026-04-26.md` per-template table):

| Framework | Best for |
| --- | --- |
| `AIDA` | Cold-traffic ads. Hook → interest → desire → action. Always-works fallback. |
| `PAS` | Pain-led briefs (trades, wellness, problem-solver SaaS). |
| `FAB` | Product launches — benefit first, feature last. |
| `STAR` | Case studies — situation, task, action, measurable result. |
| `BAB` | Transformation briefs with a measurable delta. |
| `Heros-Journey` | Founder stories with a first-person origin event. |
| `Transformation` | Before-after with sensory state changes. |
| `Q-Payoff` | FAQ / pricing-led pages with question-shaped content. |
| `Sensory` | Hospitality / wellness, mood-led atmosphere hook. |

## Flags

| Flag | Default | Notes |
| --- | --- | --- |
| `--framework=<name>` | — | Required. One of the 9 above. |
| `--brand="<line>"` | — | Required. One-line brief, min 8 chars. |
| `--vibe=<vibe>` | `kinetic-pop` | One of `warm-community`, `kinetic-pop`, `documentary`, `quiet-premium`. |
| `--duration=<sec>` | `30` | One of 15, 20, 30, 45, 60. Sets the narration word band + beat count. |
| `--model=<id>` | `claude-sonnet-4-6` | Override the model. |
| `--temperature=<n>` | `0.4` | Creative-but-stable. Range 0.0–1.0. |
| `--out=<path>` | — | Write JSON to this path instead of stdout. |
| `--dry-run` | — | Print the prompt, do not call the API. |
| `--name=<slug>` | derived | Override the slug in the output JSON. |

## Quick start

```bash
# 1. Dry-run to preview the prompt (no API call, no key needed):
node scripts/extract-copy.mjs --framework=AIDA \
  --brand="Local cafe with rotating brunch menu, walk-up only, weekends busiest" \
  --dry-run

# 2. Real call (requires ANTHROPIC_API_KEY):
export ANTHROPIC_API_KEY=sk-ant-...
node scripts/extract-copy.mjs --framework=AIDA \
  --brand="Local cafe with rotating brunch menu, walk-up only, weekends busiest"

# 3. Save to a file:
node scripts/extract-copy.mjs --framework=STAR \
  --brand="Studio North gave their ops team back Friday nights" \
  --vibe=documentary --duration=60 \
  --out=compositions/studionorth.copy.json
```

The `copy:gen` npm script is wired for convenience:

```bash
npm run copy:gen -- --framework=PAS --brand="…" --vibe=kinetic-pop
```

## Output shape

Drop-in compatible with the URL-mode `<slug>.copy.json` document. Adds
two playbook fields (`bigIdea`, `earnedWord`) and replaces `url` with
`framework` / `vibe`.

```jsonc
{
  "slug": "local-cafe-brunch",
  "framework": "AIDA",
  "vibe": "kinetic-pop",
  "duration": 30,
  "bigIdea": "Your Saturday brunch, walk in and find the menu changed.",
  "earnedWord": "Saturday",
  "narration": "Saturdays are loud. The menu's never the same twice. ...",
  "beats": [
    { "kicker": "THIS WEEKEND", "headline": "A new brunch menu every Saturday.", "body": "Walk in. Order at the counter. Sit anywhere." },
    { "kicker": "THE DRAW", "headline": "Counter coffee, kitchen-led plates.", "body": "Eight dishes, six rotate, two stay." },
    { "kicker": "RIGHT NOW", "headline": "Two seats by the window, still warm.", "body": "Saturday peaks at half-ten. Worth the wait." },
    { "kicker": "GO", "headline": "Open Saturday from eight.", "body": "Walk-up only. No bookings, no waiting list." }
  ],
  "cta": {
    "verb": "Visit Saturday",
    "url": "yourcafe.example.com",
    "tagline": "Walk in by ten — the good seats go first."
  },
  "meta": {
    "generatedAt": "2026-04-26",
    "wordCount": 78,
    "beatCount": 4,
    "sourcedFrom": { "brief": true, "framework": "AIDA" }
  }
}
```

## Error contract

| Condition | Exit code | Message |
| --- | --- | --- |
| Bad `--framework` value | `1` | Lists the 9 valid choices. |
| Missing or short `--brand` | `1` | Shows a concrete example. |
| Unknown `--vibe` | `1` | Lists the 4 valid vibes. |
| Unknown `--duration` | `1` | Lists 15/20/30/45/60. |
| `ANTHROPIC_API_KEY` missing | `1` | Tells the user how to set it (or use `--dry-run`). |
| API non-200 | `1` | Prints status + first 600 chars of body. |
| API JSON malformed | `1` | Prints first 600 chars of returned text for debugging. |

## How the prompt is built

`docs/copy-playbook.md` is read at runtime and embedded in the prompt.
The framework rules are NOT hard-coded inside the script — if the
playbook changes, this script picks up the change on the next call.

The prompt has six blocks:

1. **Role line** — "you are HyperFrames' copy supervisor".
2. **Inputs** — framework, vibe, duration, slug, narration target, brand brief.
3. **Hard constraints** — word caps, banned phrases/jargon, Tier 1 verb-first
   CTA rule, no-Māori rule, kicker rules.
4. **Output schema** — strict JSON, no prose, no markdown fences.
5. **Embedded playbook** — full text of `docs/copy-playbook.md` so
   sections 2 (frameworks), 4 (per-line), 6 (vibes), 9 (lint) are all
   in scope without re-stating them.
6. **Closer** — "JSON only. No commentary."

## API call shape

Direct REST `POST https://api.anthropic.com/v1/messages` (no SDK
import — `@anthropic-ai/claude-agent-sdk` is for agentic loops, not
single-shot generation).

```js
fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  }),
});
```

The script then strips any markdown fences the model added, finds the
first `{` and last `}` in the text, parses the JSON, and shape-fixes
missing fields (`meta.wordCount`, `meta.generatedAt`) before returning.

## Why no caching

Each brand brief is unique — the cache hit-rate would be near zero and
the failure mode (returning stale copy under a similar brief) is worse
than the cost of a single API call. The script intentionally does NOT
write to `assets/.cache/`.

## See also

- `docs/copy-playbook.md` — source of truth for framework rules.
- `docs/copy-apply-2026-04-26.md` — per-template framework table.
- `scripts/extract-copy.mjs` — the script.
- `LEARNINGS.md` — the no-invented-facts and no-Māori-in-narration rules
  that the prompt enforces.
