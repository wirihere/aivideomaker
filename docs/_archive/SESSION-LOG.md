> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](docs/skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# aivideomaker — current state · 2026-04-25

> **Cold-read this first.** Snapshot of where we are, what's working, and what to pick up next. For full chronological history see `LEARNINGS.md` §6 (increment log) and `archive/session-logs/`.

---

## Where we are in one paragraph

The project is now a **Website-to-Video pipeline** — point at any business URL → extract brand (palette/fonts/copy) → apply a coordinated **stack** (Warm Community / Kinetic Pop / Documentary / Quiet Premium) → compose using brand-agnostic **cards + effects + transitions** → render vertical mobile video (1080×1920). First proven on Kindred (`kindred-nz.org`); current best render is [`renders/aivideomaker_2026-04-25_17-58-49.mp4`](renders/aivideomaker_2026-04-25_17-58-49.mp4) (9.0 MB, 29.5s, lint clean). The pipeline is **brand-agnostic by construction** — every card / effect uses `var(--card-*)` tokens, so swapping `tokens-<brand>.css` re-skins the whole render. Repo is now on GitHub at https://github.com/wirihere/aivideomaker (private). Claude Design (Anthropic Labs preview) is integrated for visual card-pattern authoring; **600 effects + 4 cards** delivered in a handoff bundle saved at `docs/design-bundles/consentmate/`.

---

## What exists right now

### Code & assets
- **`index.html`** — current Kindred composition. Structure: brand header + 5 scenes (hook → brand → features → proof → CTA). Has soft-glow-em on Scene 1, concentric pulse on Scene 2 brand-arrival, Phone-In-Hand mockup on Scene 4 (from Claude Design's BRIEF 21).
- **`design/cards.css`** — agnostic structural design system (tokens, surface variants, content layouts).
- **`design/tokens-kindred.css`** — Kindred brand overlay (palette extracted from kindred-nz.org).
- **`design/effects-batch-07.css`** — 5 effects ported from Claude Design batch-07 (E243 holo-sticker, E256 type shimmer, E265 concentric pulse, E270 radio wave, E280 end card).
- **`design/cards-from-bundle/phonehand.css`** — Claude Design's BRIEF 21 Phone-In-Hand pattern (currently used in Kindred Scene 4).
- **`assets/`** — voiceover (Edge TTS Molly NZ -10%), music bed (Pixabay warm acoustic), Kindred logo + app screenshot, whoosh SFX, Lucide icons.

### Documentation (`docs/playbooks/`)
- **`stacks.md`** — 4 coordinated stacks (Warm Community proven, others drafted)
- **`cards-library.md`** — 5 cards shipped on Kindred (Persistent Brand Header, 3-Up Feature, Per-Letter Wordmark, Kinetic Proof + Phone, CTA with Glow Pulse)
- **`transitions.md`** — color wash, soft cross-dissolve, whip+whoosh, match cut
- **`atmospheric-polish.md`** — vignette, film grain, particles, paper-grain drift, light beam, push-in, plus the 5 batch-07 effects
- **`copy-and-script.md`** — tone rules, video type-scale, no-Maori, no-invented-facts, hybrid-composition rule
- **`music-shortlists.md`** — per-stack music search keywords (Warm Community proven; others drafts)
- **`claude-design-card-workflow.md`** — the contract every Claude Design output must obey
- **`claude-design-card-briefs.md`** — 394 ready-to-paste brief prompts (transitions T01-T08, effects E01-E240, cards BRIEF 01-146)

### Claude Design integration
- **`claude-design-upload/`** (gitignored — derived) — clean bundle to upload to Claude Design (README has the full job + contract, no brand-specific framing)
- **`claude-design-do-everything.md`** — short prompt that points Claude Design at the upload folder
- **`claude-design-one-prompt.md`** / `claude-design-full-library-prompt.md` — alternative single-prompt forms
- **`docs/design-bundles/consentmate/`** — Claude Design's handoff back. 600 effects across 15 batches + 4 designed cards (Pull-Quote, Stat Hero, Phone-In-Hand, Logo Grid).

### Memory (`~/.claude/projects/.../memory/`)
- Project: aivideomaker anchor, no agent framework, Claude-Code-only scope, Website-to-Video method name
- Feedback: self-improvement loop, no invented facts, no Māori in TTS, brand feel not literal copy, on-screen text = main points not captions
- Reference: FFmpeg path

---

## What's working well (don't change unless asked)

- **The 5-scene Warm Community structure** for Kindred reads cleanly, narration-anchored cuts, all atmospheric layers integrated
- **Brand-agnostic token contract** — cards use only `var(--card-*)`, swap brand by changing tokens overlay
- **Stack system** — pre-coordinates transitions + atmospheric layers + music + copy tone + TTS voice + pacing all together
- **Claude Design integration loop** — clean bundle works end-to-end (upload → design batches → handoff → integrate). Validated on Phone-In-Hand card.

---

## Active blockers / known issues

- **Caption-exit lint warning** persists (false-positive — flags particle fade-outs and zoom-out exits as if they were caption animations). Non-blocking.
- **Compiler doesn't resolve `var(--font-*)` for deterministic font embedding** — fonts load via Google `@import` at render time. Works online, not offline-deterministic. Documented in §4 of LEARNINGS.
- **595 effects + 3 cards in the handoff bundle still un-ported** — they're in `docs/design-bundles/consentmate/` as raw HTML reference. Port on demand.

---

## Pick up next session — choose one

### A. Port more effects from the bundle (fastest visible payoff)
The user flagged that only 3 of 600 bundle effects made it into the current render. Pick 5-8 high-visibility effects from `docs/design-bundles/consentmate/project/effects/batch-XX-...html` (batch-05 has video-priority set: aurora, confetti cannon, liquid blob, pulse rings, light sweep) and integrate them into the existing Kindred scenes. Don't be surgical — be additive.

### B. Refactor Kindred → first template (`templates/community-app/`)
Extract the working Kindred structure into a brand-agnostic template with content slots. Build the apply-template script. Validates the templating architecture before building 3 more (saas-product, lifestyle-brand, creator-tool). See LEARNINGS §6 plan dated 2026-04-25 for details.

### C. Build a second template against a different real website
Pick a high-earning vertical (real estate listing, DTC product, SaaS landing page — see LEARNINGS for ranking). Run the full pipeline end-to-end: brand extraction → stack pick → composition → render. Validates the method on a new brand.

### D. Apply the remaining 3 designed cards (Pull-Quote, Stat Hero, Logo Grid)
Claude Design's batch-01-cards.html has 4 cards designed. Phone-In-Hand is integrated. Pull-Quote / Stat Hero / Logo Grid are still pending — wire them as additional reusable patterns in `cards-library.md`.

---

## Quick-start for next session

```bash
cd C:/Users/wirihere/aivideomaker

# Verify current state
git log --oneline | head -5
git status

# View the latest render
ls -la renders/aivideomaker_2026-04-25_17-58-49.mp4

# Render again from current source
export PATH="/c/Users/wirihere/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin:$PATH"
npx hyperframes lint
npx hyperframes render
```

Read in this order on session start:
1. `MEMORY.md` (auto-loaded)
2. `SESSION-LOG.md` (this file — picks up at "Pick up next session")
3. `LEARNINGS.md` §1 + §4 + §6 (project-at-a-glance, pitfalls, recent increments)
4. The branch chosen above
