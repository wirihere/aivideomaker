# Process — how to make a great video with this system

**Last updated: 2026-04-26 (replaces the wave-shipping pattern from earlier this session).**

This is the canonical workflow for taking a brand URL to a great rendered video. It's simple by design. Every other process doc that contradicts this one is superseded.

---

## Principles

These are durable preferences (also captured in user memory). Read them first; they govern every decision below.

1. **Quality is the only metric.** Speed is never a target. 7-minute renders are fine. 30 iterations on the same template are fine.
2. **Sequential improvement.** Each render must be measurably better than the previous. Each commit must improve the system's quality ceiling. No regressions tolerated.
3. **Templates amortize.** Build each template perfectly once; brand-specific data (colors, words, photos, music, voice) is the easy plug-in. Spend unbounded effort on templates because they get reused across infinite brands.
4. **Loop-until-perfect, then surface.** Iterate silently using the verifier + frame-flipbook checks. Only ping the user when the work is genuinely ready for review.
5. **Templates lock in as models** once approved. Tagged commit + entry in `docs/template-models.md` + validation against multiple brands.

---

## The cycle

For each new template (or each meaningful upgrade of an existing one):

```
┌────────────────────────────────────────────────┐
│ 1. Pick the target template + test brand       │
│ 2. Internal loop (silent)                      │
│    · Assemble                                  │
│    · Verify (motion-continuity + brand-fidelity│
│       + palette + asset + density + a11y)      │
│    · Frame-flipbook check (Playwright scrub,   │
│       0.5s intervals, every adjacent pair      │
│       must show visible motion)                │
│    · Fix any findings                          │
│    · Re-verify                                 │
│    · Repeat until verifier = ship + frames     │
│       look right                               │
│ 3. Pre-render review (surface to user)         │
│    · Frame strip + one-paragraph summary       │
│    · User decides: render / more work / pivot  │
│ 4. Render (only after user approves review)    │
│ 5. Post-render review                          │
│    · User watches the actual MP4               │
│    · Approve / send back / change direction    │
│ 6. On approve:                                 │
│    · Tag the template commit (e.g. faq-quick-v1)│
│    · Add entry to docs/template-models.md      │
│    · Capture findings in LEARNINGS §8 +        │
│       SUGGESTIONS.md                           │
│    · Promote any recurring findings to lint    │
│       detectors or verifier checks             │
│ 7. Validate generalization                     │
│    · Re-render with 2-3 OTHER brands of same   │
│       tone                                     │
│    · Confirm verifier ship + visually OK       │
│    · If a brand fails, fix the TEMPLATE not    │
│       that brand                               │
│ 8. Move to the next template                   │
└────────────────────────────────────────────────┘
```

---

## What's superseded

The following patterns from earlier in 2026-04-26 are **no longer the way**. They worked while we were exploring; they don't fit the loop-until-perfect mode.

| Old pattern | Why it stopped | New replacement |
|---|---|---|
| "Spawn 9+ parallel subagents per session" | Optimized for breadth/speed at the cost of depth. Each agent finished but the integrated result was mediocre. | Run 1-3 focused agents at a time, each on a deep piece. Sequence them when results depend on each other. |
| "Watch verdict is shippable" | Shipped videos that the user described as "way off" or "terrible" despite passing the verifier. | Only `ship` verdicts pass. `watch` triggers another iteration. Verdict gate is the verifier + a regression check + the user's eyes. |
| "Render to learn" | Burning 7 minutes of render per iteration was slow + expensive. | Verifier + frame-flipbook scrub catches most issues pre-render in <1 minute. Render only when ready. |
| Bouncing between templates / waves | Many templates touched at "good enough" depth, none at model quality. | Stay on one template until it's locked. Then port the same depth to the next. |
| Standing directive: "use as many parallel subagents as possible" | Caused the breadth-over-depth pattern above. | Replaced by: "use whatever number of agents the work actually needs, sequenced when dependent". |

---

## Pipeline parallelism (still valid)

Note: pipeline-level concurrency (Stages 2-4 fanning out, ffmpeg + render overlap, parallel BrowserContexts in render-vite) is **infrastructure**, not process. Those parallel patterns are still correct — they make individual renders faster without affecting iteration discipline.

The change is about how we sequence the *work of building templates* — not how the orchestrator runs once a template is being assembled.

---

## When to dispatch agents (vs do inline)

**Dispatch an agent when:**
- The task is well-scoped (single file, clear deliverable)
- It's expensive in this session's tokens (large file reads, multi-step research)
- It's read-only research (audit, scrape, fingerprint) and the result is durable

**Do inline when:**
- The task is small (one Edit, one verify, one Bash)
- The result needs immediate iteration (loop-until-perfect mode)
- The decision needs creative judgment that I have context for

**Don't run agents in parallel just because you can.** Run them in parallel only when they're truly independent AND none of them will be blocked waiting for the others.

---

## See also

- `LEARNINGS.md §8` — full waves history with what shipped, what was deferred, what was retired
- `~/.claude/projects/<this-project>/memory/MEMORY.md` — the 18 durable user-preference rules
- `docs/render-learnings/LEDGER.md` — per-render verdict trend
- `docs/render-learnings/SUGGESTIONS.md` — cross-render pattern library
- `docs/template-models.md` — locked-in model templates (created on first lock)
