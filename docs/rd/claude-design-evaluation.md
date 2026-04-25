# R&D — Claude Design as a Website-to-Video front-end

Research date: 2026-04-25 · Subject launched 2026-04-17 (8 days ago, post my training cutoff).

## TL;DR

Claude Design (Anthropic Labs, preview) generates live HTML/CSS from prompts, ingests a codebase to build a design system, has a web-capture tool, and hands off bundles to Claude Code. **Strong fit as the client-facing front of our Website-to-Video pipeline; weak fit for render-layer work.** Adoption recommended when we want owner-facing visual selection (stacks, cards, music). Not yet, given current Claude-Code-only scope.

## What it is

- **Launched**: 2026-04-17 by Anthropic Labs
- **Powered by**: Claude Opus 4.7
- **Access**: Research preview for Claude Pro / Max / Team / Enterprise (admin-enabled in Org settings)
- **Output**: live HTML / CSS / React (not images). Exports: standalone HTML, PDF, PPTX, Canva, internal-org URLs

## Capabilities (verified via [anthropic.com/news/claude-design-anthropic-labs](https://www.anthropic.com/news/claude-design-anthropic-labs))

- Creates designs, prototypes, slides, one-pagers, interactive prototypes
- Inputs: text prompts, image uploads, DOCX/PPTX/XLSX, codebase references, web capture from any URL
- Refinement: chat, inline comments, direct text edit, "adjustment knobs" (custom sliders Claude generates per project for spacing/colour/layout)
- Design system: reads codebase + design files during onboarding → applies brand colours/typography/components automatically. Multiple systems supported, evolves over time.
- Claude Code handoff: packages design as a "handoff bundle" passed to Claude Code with one instruction → closed-loop exploration → prototype → production

## Fit with Website-to-Video pipeline

| Pipeline step | Current | Claude Design fit | Notes |
|---|---|---|---|
| Brand extraction from URL | `curl + grep` for `--var`, `font-family`, copy | **High** | Web capture extracts directly; produces colour/type/sample bundle |
| `DESIGN.md` + `tokens-<brand>.css` | Hand-coded after extraction | **Medium** | Could auto-generate but we may want to enforce token naming conventions |
| Stack picker | Markdown decision matrix in `stacks.md` | **High** | Visual stack gallery + owner picks via comment/slider |
| Music shortlist presentation | Plan: copy-paste shortlist to owner | **High** | Native shortlist UI with audition-and-pick |
| Card-pattern iteration | Hand-code in `index.html`, render, frame-verify | **High** | Adjustment sliders for spacing/colour before committing |
| Composition HTML wiring (`data-start`, `class="clip"`, GSAP timeline) | Hand-coded | **Low** | Claude Design doesn't know HyperFrames specifics; would have to be taught via the codebase ingest |
| Render to MP4 | `npx hyperframes render` | **None** | Out of scope for Claude Design |
| Frame verification | `ffmpeg + Read JPG` | **None** | Out of scope |

## Proposed integration architecture (when we adopt)

```
[Website Owner]
      ↓  URL
[Claude Design] ── web capture ────→ palette + samples
      ↓                              + sliders for stack/card/music selection
[Owner sliders] ── stack picked ───→ tokens-<brand>.css generated
                ── music picked ───→ chosen track
                ── cards picked ───→ card layouts approved
      ↓
[Handoff Bundle to Claude Code]
      ↓
[Claude Code (here)] ── HyperFrames data-* wiring
                     ── GSAP timeline assembly
                     ── audio track wiring
                     ── render to MP4
                     ── frame verification
      ↓
[MP4 delivered to owner]
```

The playbooks (`stacks.md`, `cards-library.md`, `transitions.md`, `atmospheric-polish.md`, `music-shortlists.md`, `copy-and-script.md`) become **inputs to Claude Design's design system** — Claude Design ingests them on onboarding and uses them as constraints for everything it generates. So no rewriting needed; just keep them schema-friendly (which they already are).

## Tradeoffs

**For adoption:**
- ✅ Solves the "present to website owner" friction directly (currently a manual paste-and-discuss step)
- ✅ Visual iteration faster than code-then-render-then-frame-check loop for layout/colour decisions
- ✅ Web capture of a brand site is more thorough than `curl + grep` (handles SPA / JS-rendered sites)
- ✅ Formal handoff bundles document owner's choices for the render step
- ✅ Closed-loop with Claude Code (this is where we work)

**Against adoption (right now):**
- ❌ Preview product — feature surface and pricing may shift
- ❌ Requires paid Claude subscription
- ❌ Adds a tool / surface to learn (current pipeline runs end-to-end in Claude Code alone)
- ❌ Doesn't know HyperFrames specifics — would need to be taught via codebase ingest, with risk of generating compositions that don't lint
- ❌ Project's current scope is "Claude-Code-only" (per `project_scope_claude_code_only` memory); adding Claude Design is a productionisation step

## Recommendation

**Don't adopt yet.** Reasons:
1. Current scope is intentionally Claude-Code-internal — Claude Design is a productionisation move
2. The pipeline works end-to-end in Claude Code; the gap is owner-facing UX, which is a *future* concern
3. The framework we're building (playbooks, stacks, cards-library) is the right substrate to feed Claude Design when we DO adopt it

**Do this instead:**
- Keep authoring playbooks with schema-friendly structure (stacks.md → 4 named stacks each with full coordination, cards-library.md → reusable patterns with applied-where notes, music-shortlists.md → per-stack track lists with audition data)
- Keep the cards / tokens / transitions code modular and named consistently — Claude Design's codebase-ingestion will benefit
- Revisit Claude Design when one of these triggers fires:
  - User wants to onboard the first website owner end-to-end (then visual selection UX matters)
  - User wants to ship the method as a service or productionised tool
  - Anthropic moves Claude Design out of preview / clarifies pricing

## Sources

- [Anthropic — Introducing Claude Design by Anthropic Labs (official)](https://www.anthropic.com/news/claude-design-anthropic-labs)
- [Get started with Claude Design — Anthropic Help Center](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- [TechCrunch — Anthropic launches Claude Design](https://techcrunch.com/2026/04/17/anthropic-launches-claude-design-a-new-product-for-creating-quick-visuals/)
- [VentureBeat — Claude Design vs Figma](https://venturebeat.com/technology/anthropic-just-launched-claude-design-an-ai-tool-that-turns-prompts-into-prototypes-and-challenges-figma)
- [CMSWire — Claude Design for Visual Prototyping](https://www.cmswire.com/digital-marketing/anthropic-labs-launches-claude-design-tool-for-visual-prototyping/)
- [Designing with AI — How Good is Claude Design?](https://newsletter.victordibia.com/p/how-good-is-anthropics-claude-design)
