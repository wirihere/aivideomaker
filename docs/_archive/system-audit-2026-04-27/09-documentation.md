> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

## 09 — Documentation Health Audit

**Audit date:** 2026-04-27. Scope: every `.md` outside `node_modules/` + `.claude/worktrees/` + `archive/`.

---

### A. Doc inventory (top-level + key sub-trees)

| Path | Lines / Bytes | Last modified | Role | Health |
|---|---|---|---|---|
| `README.md` | 4.5 KB | 2026-04-26 | Hero entry — `npm run video` one-liner + "where to read next" map | Current |
| `CLAUDE.md` | 3.7 KB | 2026-04-24 | Project rules for any agent (skills + class="clip" + lint) | **Stale** — predates PROCESS.md, sacred-oracle register, `/iterate-render` skills |
| `AGENTS.md` | 2.1 KB | 2026-04-24 | Near-duplicate of CLAUDE.md, no project-specific content | **Redundant** |
| `LEARNINGS.md` | 1,795 lines / 255 KB | 2026-04-27 | The source of truth (§1-§8) | Live — but §6 increment log is now 19 entries × ~50-100 lines = ~75% of file |
| `DESIGN.md` | 3.5 KB | 2026-04-25 | Brand cheat-sheet doc (gated workflow per PROCESS.md) | Current |
| `SESSION-LOG.md` | 7.4 KB | 2026-04-25 | Single-session narrative | **Stale snapshot** |
| `docs/PROCESS.md` | 13 KB | 2026-04-26 | Canonical workflow (Principle 0 + cycle) | Current — supersedes earlier directives |
| `docs/QUICKSTART.md` | 16 KB | 2026-04-26 | Manual pipeline walkthrough | Current |
| `docs/RESUME-AT-3AM.md` | 10 KB | 2026-04-26 | One-off quota-hit handoff | **Should archive** |
| `docs/SESSION-HANDOFF-2026-04-26-late.md` | 11 KB | 2026-04-26 | One-off handoff | **Should archive** |
| `docs/session-summary-2026-04-26.md` | 5 KB | 2026-04-26 | One-off | **Should archive** |
| `docs/wave-summary-2026-04-26.md` | 5 KB | 2026-04-26 | One-off, explicitly notes its own supersession | **Should archive** |
| `docs/social-video-patterns.md` | 287 lines | 2026-04-27 | Canonical 9:16 reference (Parts 1-8) | Current — Part 7 just added |
| `docs/template-models.md` | 8.7 KB | 2026-04-27 | Locked-template registry, machine-readable | Current — but Sacred-oracle family not yet listed |
| `docs/copy-playbook.md` | 31 KB | 2026-04-26 | 25-template copy framework | Current (large — could split) |
| `docs/playbooks/cinematic-vertical-promo.md` | 18 KB | 2026-04-24 | 4-wave agent playbook | **Stale process** — agent crew was deleted 2026-04-25 |
| `docs/playbooks/copy-and-script.md` | 9 KB | 2026-04-25 | Subset of copy-playbook | Current (some overlap) |
| `docs/playbooks/cards-library.md` | 17 KB | 2026-04-25 | Card surface-variant catalog | Current |
| `docs/playbooks/stacks.md` | 14 KB | 2026-04-25 | "stacks" concept | Current |
| `docs/playbooks/transitions.md` | 7.7 KB | 2026-04-25 | Scene transitions | Current |
| `docs/playbooks/music.md` + `music-shortlists.md` | 10 KB | 2026-04-25 | Music selection | Current — but missing sacred-cosmic vibe |
| `docs/playbooks/atmospheric-polish.md` | 11 KB | 2026-04-25 | Polish recipes | Current |
| `docs/playbooks/claude-design-card-briefs.md` | **187 KB** | 2026-04-25 | Massive prompt dump | **Bloat** — likely belongs in `archive/` |
| `docs/copy-research/{5 files}` | 14-17 KB each | 2026-04-26 | Research notes only referenced by `copy-playbook.md` + `social-video-patterns.md` | **Reference-only** — no agent / script reads them |
| `docs/render-learnings/LEDGER.md` | 71 lines | 2026-04-27 | Cumulative verdict ledger | Live |
| `docs/render-learnings/SUGGESTIONS.md` | 203 lines | 2026-04-26 | Cross-render patterns | Live |
| `docs/render-learnings/index-*.md`, `auto-fix-*.md`, `kindred-*.md`, `baseline-*.md`, `singularity-*.md` | 53 files | various | Per-render markdown reports | **Should be gitignored** — already noted in LEDGER.md header but checked in |
| `docs/{combo-fx-batch-2-plan, render-vite-roadmap, video-parallelize-plan, webgl-feasibility, bun-feasibility, typescript-scripts-feasibility, …}-2026-04-26.md` | 12 dated planning docs | 2026-04-26 | Single-decision proposal docs | **Should archive once decision shipped** |
| `docs/templates/` | — | — | **Does not exist** | **Missing** |
| Memory: `~/.claude/projects/.../memory/*.md` | 27 files | 2026-04-25 → 2026-04-27 | User-preference rules + project state | Mostly current; 2 marked stale by system; 1 contradicts current state |

---

### B. Stale sections / contradictions (ranked)

| # | Severity | Location | Issue |
|---|---|---|---|
| 1 | **High** | `CLAUDE.md` | Doesn't mention PROCESS.md, sacred-oracle register, `/iterate-render` + `/render-mp4` skills, `docs/template-models.md`. A new contributor reads it and misses Principle 0 entirely. |
| 2 | **High** | `docs/template-models.md` | Sacred-oracle family (5 templates: hook-15s, witness-30s, path-45s, revelation-60s, singularity-convergence) shipped 2026-04-27 per LEARNINGS but is **not in the registry table**. Orchestrator cannot gate them. |
| 3 | **High** | `docs/playbooks/cinematic-vertical-promo.md` | "4-wave pipeline" with Producer/Screenwriter/Cinematographer/Narrator/Colorist/etc. agents — the **agent crew was deleted 2026-04-25** (memory `project_no_agent_framework.md`). The doc never says "archival." |
| 4 | **High** | Memory `project_aivideomaker.md` (3 days old, system-flagged stale) | Says "4 specialised subagents available in `.claude/agents/`: asset-hunter, improvement-scribe, composition-doctor, rd-scout" — these were deleted. Direct contradiction with `project_no_agent_framework.md`. |
| 5 | **Medium** | `LEARNINGS.md §6` | 19 entries × dense markdown = ~670 lines of historical render diaries. Most relevant entries are last 5; entries from 2026-04-24 (Claim Mate v3 / v3.1 / v4 / v5) describe a project state that no longer exists. |
| 6 | **Medium** | `LEARNINGS.md §5.5` | Reads like a dated set of standing directives, but most have been superseded by `PROCESS.md` or moved to user memory. The doc warns it's "a project-local mirror" but the mirror has drifted. |
| 7 | **Medium** | `docs/render-learnings/` directory | LEDGER.md preamble says detail reports are "gitignored — regenerable" but 53 per-render `.md` files are checked in. `.gitignore` and reality disagree. |
| 8 | **Medium** | `assets/music-shortlists/sacred-cosmic.json` exists; `docs/playbooks/music-shortlists.md` does not mention it; `LEARNINGS.md §5.5` "Music curation" advice is unchanged. |
| 9 | **Low** | `README.md` "Where to read next" links LEARNINGS §3/§4/§6 — accurate; doesn't mention §8 parking lot, §5.5 standing directives, or PROCESS.md. |
| 10 | **Low** | `docs/QUICKSTART.md §3` "vibe templates" lists 4 vibes in `design/templates/` — doesn't mention sacred-oracle as a 5th vibe with its own register-replacement rules (Part 7 of `social-video-patterns.md`). |
| 11 | **Low** | `docs/copy-playbook.md` lists 25 templates; the active TEMPLATE_REGISTRY (per `template-models.md` + `compositions/templates/*`) lists 10 base + 5 sacred = 15. Drift. |
| 12 | **Low** | `AGENTS.md` is a near-clone of `CLAUDE.md`. Both still say `npx skills add heygen-com/hyperframes`; the project now also has `.claude/skills/iterate-render/` and `render-mp4/` that aren't surfaced. |
| 13 | **Low** | `docs/RESUME-AT-3AM.md`, `SESSION-HANDOFF-2026-04-26-late.md`, `session-summary-2026-04-26.md`, `wave-summary-2026-04-26.md` — 4 one-off session notes, all describe states that no longer apply. |
| 14 | **Low** | `docs/playbooks/claude-design-card-briefs.md` is 187 KB — likely agent prompt dump that no current code path consumes. |

---

### C. Missing docs (ranked by leverage)

| # | Missing | Why it matters |
|---|---|---|
| 1 | **`docs/templates/` family READMEs** | `template-models.md` is one row per template; there's no per-family README explaining *when* to pick `community-app-tour-30s` vs `kinetic-product-30s` vs `sacred-witness-30s`. Sacred-oracle has 5 templates with shared CSS module + register rules and no place to document the family contract. |
| 2 | **Content-slot schema** | Each template exposes `applyCopyToTemplate()` slot ids (e.g. `#b1-question`, `#b3-counter`). Nowhere in docs is the schema written down — readers have to grep HTML. |
| 3 | **Vibe-shortlist authoring guide** | `assets/music-shortlists/*.json` has 5 files with a fairly intricate schema (`tracks[]`, `bpm_range`, `default_volume`, `proven_on`). `docs/playbooks/music-shortlists.md` exists but predates the `proven_on` field + sacred-cosmic addition. |
| 4 | **Verifier-rule reference** | `social-video-patterns.md` Part 1 lists 15 platform rules + Part 7 lists S1/S9/S10/S11/S12 sacred replacements. The verifier (`scripts/verify-render.mjs`) implements a subset. Nowhere maps R/S codes ↔ verifier finding-types. |
| 5 | **Archive policy for one-off planning docs** | `docs/*-2026-04-26.md` (12 files) and 4 session-handoffs accumulated over 3 days. No rule says when they move to `archive/`. |

---

### D. Five doc improvements ranked by leverage

1. **Fold per-render reports into LEDGER + gitignore the rest.** 53 markdown files in `docs/render-learnings/` should be `.gitignore`d (the header already promises this). The LEDGER row is the durable summary; everything else is regenerable. Shrinks repo, reduces churn, matches stated policy.

2. **Split `LEARNINGS.md` §6 — keep recent 30-day window, archive the rest.** Move 2026-04-24 / 25 entries (15 entries) into `docs/archive/learnings-2026-04.md`. Top of §6 stays a chronological-most-recent view (≤5 entries). Keeps cold-read entry under 800 lines instead of 1,800.

3. **Update `CLAUDE.md` to point at the real read order.** Currently it's a generic HyperFrames skills index. Make it: (1) PROCESS.md Principle 0, (2) MEMORY.md, (3) LEARNINGS §1+§4, (4) social-video-patterns.md, (5) template-models.md. Three minutes of editing, biggest cold-start unlock.

4. **Add Sacred-oracle row(s) to `docs/template-models.md` registry table.** Without this, the orchestrator's render-gate (`scripts/lib/template-status.mjs`) can't route the 5 new templates correctly — they'll all fall to default `iterating`. Match the lifecycle field convention: most are still `iterating` (only `singularity-convergence` has a render). One-row-per-template, ≤30 LOC.

5. **Mark stale playbooks and stale memory.** `docs/playbooks/cinematic-vertical-promo.md` needs an `> ARCHIVAL — describes the deleted agent crew. Use docs/PROCESS.md.` banner at the top. Memory file `project_aivideomaker.md` should be updated to remove the "4 specialised subagents available" claim. Both are actively misleading future sessions.

---

### E. Proposed canonical read order for new contributors

```
1. README.md                    (90 sec — what is this, the one command)
2. docs/PROCESS.md              (5 min — Principle 0 + the cycle, you are
                                 the orchestrator, the system is tools)
3. ~/.claude/.../memory/MEMORY.md   (3 min — 27 user-preference rules,
                                 each linked file is one rule)
4. LEARNINGS.md §1, §2, §4      (5 min — at-a-glance + working setup +
                                 pitfalls; the hot 200 lines)
5. docs/social-video-patterns.md (10 min — Part 1 platform rules, Part 2
                                 community patterns, Part 7 sacred-oracle
                                 replacement rules)
6. docs/template-models.md      (3 min — locked vs iterating per template;
                                 source of truth for what to render today)
7. docs/QUICKSTART.md           (10 min — manual pipeline walkthrough,
                                 only when you need to drive scripts/ directly)
8. docs/render-learnings/{LEDGER, SUGGESTIONS}.md  (5 min — the cross-render
                                 patterns that translate verifier output to
                                 template fixes)
```

Total: ~40 minutes from cold to productive. Everything else (`copy-playbook.md`, `playbooks/*`, `copy-research/*`, the 12 dated planning docs) is reference — read on demand, not eagerly.

---

### F. Quick numerical state

- `LEARNINGS.md`: 1,795 lines, 19 increment entries (oldest 2026-04-24, newest 2026-04-27). §6 is ~75% of the file.
- `docs/render-learnings/`: 143 entries — 2 durable (LEDGER, SUGGESTIONS), 141 per-render reports (53 of those are `.md`, rest are JSON/HTML).
- `docs/playbooks/`: 10 files, 281 KB combined. `claude-design-card-briefs.md` is 67% of that.
- `docs/copy-research/`: 5 files, 76 KB. Zero references from `scripts/` or `.claude/skills/`. Pure reference.
- Memory: 27 files, 2 system-flagged stale (`project_no_agent_framework.md` 2 days old, `project_aivideomaker.md` 3 days old + factually contradicts the former).
- Sacred-oracle templates exist on disk (5 compositions, shared CSS module, music shortlist) but: not in `template-models.md`, not in `QUICKSTART.md` vibe table, not in `CLAUDE.md`. Only `social-video-patterns.md §7` and `LEARNINGS §6` know they exist.
