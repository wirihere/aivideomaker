> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# System Map — `aivideomaker`

Cold-read this if you're new (or returning after a break). It explains *what Claude is doing*, *the tools Claude uses*, and *the process Claude follows*.

For the deep "how to do it" details, follow the cross-references at the bottom of each section.

---

## 1. Mental model — what is this system?

`aivideomaker` is a **HTML → headless Chrome → MP4** pipeline that turns any brand URL into a 15-60 second vertical (9:16) video.

The hero capability: take a website, automatically extract its visual brand (palette, type, voice), pick the right template + register, write narration in the brand's voice, source music + photos, and render an MP4. End to end in ~5 minutes when it works.

**It is NOT a productionised pipeline for external users.** It runs inside Claude Code on the user's machine. Every render is a learning event — capture findings in `LEARNINGS.md` after each run, and propagate principles into the template canon (`docs/social-video-patterns.md`).

---

## 2. Claude's role — the orchestrator

**Claude is the creative director.** The pipeline (scripts, templates, lint, verifier, music shortlists, voice library) is the toolset. Claude makes calls; the toolset executes under direction.

**Never an autopilot.** Concretely:
- Pick the register, the duration, the template — don't defer to the resolver if you can see better.
- Pick the music — the shortlist gives candidates; Claude listens / reads metadata and picks.
- Pick the voice — the library gives 47-76 options; Claude picks one matching the brand voice.
- Reject + re-source assets when the eye says no — filenames lie, alt text lies.
- Override the verifier verdict when its calibration is off for the register (contemplative: 67% of runs land at "needs-fix" from false positives — Claude judges).

**Memory rules that govern every session** (see `~/.claude/projects/.../memory/`):
- `feedback_orchestrator_role.md` — Claude is the creative director (this rule)
- `feedback_self_improvement.md` — capture every increment for cold-reading new sessions
- `feedback_plain_language.md` — group ships by outcome (faster/cleaner/safer/new tool), not file paths
- `feedback_no_invented_facts.md` — never invent facts about real brands; extends to taglines + outcome lines (per Part 7 S14)
- `feedback_brand_feel_not_literal.md` — capture palette/tone from URL, but typography + layout should be video-scale not web-scale
- `feedback_visual_fidelity.md` — verifier "watch" verdict can ship a video that doesn't LOOK like the brand; check palette + assets too
- `feedback_motion_speed.md` — fast and continuous; slow gentle effects + static holds = PowerPoint
- `feedback_sequential_improvement.md` — every render must beat the previous; every commit must improve the stack's quality ceiling
- `feedback_silent_loop_not_skipped.md` — verifier `watch` triggers another iteration, not a render. Frame-flipbook + pre-render review BEFORE rendering, not after.
- `feedback_template_amortization.md` — build perfect once, reuse infinitely

---

## 3. Tools Claude has

### Direct tools (used in the parent conversation)

| Tool | When to use |
|---|---|
| **Read** | Read files at known paths. Required before Edit (lint enforces this). |
| **Write** | Create new files OR full rewrites. Prefer Edit for existing files. |
| **Edit** | Targeted string replacement in existing files. Default editing tool. |
| **Bash** | Run commands, npm scripts, git, ffmpeg, frame-flipbook. Avoid for searches (use Glob/Grep/Read instead). |
| **Glob** | Fast filename pattern matching (e.g. `compositions/templates/contemplative/*.html`). |
| **Grep** | Content search across codebase. Built on ripgrep. |
| **TodoWrite** | Track multi-step tasks. One in-progress at a time. Use when ≥3 distinct steps. |
| **mcp__ccd_session__mark_chapter** | Mark a meaningfully different phase of work in the conversation. Sparingly — 3-8 chapters per session typical. |

### Delegation tools (parallelism + context isolation)

| Tool | When to use |
|---|---|
| **Agent (Task)** | Fork a sub-conversation with focused scope. Returns a summary, keeps full transcript out of parent. Use for: research questions, focused audits, multi-step file edits where the parent wants a clean handoff. Multiple Agent calls in one assistant message run **concurrently**. |
| **mcp__ccd_session__spawn_task** ("session chip") | File an out-of-scope improvement as a click-to-spawn handoff. The chip becomes a fresh session in its own worktree. Use for: things that surface mid-session but deserve a separate focused session (orchestrator integration, verifier overhaul, etc). **The user can disable with "no more chips, do it personally" — respect that.** |
| **Monitor** | Stream events from a long-running background process (renders, watches). Each stdout line is a notification. Don't sleep; let the monitor ping you. |
| **ScheduleWakeup** | Self-pace iterations of `/loop` mode. Picks delaySeconds; cache TTL is 5 minutes (don't sleep 300s). |

### Domain tools (this project's CLI)

| Command | Purpose |
|---|---|
| `npm run video -- <url>` | Full pipeline: URL → tokens → copy → music → TTS → comp → render |
| `npm run video -- --dry-run` | Stages 1-7 without network calls; ~3s smoke check |
| `npx hyperframes preview` | Preview comp in browser (studio editor) |
| `npx hyperframes render` | Render `index.html` to MP4 |
| `npx hyperframes lint` | Validate compositions (errors + warnings) |
| `npx hyperframes docs <topic>` | Reference docs in terminal |
| `node scripts/frame-flipbook.mjs --comp=X --slug=Y --times=1,5,10` | Capture PNG frames at specified seconds for visual review |
| `node scripts/verify-render.mjs` | Run verifier checks against rendered comp; produces ledger entry |
| `node scripts/usage.mjs` | Asset usage tracker (which CSS/audio/photo is referenced where) |
| `node scripts/preview-voices.mjs` | Generate 4-second TTS previews of every Edge TTS voice |
| `npm run check` | Full gate: `lint + lint:strict + check:heads + smoke + smoke:cli` |

### MCP tools (when needed, deferred-loaded)

Available but loaded on demand via ToolSearch:
- **playwright** — browser automation (live DOM inspection, computed-style probing)
- **claude-in-chrome** — Chrome extension control (web app interaction)
- **computer-use** — desktop control (native apps)
- Plus scheduled-tasks, gmail, calendar, supabase, sentry, n8n, stripe, etc — only if the task explicitly needs them.

---

## 4. The pipeline — URL → MP4 (8 stages)

```
┌──────────────────────────────────────────────────────────────────┐
│  Stage 1: Brand extract       (scripts/lib/scrape-page.mjs)      │
│  Playwright loads URL, returns { h1, h2, h3, paragraphs,         │
│  ogTags, jsonLd, listItems, ctaCandidates, visibleText, stats }  │
│                                                                  │
│  Stage 2: Tokens               (scripts/extract-tokens.mjs)      │
│  Color rank from page CSS → design/tokens-<slug>.css             │
│                                                                  │
│  Stage 3: Copy                 (scripts/extract-copy.mjs)        │
│  Anthropic API generates framework-aware copy                    │
│  → compositions/<slug>.copy.json                                 │
│                                                                  │
│  Stage 4: Assets               (scripts/pull-assets.mjs)         │
│  Pixabay photo + favicon + logo → assets/<slug>/                 │
│                                                                  │
│  Stages 2-4 run in PARALLEL after Stage 1.                       │
│                                                                  │
│  Stage 5: TTS                  (scripts/fetch-tts-edge.mjs)      │
│  Edge TTS → assets/voiceover/<slug>.{mp3,vtt}                    │
│                                                                  │
│  Stage 6: Music                (scripts/pick-music.mjs)          │
│  Curated shortlist → tone-vibe match → assets/music/<track>.mp3  │
│                                                                  │
│  Stage 7: Assemble             (scripts/video.mjs)               │
│  Pick template by tone+duration, applyCopyToTemplate(),          │
│  inject audio tags, write index.html                             │
│                                                                  │
│  Stage 8: Render               (scripts/render.mjs)              │
│  npx hyperframes render → renders/<name>.mp4                     │
└──────────────────────────────────────────────────────────────────┘
```

Each stage logs its result + has a `--no-X` opt-out. `--dry-run` bypasses all child spawns and writes synthetic outputs (~3s smoke check).

---

## 5. The improvement loop (after a render lands)

```
   render → flipbook review → verifier check → user review
              │                     │              │
              │ bug found            │ "needs-fix"  │ "way off"
              ↓                     ↓              ↓
           iterate             iterate (silent)  research first,
                                                 then iterate
              │                     │              │
              └─────────────────────┴──────────────┘
                          ↓
                  render again (or proceed if "ship")
                          ↓
                  user APPROVE
                          ↓
                store as LOCKED template
                          ↓
              capture LEARNINGS + propagate to canon
```

Discipline:
1. **Frame-flipbook before render** — seek to scene-end timestamps (after typeOn animations complete) to catch overflow / wrap / blank-frame bugs that lint can't see.
2. **Render is a learning event, not an output.** The `LEARNINGS.md` entry is the deliverable; the MP4 is a byproduct.
3. **Sequential improvement** — every render must beat the previous. Speed is never a target.
4. **Approved renders become canon** — promote the principles to `docs/social-video-patterns.md` so the next template inherits them. The 5-template contemplative family + the v2 hardening were built this way.

---

## 6. The template system

Templates are HTML compositions that any brand can be plugged into.

```
compositions/
├── singularity-convergence.html    ← reference build (60s contemplative manifesto)
├── templates/                       ← production templates (the orchestrator picks from here)
│   ├── hero-promo-30s.html         (kinetic-pop register)
│   ├── faq-quick-30s.html           (warm-community)
│   ├── case-study-60s.html          (documentary)
│   ├── ... (8 structural templates)
│   └── contemplative/               ← new register family
│       ├── hook-15s.html            (scroll-stopper)
│       ├── testimonial-30s.html     (testimonial)
│       ├── methodology-45s.html     (methodology)
│       └── cinematic-launch-60s.html (cinematic launch)
└── verticals/                       ← industry-specific (most unused; soft-archive candidates)
```

**Anatomy of a composition:**
1. `<head>` — links to `design/cards-<register>.css` + inline per-scene `<style>`
2. `<div class="comp clip">` root with `data-composition-id`, `data-register`, `data-duration`, `data-width`, `data-height`
3. Scenes as `<div class="scene clip">` with `data-start` + `data-duration` + `data-track-index`
4. `<audio>` tags with `data-track-index` (8 = music vol 0.18, 9 = VO vol 0.95) + `data-todo` placeholder markers
5. `<script>` block: `gsap.timeline({ paused: true })` registered on `window.__timelines[id]` + per-scene tweens

**Content slots** — every template's `<head>` comment block lists the IDs that operators (or the orchestrator's `applyCopyToTemplate()`) swap brand content into. E.g. `#b1-question`, `#b3-counter`, `#b5-cta`, `#b5-url`.

**Registers** — calibration sets (palette + type voice + motion language + music vibe + verifier thresholds):
- **kinetic-pop** — TikTok-shaped feed-native; `back.out(1.7)` motion; sticker-pill captions
- **warm-community** — kindred-style; acoustic guitar bed; first-person voice
- **documentary** — Playfair serif + Source Sans; case-study shape
- **quiet-premium** — minimal; held holds; less common
- **contemplative** — black + gold + parchment; Georgia italic + Arial sans utility; persistent ambient haze; contemplative music

Cross-reference: `docs/social-video-patterns.md` — Part 1 = kinetic-feed rules R1-R15, Part 7 = contemplative-register additions S1-S15.

---

## 7. The verification system

Two tiers of automated quality checks, each with a different scope:

### Lint — DOM-static correctness (`scripts/fix.mjs` + `npx hyperframes lint`)

17 project detectors + HF built-ins. Errors fail the gate; warnings are informational. Examples:
- `track-index-collision` (error) — same `data-track-index` clips overlap in time
- `gsap_exit_missing_hard_kill` (warn) — exit fade has no `tl.set(target, opacity:0)` after, non-linear seek may stick
- `audio-no-clip` (error) — `<audio>` without `class="clip"`
- `narration-mid-tween` (warn) — VO ends during an active tween

Scope: STATIC. Reads HTML + CSS + script. Does not run the GSAP timeline or capture pixels.

### Verifier — pixel reality (`scripts/verify-render.mjs` + `npm run verify`)

Spawns hyperframes preview, scrubs `window.__timelines[<id>]` second by second (sample at `t+0.5s`), reads visible text via DOM, cross-references narration VTT + copy.json. Detector categories:
- **motion-continuity** — flag samples >2.5s apart with sub-2% PNG byte change (kinetic registers)
- **script-timing** — on-screen text should word-align with VO at each second
- **brand-fidelity** — palette use, asset use, scene visual density
- **audio-coverage** — narration spans the comp's expected audio window
- **accessibility** — contrast ≥4.5:1, font-size ≥80px on captions

Verdicts: `ship` | `watch` | `needs-fix`. Output to `docs/render-learnings/<comp>-<timestamp>.md` + a row in `LEDGER.md`.

**Known calibration gap:** verifier was tuned for kinetic-pop. Contemplative: 67% of runs land at "needs-fix" from false positives. Per `feedback_visual_fidelity.md` the user's eye is the final ship gate.

### Visual flipbook — eye check (manual or via agent)

`node scripts/frame-flipbook.mjs --comp=X --slug=Y --times=1,5,10` captures PNG at specified seconds. Read each PNG → judge layout / overflow / blank frames / brand presence / palette match. **The eye catches what lint and verifier miss** — fabricated copy, missing brand presence, off-center type, photos that don't match brand vibe.

---

## 8. Where to start (cold-read order)

1. **`docs/SYSTEM-MAP.md`** — this file
2. **`CLAUDE.md`** — project skill / rule set, top-level
3. **`LEARNINGS.md` §1, §2, §4** — what's been tried, working setup, pitfalls
4. **`docs/social-video-patterns.md`** — canonical reference for 9:16 patterns + contemplative register
5. **`docs/templates/`** — per-template family READMEs (TBD — currently the head-comment block in each template is the doc)
6. **`compositions/templates/contemplative/hook-15s.html`** — read end-to-end as a reference composition
7. **`scripts/video.mjs`** — orchestrator; trace `runStages()` to see Stage 1-8 in order
8. **`docs/render-learnings/LEDGER.md`** — recent renders + verdicts

For a render: `npm run video -- <url> --dry-run --keep-artifacts` first (3s, no network), then `npm run video -- <url>` (full).

For a new template: copy the closest existing template, edit IDs + content, run `npx hyperframes lint`, run `frame-flipbook` at scene-end timestamps, render, capture `LEARNINGS.md` entry.

---

## 9. Project memory (user preferences)

Key memory files at `~/.claude/projects/C--Users-wirihere-aivideomaker/memory/`:
- `MEMORY.md` — index, read first
- `feedback_orchestrator_role.md` — Claude as creative director
- `feedback_iteration_workflow.md` — loop-until-perfect workflow
- `feedback_template_amortization.md` — templates amortize, brand data plugs in
- `project_aivideomaker.md` — project anchor, LEARNINGS is source of truth
- `project_method_website_to_video.md` — the canonical method name
- `project_social_video_patterns_doc.md` — the patterns doc is canonical
- `project_no_agent_framework.md` — crew agents removed 2026-04-25; work the pipeline directly
- `project_scope_claude_code_only.md` — not productionised; don't over-engineer for external use

These are read at session start; ignoring them produces re-litigated decisions and rework.

---

## 10. The shipping ladder

What "done" means depends on the artifact:

| Artifact | "Done" criterion |
|---|---|
| Lint pass | 0 errors. Warnings can ship. |
| Frame flipbook | Reviewer says "this looks right at every sample timestamp." |
| Render (MP4) | User reviews + says "ship" or "iterate". User's eye is final gate. |
| Template | User-approved + locked + LEARNINGS captured + canon updated. |
| LEARNINGS entry | Append after every meaningful increment. Promote pitfalls to §4 immediately. |
| Canon (`social-video-patterns.md`) | Updated when a learning generalises beyond one render. |

---

*Generated 2026-04-28. Next refresh after the next register family ships, or whenever the pipeline stages change.*
