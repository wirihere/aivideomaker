# Claude Design — "Do Everything" prompt

Use this AFTER you've attached the codebase / uploaded the folder. Claude Design reads the briefs from the repo files; this prompt is just marching orders.

Copy from `# === START ===` to `# === END ===` and paste in Claude Design.

---

# === START ===

You're designing for **aivideomaker** — a HyperFrames Website-to-Video pipeline producing vertical mobile video (1080×1920, TikTok/Reels native). Claude Code wires GSAP motion AFTER your handoff. You design **visual states** + describe motion intent in prose; never write motion code.

## Read these files from the codebase first

1. **`docs/playbooks/claude-design-card-workflow.md`** — THE CONTRACT. Read this first. Every output must obey it.
2. **`design/cards.css`** + **`design/tokens-kindred.css`** — the token vocabulary you must use. Zero hardcoded brand values, zero literal hex / rgb / font names — only `var(--card-*)`.
3. **`DESIGN.md`** — current brand context (Kindred — kindred-nz.org).
4. **`docs/playbooks/cards-library.md`** — prior art. Match these conventions.
5. **`docs/playbooks/stacks.md`** — coordinated stacks (Warm Community / Kinetic Pop / Documentary / Quiet Premium).

## Your job

Open **`docs/playbooks/claude-design-card-briefs.md`**. It contains 394 briefs:
- **Transitions:** T01-T08
- **Effects:** E01-E240
- **Cards:** BRIEF 01-146

**Design every single one of them**, working through the file from top to bottom in order.

For each brief, return:

```
### [BRIEF ID] — [BRIEF NAME]

**HTML:**
[markup, BEM classes, semantic, no data-* attrs, no scripts]

**CSS:**
[uses ONLY var(--card-*) tokens, includes [data-mode="dark"] variant where applicable]

**Visual states (if any):**
[separate static classes for default / is-active / is-exited etc]

**Motion intent:**
[one or two lines in plain English — Claude Code translates into GSAP]

**Tokens used:** [list]
**Tokens you'd want to exist but don't:** [list, or "none"]

---
```

## Hard rules — non-negotiable

- **Token-only CSS.** ONLY `var(--card-*)`. Banned: literal hex, rgb, font-family names, hardcoded brand values.
- **Fixed 1080×1920 portrait.** No `@media`, no breakpoints, no viewport units, no responsive logic.
- **Video type scale.** Hero 100-200px, body 28-48px, kicker 22-32px. Floor is 22px.
- **Light + dark variants** via `[data-mode="dark"]` on parent.
- **No motion code.** No `@keyframes`, no `animation:`, no `transition:`, no GSAP / framer-motion / WAAPI in your output. You design states; Claude Code wires the motion.
- **No `:hover` / `:focus` / `:active`** — video can't hover.
- **No `data-*` attributes** — Claude Code adds those.
- **No invented copy / stats / brand facts** — placeholder text only.
- **BEM naming** — `.card / .card__element / .card--variant` or `.scenename / .scenename__element` style.

## Pacing rule

If your response would exceed your output-token budget, finish the current brief cleanly, then end with:

```
=== PAUSED AT [BRIEF ID] — RESUME HERE NEXT ===
```

I'll send "continue" and you pick up from the next brief. Don't summarize, skip, or abbreviate — every brief gets a full design treatment.

## Skip rule

If a brief's design direction doesn't make sense within the contract, flag it explicitly:

```
### [BRIEF ID] — SKIPPED: [reason]
```

Then move on. Don't fabricate to fill space.

## Order

Work top-to-bottom through `claude-design-card-briefs.md`:
1. Transitions & Effects section first (T01-T08, then E01-E240)
2. Then Cards section (BRIEF 01 onward through BRIEF 146)

Stop only when you've completed all 394 OR hit your output limit (use the PAUSED marker).

Confirm you've read the contract and the briefs file by replying with: `READY — [count] briefs found, starting with T01.` Then begin.

# === END ===
