> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# 12 — Test Coverage Audit (2026-04-27)

## TL;DR

There are **two integration smoke tests** (Playwright + CLI), **zero unit tests**, **zero CI**, and **one shallow pre-commit hook**. The visual-regression baselines for `index.html` are **missing entirely** (not just stale — the previous baseline was for a different composition). 25 of 25 vertical/structural templates have visual baselines via `templates-baselines.mjs`, but the 4 newly-shipped `compositions/templates/sacred-oracle/*.html` files are **not** covered. The MP4 itself is never validated post-render. The "silent-loop is non-negotiable" rule is partially enforced inside `video.mjs` (verdict=watch blocks render) but is bypassed entirely by the standalone `npm run render` path and by `--allow-watch`.

---

## 1. Inventory of tests

| Test                            | File                              | What it tests                                                                                                                                                                                                                          | Last touched   | Runtime (this box) |
| ------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------ |
| Playwright smoke (`npm run smoke`)               | `scripts/smoke.mjs`               | Loads active comp in headless Chromium; checks: timeline registered, ≥5 tweens, gsap loaded, modules `textFx/effectFx/glitterFx/ampBind` present iff referenced, root dims match `data-width/height`, no console errors. Optional flags: `--screenshots`, `--diff`, `--baseline`, `--contrast` (WCAG AA per scene midpoint). | 2026-04-26 (last edit) | ~6.6s with `--screenshots --diff` (`--start` adds preview spawn), <1s without screenshots |
| CLI smoke (`npm run smoke:cli`) | `scripts/smoke-cli.mjs`           | Spawns 13 CLI scripts with safe args (`--dry-run`, `--list`, etc.) and asserts exit-0 + a regex on stdout. Covers: help, usage, cache:stats, renders:list, audio-duck, preview-voices, comp-diff, comp-manifest heads, extract-copy, backup, suggest-comp, **video.mjs --dry-run** (full orchestrator path). | 2026-04-26 12:22 | 9.1s, all 13 pass |
| `npm run check`                 | `package.json` script             | `lint && lint:strict && check:heads && smoke && smoke:cli`. **Confirmed** matches LEARNINGS spec.                                                                                                                                       | n/a            | ~16s + smoke (≈25s) |
| Templates baseline (`scripts/templates-baselines.mjs`) | manual                            | Generates per-scene PNGs for every composition under `compositions/templates/` and `compositions/verticals/` using `file://` URLs. **Not wired into smoke or check** — must be run manually. Output drives `docs/baselines-index.html`. | n/a            | not run this audit |
| Pre-commit hook                 | `.git/hooks/pre-commit` → `scripts/pre-commit-build.mjs` | If staged files match `design/modules/*.{css,js}`, `design/compose-head.html`, `compositions/templates/*.html`, etc., re-runs `build:bundle` and re-stages outputs. **No tests**. Fails the commit only if the bundle build fails. | n/a            | <1s typical |
| `verify-render.mjs`             | `scripts/verify-render.mjs`       | Verifier — runs against the **assembled HTML composition**, not the rendered MP4. Catches placeholder leakage, brand fidelity, pacing, accessibility, motion continuity (PNG-byte-diff between adjacent scene timestamps). Writes `docs/render-learnings/<slug>-<stamp>.{json,md}` and appends to `LEDGER.md`. | active         | ~30s typical |

**Unit tests: zero.** No `*.test.mjs`, no `__tests__/`, no `vitest`/`jest`/`mocha` in `devDependencies`. The `package.json` `test` script is the default `echo "Error: no test specified" && exit 1`.

**E2E: zero.** Nothing exercises `npm run video <url>` end-to-end against a real network URL and asserts a valid MP4 lands on disk. The closest is `smoke-cli.mjs`'s `scripts/video.mjs --dry-run`, which short-circuits all child spawns and network calls.

**CI: none.** No `.github/workflows/`, no `.husky/`, no `lefthook.yml`. The lone git hook is `pre-commit-build.mjs`.

---

## 2. Coverage matrix

| Pipeline stage                      | Covered by                        | Gap |
| ----------------------------------- | --------------------------------- | --- |
| URL scrape (`scripts/lib/scrape-page.mjs`) | none                              | No unit test, no fixture, no offline replay. Network failure surfaces only at runtime. |
| Brand-token extraction (`extract-copy.mjs`, `pick-music.mjs`) | smoke:cli `--dry-run` only       | Validates the prompt header prints; does **not** validate token JSON shape, color extraction logic, or music shortlist correctness. |
| Template selection (`lib/template-status.mjs`) | none                              | The wave-Q-fixed `chosenTemplate` scope bug (commit 07cdd83) had no test then and has no test now. Same class of bug could regress. |
| Composition assembly (`video.mjs` Stages 5-6) | smoke:cli `--dry-run`            | Asserts the wall-clock log line exists; does not validate the assembled HTML lints, has correct timing, or registers a timeline. |
| Lint + lint:strict                  | `check`                           | Covered. |
| HEAD-INCLUDE drift (`comp-manifest.mjs heads`) | check + pre-commit-build         | Covered (build-bundle regenerates pre-commit). |
| Visual smoke (timeline, modules, dims, console errors) | `smoke`                          | Covered for the **active** composition (whatever `index.html` currently is). |
| Visual regression (pixel diff)      | `smoke:diff` (manual baselines)   | **Baselines for current `index.html` (singularity-convergence) are missing — 10/10 scenes warned "no baseline" on this run.** Previous baselines were `s1-s4` for an old comp. |
| Template visual baselines           | `templates-baselines.mjs` (manual) | 25 verticals + structural covered; **4 sacred-oracle templates have no baseline** (just shipped today). |
| Contrast audit                      | `smoke --contrast`                | Optional flag, not in `check`. The Kindred 2.9:1 incident (LEARNINGS §4) could regress silently. |
| Render output (MP4 validity)        | none                              | Nothing ffprobes the rendered MP4 to assert duration / audio stream / dimensions / non-zero size. `verify-render.mjs` runs against the **HTML**, not the MP4. |
| Verifier verdict gate               | `video.mjs` only                  | `--allow-watch` overrides; `npm run render` (standalone) bypasses verify entirely. |
| End-to-end (`video <url>`)          | none                              | No real-URL fixture or smoke. |

---

## 3. Top 5 gaps where regressions could slip through

1. **`index.html` has no visual baseline.** Smoke ran clean today with 10 "no baseline" warnings. A 30% pixel regression on the active comp would be invisible to `npm run check`. Worse: every time `index.html` is swapped for a new brand (the daily workflow), the previous baselines become useless and nobody refreshes them.
2. **Sacred-oracle templates have no baseline.** Shipped today, 4 HTML files, zero coverage. A future bundle regen or design module edit could break them silently.
3. **No MP4 validation.** After `render.mjs` lands a `.mp4`, nothing checks: duration matches comp duration, audio stream present, dimensions = 1080×1920 (or declared), file size > some floor. The "audio gap" findings in LEDGER are caught **before** render via verify-render, not after.
4. **No unit tests on `lib/scrape-page.mjs`, `pick-music.mjs`, `template-status.mjs`, `extract-copy.mjs`.** The orchestrator is built from these libs, all change-prone, all silent on regression. The `chosenTemplate` scope bug (commit 07cdd83) is the cautionary tale — fixed once, will regress if anyone refactors `template-status.mjs`.
5. **Silent-loop rule is bypassable.** The `verdict: watch → render BLOCKED` gate lives only in `video.mjs:1440-1456`. `npm run render` (standalone) ignores it. `--allow-watch` overrides it. The user's memory rule "Silent loop is non-negotiable, never ship on watch" is enforced by **convention**, not by the system. A pre-render hook that reads the most recent LEDGER row for the current slug and refuses if verdict ≠ ship would close this.

---

## 4. Proposed additions, ranked by leverage

| # | Addition                                                          | Leverage | Cost     |
| - | ----------------------------------------------------------------- | -------- | -------- |
| 1 | **Wire `templates-baselines.mjs` into `npm run check`** (or a new `check:visual`) — re-render baselines for templates/verticals, diff against committed PNGs, fail on >5% delta. Catches gaps #1 and #2 in one shot. | very high — single command catches 30 templates including the new sacred-oracle | medium — already mostly built; need to commit baseline PNGs and add a diff mode |
| 2 | **Post-render MP4 validator (`scripts/verify-mp4.mjs`)** — ffprobe the MP4: duration ±0.5s of comp, audio stream present and ≥−40 dB peak, video stream dims match `data-width/height`, file size > 100 KB. Wire into `render.mjs` as a final stage; fail loud. | high — catches silent renders, missing audio, wrong aspect | low — ~80 lines |
| 3 | **Unit tests for `lib/template-status.mjs` + `lib/scrape-page.mjs`** — add `vitest` (no dep weight, ~7 MB), 5-10 tests per module, fixture-based (offline). Catches scope bugs and HTML-shape regressions. | high — first unit-test footing, exemplar for the rest | medium — a session of work |
| 4 | **Auto-baseline-on-comp-change** — when `index.html` changes (detected via git hook or `video.mjs` post-assembly), automatically regenerate `smoke/.baseline/<scene>.png` and stage them. Eliminates the "stale baselines" drift permanently. | medium — fixes the recurring stale-baseline complaint | low — 30 lines bolted onto `pre-commit-build.mjs` |
| 5 | **Verifier-gate enforcement at `render.mjs`** — read `docs/render-learnings/LEDGER.md`, find the latest verdict for the slug being rendered, refuse if ≠ ship (allow `--allow-watch` for explicit overrides). Closes the silent-loop bypass. | medium — system-enforces a rule that is currently honor-system | low — ~30 lines |

---

## 5. Minimum viable CI recommendation

There is no CI. Given the project scope memory (`project_scope_claude_code_only` — "not productionised, don't over-engineer for external/automated use"), full GitHub Actions may be overkill, but **a single 30-second local pre-push hook** would close the worst gaps:

**Recommendation: extend `pre-commit-build.mjs` into a tiered hook system, or add a `pre-push` hook:**

```
.git/hooks/pre-push  →  node scripts/pre-push.mjs
```

`scripts/pre-push.mjs` runs (in order, fails on first non-zero):

1. `npm run lint:strict`             (~1s)
2. `npm run check:heads`             (<1s)
3. `npm run smoke:cli`               (~9s)
4. `npm run smoke -- --start --diff` (~7s if baselines exist; warns-only if missing)

Total: ~17-20s. No remote dependency, no GitHub Actions cost, mirrors the `check` script minus the visual smoke that requires a live server already running.

**If GitHub Actions is later wanted** (e.g. for pull requests from agents in worktrees), one workflow file `.github/workflows/check.yml` running `npm ci && npm run check` against ubuntu-latest is adequate — the project has only 3 runtime deps (`@ffmpeg-installer/ffmpeg`, `edge-tts-universal`, `gsap`) and 3 devDeps, so caching is trivial.

---

## Appendix — fresh `smoke:diff` run, 2026-04-27

```
▶ smoke: localhost:3002 (project: aivideomaker)
  ✓ page loaded
  ✓ timeline registered: singularity-convergence
  ✓ timeline has 294 tweens, 61.40s
  ✓ gsap loaded
  ✓ module textFx/effectFx/glitterFx/ampBind loaded
  ✓ root dims 1080×1920 match actual 1080×1920
  ✓ no console/runtime errors
  ✓ screenshot smoke\b0..b9 (10 scenes)
  ⚠ no baseline for b0..b9 — run `npm run smoke:baseline` to create
◇ 20 passed · 10 warnings · 0 failed (6.6s)
```

Existing baselines on disk: `smoke/.baseline/{s1,s2,s3,s4}.png` — for an obsolete comp (the kindred-recut variant). Current `index.html` declares scenes `b0..b9`. Conclusion: **baselines are not stale, they are absent for the active composition.** Running `npm run smoke:baseline` would create 10 new files but they would be obsolete the next time `index.html` is swapped — pointing to the auto-baseline-on-comp-change addition above.
