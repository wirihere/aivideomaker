# Render Suggestions — Cross-Render Patterns

This is the improvement library. It distils recurring findings from `LEDGER.md`
into reusable rules of thumb. Append a section when a pattern shows up in two or
more renders. Keep entries short, sized (e.g. "+12% font" not "bigger font"), and
actionable (point at a template or token).

Structure:
- One H2 per pattern.
- Sub-bullets with the evidence (which renders surfaced it).
- A "next time" line that future runs can apply.

---

## When community-warm brand, prefer faq-quick at 30s over hero-promo

- _Placeholder until two renders confirm._ The brief speculates faq-quick reads
  punchier than hero-promo for community-tone brands at 30s. Verify on next run.
- Next time: when brand tone is `community-warm` and seconds=30, try faq-quick
  before hero-promo and compare verifier verdicts side-by-side.

## Watch for template seed-copy leakage

- _Initial entry._ Templates ship with placeholder strings ("HEADLINE", "BENEFIT",
  "Q1 / Q2 / Q3", etc.). When `applyCopyToTemplate()` doesn't cover an id, the
  seed string survives into the render and the audio narrates a different scene
  than the visuals show.
- Next time: the verifier flags `placeholder leakage` whenever visible text
  matches a known seed-copy string list — see `scripts/verify-render.mjs`'s
  `SEED_COPY_PATTERNS`. Add new patterns there as new templates ship.

## Brand name + URL must appear in at least one scene

- _Initial entry._ A render where the brand name (e.g. "Kindred") never reaches
  the screen reads as a generic stock video. Same for the canonical URL.
- Next time: verifier flags `brand fidelity` if `brandName` from copy.json
  doesn't appear in any per-second visible-text snapshot.
