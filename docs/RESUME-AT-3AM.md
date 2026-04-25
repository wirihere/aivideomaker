# Resume notes — quota hit at 2026-04-26 ~01:30 NZST · resumes 03:00 NZST

Session ended early because Anthropic quota reset is at 3am Pacific/Auckland. Three in-flight agents reported `You've hit your limit · resets 3am`. The project is in a healthy state — lint + lint:strict + smoke all pass — but several supervisors had partial deliverables.

This file captures **exactly where each agent was** so the next session can pick up cleanly without re-doing audit work.

---

## What was complete + committed before quota hit

✅ **Bundled ffmpeg** (`scripts/lib/ffmpeg-path.mjs` + 4 scripts wired) — `npm run check` passes with `PATH` stripped of all ffmpeg locations. System fallback retained.

✅ **`npm run lint:strict`** — 9 §4-pitfall detectors error-gated inside `npm run check` (now `lint → lint:strict → smoke`, ~5.5s total).

✅ **Combo-fx Batch-2 evaluation plan** at `docs/combo-fx-batch-2-plan.md` — verdict YES, 6 combos ranked, 2 new primitives needed. Read this first when resuming combo-fx work.

✅ **Copy research** — `docs/copy-research/{direct-response,brand-storytelling,modern-digital,video-screen,short-form-microcopy}.md`. Five 800-1500-word research docs covering the major copywriting traditions.

✅ **Copy playbook** — `docs/copy-playbook.md` (724 lines). Master synthesis with framework-per-template-type, hook/headline/body/CTA rules, vibe-mapping, before/after examples.

✅ **Production MP4** — `renders/aivideomaker_2026-04-25_01-01-06-graded-wm.mp4` (9.25 MB, 22s, full audio + 4 combos + warm grade + watermark). User judged the COPY as "bad" — that's what the copy supervisor was fixing.

---

## What's IN PROGRESS (partial work on disk)

### 1. Combo-fx Batch-2 Implementor (agent: a828ade06f4ab19a3 — quota hit)

**State:** Phase 1 partially done — added helper functions and CSS rules for the 2 new primitives (`rackFocus`, `radialMask`), but **the actual primitive functions are NOT in the global export yet**.

**What's on disk:**
- `design/modules/effect-fx.js` — `ensureRadialMaskRule()` helper added (line 56-77). The `rackFocus` and `radialMask` recipe FUNCTIONS are NOT yet added. The global export at the bottom still only exports the original 4: `{ multiplaneDolly, inkBleed, glitchBurst, cinemagraphRotate }`.
- `design/modules/effect-fx.css` — `.fx-rack-target` + `.fx-radial-mask` CSS rules added (line 30-61). These are READY for the JS recipes to consume.

**What to do at resume:**
1. Add `rackFocus(timeline, target, opts)` to `effect-fx.js` (spec in plan §"Phase 1").
2. Add `radialMask(timeline, target, opts)` to `effect-fx.js` (spec in plan §"Phase 1").
3. Update the global export: `global.effectFx = { multiplaneDolly, inkBleed, glitchBurst, cinemagraphRotate, rackFocus, radialMask };`
4. Add the 6 combos to `design/modules/combo-fx.js`: `glitchStamp`, `pricePop`, `testimonialReveal`, `focusPull`, `statGroup`, `spotlight` (priority order — `glitchStamp` consolidates 25 invocations across 9 templates, biggest immediate win).
5. Run `npm run build:bundle` to regenerate `design/modules/all.{js,css}`.
6. Extend `compositions/combo-fx-demo.html` from 10 scenes to 16.
7. Run `npm run catalog` to refresh thumbnails.
8. Update `LEARNINGS.md` §3 combo entry + close the parking-lot items.

### 2. Master Copywriting Supervisor (agent: a9558dab6f854e688 — likely still running or completed)

**State:** Phases A (research) + B (synthesis) shipped (5 research docs + playbook). Phases C (apply across 25 templates) and D (upgrade `extract-copy.mjs`) probably did NOT finish before quota.

**What's on disk:**
- `docs/copy-research/` (5 files) — DONE.
- `docs/copy-playbook.md` — DONE.
- `compositions/templates/hero-promo-30s.html` — modified (combo replan or copy apply — needs spot-check).
- The other 24 templates — unmodified at last check; copy NOT yet applied.
- `scripts/extract-copy.mjs` — unmodified at last check; framework-aware upgrade NOT yet done.

**What to do at resume:**
1. Spot-check `hero-promo-30s.html` to see if copy-apply ran on it (look for the `<!-- Copy framework: ... -->` comment header from the brief).
2. Re-dispatch the Phase C worker fan-out: 5 workers, each takes ~5 templates, rewrites placeholder copy following the playbook framework for that template type.
3. Re-dispatch the Phase D worker: extends `scripts/extract-copy.mjs` with `--framework=<name>` flag and playbook-aware constraints (≤7-word hook, ≤12-word headline, etc.).
4. Run `npm run check` after each batch.

### 3. Custom Vite Renderer Phase 1 (agent: ac148ca790758e278 — quota hit early, ~15 tool uses only)

**State:** Barely started. Likely no files written yet. Plan still valid.

**What's on disk:** Nothing new from this agent that I can verify.

**What to do at resume:**
1. Re-read the original brief in this RESUME doc's git log (the dispatch was a single Agent call; recreate the brief from `docs/render-vite-roadmap.md` if it was created, else re-brief from scratch).
2. Audit HyperFrames CLI behaviors (Explore worker → `docs/hyperframes-cli-audit.md`).
3. Build `scripts/render-vite.mjs` (Playwright frame capture + ffmpeg encode).
4. Verify on `compositions/text-fx-demo.html` first (no audio mixing yet — Phase 2).
5. Output `docs/render-vite-roadmap.md`.

### 4. Smoke parallel-scene speedup (agent: a9576a1f595c5d109 — quota hit)

**State:** `scripts/smoke.mjs` was modified per the system reminder, but unclear how far it got. `npm run check` still passes (10/10), so any partial change is at least non-breaking.

**What to do at resume:**
1. Read `scripts/smoke.mjs` to see what was added.
2. Run `npm run smoke:diff` and time it. If it's already <2s, ship it. If still ~4s, finish the parallel-context work.
3. Goal: <1.5s for `smoke:diff`.

---

## Quick-resume commands

```bash
# Check state
git log --oneline -10
git status -s

# Verify everything still works
npm run check        # lint + lint:strict + smoke

# Pick up combo-fx batch-2 (highest priority — 6 combos blocking 22 templates)
# Re-read: docs/combo-fx-batch-2-plan.md
# Edit: design/modules/effect-fx.js (add rackFocus + radialMask + update export)
# Edit: design/modules/combo-fx.js (add 6 combos)
# Then: npm run build:bundle && npm run catalog && npm run check

# Pick up copy-apply (Phase C of copy supervisor)
# Read: docs/copy-playbook.md
# Apply to: compositions/templates/*.html + compositions/verticals/**/*.html
# Verify: npm run check after each batch

# Pick up Vite renderer Phase 1 (lowest priority — fresh start)
# Read: docs/RESUME-AT-3AM.md (this file) — recreate the brief
# Build: scripts/render-vite.mjs
# Test on: compositions/text-fx-demo.html
```

## Resume strategy — "finish everything + stay adaptive"

The user's explicit ask before quota cut-off: **"we want to make sure it gets everything done and does new things that may arise."**

That means at resume, do NOT just blindly execute the in-flight task list. Instead:

1. **First action: read this file + `LEARNINGS.md` §6 latest entry** to absorb context.
2. **Run `npm run check`** to confirm the project is still healthy.
3. **Audit `git status` + `git log --oneline -10`** to see what's committed vs uncommitted.
4. **Resume the 4 in-flight tasks in priority order:**
   - **Priority 1 (highest leverage):** finish combo-fx batch-2 (6 combos). The plan is ready at `docs/combo-fx-batch-2-plan.md`. The 2 primitives' helpers + CSS are already in place; just need the JS recipe functions + global export update.
   - **Priority 2:** finish copy-apply across 25 templates (Phase C from copy supervisor). The playbook is at `docs/copy-playbook.md`. This is the **80% lift** the user called out.
   - **Priority 3:** finish smoke parallel-scene speedup (small win, ~3× speedup on `smoke:diff`).
   - **Priority 4:** Vite renderer Phase 1 (proof-of-concept, fresh start).
5. **Stay adaptive** — when finishing any of these, watch for:
   - **New pitfalls surfacing in lint:strict warnings** → add detectors.
   - **Recurring patterns in template copy** → propose new copy frameworks.
   - **Missing combos discovered while applying templates** → add to a "batch-3 candidates" doc for future planning.
   - **New user asks** that come in mid-session — interpret + dispatch agents per the standing directives.
6. **Commit each completed piece** — don't pile up uncommitted work. The git log should read like an increment story.
7. **Update LEARNINGS §6** with a new increment-log entry for the resumed session.

When the in-flight 4 are done, scan §8 parking lot for the next-best candidate and propose it to the user, OR proceed via the "always be looking for stack improvements" standing directive if they're unavailable.

## Standing directives that still apply

From `LEARNINGS.md` §5.5:

1. **Always be looking for stack improvements** — the recursive-supervisor pattern works; keep dispatching agents.
2. **Always plan for long-term task completion + surface more as you go** — §8 parking lot is the roadmap.
3. **Always use as many subagents as possible** — fan out per task, supervisors can spawn workers.
4. **Commit regularly + in logical chunks** — the next session should commit each completed piece, not let work pile up.

## Final state summary

- **Commits this session: 4** (tooling · templates+verticals · orchestrator+LEARNINGS · production+docs).
- **Files added/modified by partial agents (uncommitted):** ~17.
- **Project lint+smoke status:** 10/10 passing.
- **Production MP4:** rendered + on disk (`renders/aivideomaker_2026-04-25_01-01-06-graded-wm.mp4`).
- **What's tested + working:** template library (8 structural + 17 vertical = 25 comps), 4 vibe templates, 13 module recipes + 10 combos, full URL→MP4 pipeline (`npm run video -- <url>`), bundled ffmpeg, lint:strict.
- **What's planned but not built:** 6 batch-2 combos (plan ready), Vite renderer (Phase 1 brief ready), copy-apply across 25 templates (playbook ready, application pending).

Resume at 3am Pacific/Auckland with `cat docs/RESUME-AT-3AM.md` for full context.
