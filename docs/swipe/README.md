# Copywriting swipe — what's in this directory

This is the artifact set that powers Stage 3's improvement loop (see `docs/skills/how-a-video-gets-made.md` Stage 3 — "The copywriting improvement loop").

## What lives here

| File | Purpose | When it gets updated |
|---|---|---|
| `<register>-hooks.md` | Proven opening lines, with attribution + technique | After a render where the user explicitly approves the hook |
| `<register>-bodies.md` | Proven body / closing / CTA lines | After a render where the user explicitly approves those lines |
| `rejected.md` | Lines that got cut, with the reason | After a render where the user calls a line generic / weak / off-tone / fabricated |

Per-brand canon files live alongside the brand's composition, NOT here:
- `compositions/<brand-slug>.canon.md`

## Schema for swipe entries

Every line gets logged with the same shape so the swipe is searchable + reviewable:

```markdown
### "There are three doors. Only one of them opens."
- **Render:** methodology-45s for Oraculum Institutum (2026-04-28)
- **Slot:** b0-promise (cold open)
- **Technique(s):** Caples question hook + Halbert specificity
- **Why it worked:** Three is concrete. "Only one opens" creates the unspoken
  question "which one?" — Sugarman slippery slide.
- **Reusable for:** any contemplative template that opens with a methodology / choice.
- **NOT reusable for:** kinetic-pop or warm-community — wrong tone coordinate.
```

## Schema for rejection entries

```markdown
### "Three steps. One truth at a time."
- **Render:** methodology-45s for Oraculum Institutum (2026-04-28)
- **Slot:** b4-outcome
- **Why cut:** Author-invented during template scaffolding — violates rule S14
  (no fabricated content lines). The brand never wrote this anywhere.
- **What replaced it:** "Just truth." (canon from singularity-convergence reference build)
- **Anti-pattern to avoid:** outcome lines that sound like fortune-cookie aphorisms.
  If it could appear on a coffee mug, the brand probably didn't write it.
```

## When to read these files

Before any new render's Stage 3 Draft A, Claude reads:
1. `compositions/<brand-slug>.canon.md` — if the brand has prior renders
2. `<register>-hooks.md` — proven hooks for the chosen register
3. `<register>-bodies.md` — proven bodies / closes / CTAs
4. `rejected.md` — anti-patterns to avoid

This is the cold-start move that prevents every render from re-discovering the same lessons.

## Curation rules

- **Earned through user approval, not Claude's confidence.** Silent passes don't count. The user has to explicitly say "ship" or specifically praise a line.
- **Tagged with the render and slot.** No naked lines floating without context.
- **Cross-register importing is forbidden.** A great contemplative hook is not a great kinetic-pop hook. Each register's swipe is its own world.
- **Reviewed quarterly.** The meta loop (every 3 months or 20 renders) reviews these files for new patterns and dead patterns.

## Files seeded today

- `contemplative-hooks.md` — seeded with 1 entry from methodology-45s 2026-04-28 render
- `contemplative-bodies.md` — seeded with 4 entries from same
- `rejected.md` — seeded with 1 entry from same
