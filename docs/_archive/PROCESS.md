> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Process — how to make a great video with this system

**Last updated: 2026-04-26 (wave-Q — research-first for unknown shapes).**

This is the canonical workflow for taking a brand URL to a great rendered video. It's simple by design. Every other process doc that contradicts this one is superseded.

---

## Principle 0 — Orchestrator + tools (the framing)

**You (Claude) are the orchestrator. The system, templates, libraries, and skills are tools that execute under your direction.** This is the foundational framing — it governs every other principle below.

The pipeline doesn't make videos. *You* make videos using the pipeline. The verifier doesn't measure quality on its own — it measures specific axes you choose to gate on. Templates don't produce results — they execute the creative direction you give them.

Practical implications:
- Verifier `ship` verdict is necessary but not sufficient. Your eyes and gut are the gate.
- A bad render is your fault (wrong direction) or the tool's fault (a gap you should fix). It's never "the system did its best".
- New requirements (script-timing, narration-critique, palette-flow) get codified as new tools (verifier checks, libraries, templates) so the system gets smarter under your direction.
- You never default to "ship what the system produced". You always evaluate creatively first.
- You never mechanically chain agents to look productive. You drive iteration.

**For new sessions cold-reading this project:** you are not running an automated pipeline. You are the creative director making a video, with very capable tools to help.

---

## Principles

These are durable preferences (also captured in user memory). Read them first; they govern every decision below.

1. **Quality is the only metric.** Speed is never a target. 7-minute renders are fine. 30 iterations on the same template are fine.
2. **Sequential improvement.** Each render must be measurably better than the previous. Each commit must improve the system's quality ceiling. No regressions tolerated.
3. **Templates amortize.** Build each template perfectly once; brand-specific data (colors, words, photos, music, voice) is the easy plug-in. Spend unbounded effort on templates because they get reused across infinite brands.
4. **Loop-until-perfect, then surface.** Iterate silently using the verifier + frame-flipbook checks. Only ping the user when the work is genuinely ready for review.
5. **Templates lock in as models** once approved. Tagged commit + entry in `docs/template-models.md` + validation against multiple brands.
6. **Research-first for unknown shapes.** When the target shape is new (Reel/TikTok/Shorts vs cinematic-promo, ecommerce vs community-app, motorcycle-tech vs warm-community), read `docs/social-video-patterns.md` BEFORE designing. If a gap remains, do real research (web search + benchmarks) and codify findings — don't tweak from training-data assumptions.

---

## Step 0 — match brand to template (run BEFORE the cycle)

Before assembling anything, decide whether a locked template already fits the brief.

```
┌──────────────────────────────────────────────────────────┐
│ a. Read docs/template-models.md                          │
│    Does a LOCKED template match the brand's shape?       │
│      YES → use it. Skip to the cycle (step 1).           │
│      NO  → continue.                                     │
│                                                          │
│ b. Read docs/social-video-patterns.md                    │
│    Find the shape pattern that matches the brief.        │
│    (15 platform-mechanical rules + 7 community-app      │
│    patterns + anti-patterns + format reference.)         │
│                                                          │
│ c. Use the website-to-hyperframes skill's gated docs    │
│    for any NEW template shape:                           │
│      DESIGN.md   — brand cheat-sheet                     │
│      SCRIPT.md   — narration script (story backbone)     │
│      STORYBOARD.md — per-beat creative direction         │
│    These force decision-points before code touches CSS,  │
│    avoiding the "tweak before understanding" failure    │
│    mode that wasted hours in wave-Q.                     │
│                                                          │
│ d. Build the new template skeleton in compositions/     │
│    templates/<name>-<seconds>s.html. Register in         │
│    scripts/video.mjs TEMPLATE_REGISTRY.                  │
│                                                          │
│ e. Enter the cycle (step 1).                             │
└──────────────────────────────────────────────────────────┘
```

**Wave-Q precedent:** kindred-nz was force-fitted into faq-quick-30s for hours before the user pushed back ("you don't understand what makes a good social media video"). That CSS-tweak-before-understanding loop is the failure mode step 0 prevents. Saves several hours per new shape.

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

## Forked skills — keep brand-iteration noise out of the main conversation

A single brand iteration produces ~15-25k tokens of intermediate context that the main conversation never needs again after the render lands: verifier markdown reports, frame PNG metadata, per-stage console output, copy.json reads, scrape data. Run 5-10 brands back-to-back and that residue triggers auto-compaction mid-batch.

Two project-local skills run the cycle inside a forked subagent. Tool responses + reads + reasoning all stay in the fork; only a synthesized summary returns:

- **`/iterate-render <url-or-slug>`** — `.claude/skills/iterate-render/SKILL.md` — runs ONE silent-loop cycle (assemble + verify + frame-flipbook), Reads the verdict + critical frames, returns a 200-word synthesis. Use whenever you're iterating a template that isn't yet at `ship` verdict + frames-look-right.
- **`/render-mp4 <slug> [--allow-watch] [--use-legacy] [--with-music]`** — `.claude/skills/render-mp4/SKILL.md` — runs the actual render in a fork. ~5-10k tokens of ffmpeg / x264 stats stay in the subagent; parent only sees the no-watermark MP4 path + duration + size. Honors the system gates (verify + template-status) just like the orchestrator.

**When NOT to fork** (per skill-chaining doctrine):
- Skills that need user input mid-run — `AskUserQuestion` is broken inside forks.
- Reasoning that the parent needs to keep using — fork discards everything except the return value.
- One-off explorations where you genuinely want the data in your main context.

The pre-render review step (PROCESS cycle step 3 — surface frames + summary to user) intentionally returns to the parent because the user critique IS the point. After the user approves, kicking off `/render-mp4` puts the render in another fork.

**Gotchas:**
- Skill `!command` preprocessing runs at parse time. Output is baked into the prompt before the subagent reads. Use it to preload LEDGER tail / template status / memory rules instead of burning a turn on Read.
- `agent: general-purpose` inherits the session model (Opus stays Opus). `agent: Explore` downgrades to Haiku — never use for creative work like DM writing or pre-render frame critique.

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
- `~/.claude/projects/<this-project>/memory/MEMORY.md` — the durable user-preference rules
- `docs/render-learnings/LEDGER.md` — per-render verdict trend
- `docs/render-learnings/SUGGESTIONS.md` — cross-render pattern library
- `docs/template-models.md` — locked-in model templates (read FIRST when matching a brand to a template)
- `docs/social-video-patterns.md` — canonical reference for 9:16 short-form shape (15 platform rules + 7 community-app patterns + anti-patterns)
- `~/.claude/skills/website-to-hyperframes/` — the gated DESIGN.md / SCRIPT.md / STORYBOARD.md workflow for new template shapes
