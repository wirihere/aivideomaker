> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# CLI ergonomics audit — 2026-04-27

Scope: every npm script in `package.json`, the `npm run video` orchestrator, the `npx hyperframes` vendor CLI, plus loose `scripts/*.mjs` files.

---

## 1. npm-script inventory (51 entries)

`scripts/help.mjs` already auto-discovers every entry, parses the first non-shebang comment line, infers a group, and prints an aligned table. `npm run help -- --md` emits markdown for QUICKSTART. **This works well — `help.mjs` is the right tool, it's just under-promoted in PROCESS.md and README.**

| Script(s) | Group | Purpose |
| --------- | ----- | ------- |
| `build:bundle`, `watch:bundle` | build | Concat `design/modules/*.{css,js}` into `bundle.{css,js}` |
| `new:comp`, `new:scene` | new | URL → composition / TTS-first scene scaffolders |
| `new:copy`, `copy:gen` | new | URL + template → narration script — **two aliases for one script** |
| `suggest:comp` | other | Deterministic comp suggester (no LLM) |
| `comp:write`/`:check`/`:list`, `check:heads`, `comp:diff` | catalog | Composition versioning manifest + structural diff |
| `preview`, `preview:simple` | preview | `hyperframes preview` vs standalone Node server |
| `lint`, `lint:strict`, `fix`, `fix:apply`, `check` | lint | `check` chains lint + lint:strict + check:heads + smoke + smoke:cli |
| `smoke`, `:shots`, `:diff`, `:baseline`, `:contrast`, `:cli` | preview | Playwright pre-render; `:cli` is the only non-Playwright variant |
| `render`, `render:vite`, `render:queue` | render | Three renderers (see issue #1) |
| `renders:list`, `:prune` | renders | `.keep`-aware MP4 GC under `renders/` |
| `video` | video | Orchestrator (URL → MP4) |
| `cache:stats`, `:clear` | cache | Content-addressed asset cache |
| `pull:assets`, `pick:music`, `music:catalog` | fetch | Per-stage workers, also called by `video.mjs` |
| `voices:preview`, `audio:duck`, `catalog` | other | Edge-TTS sampler / spectral duck / GSAP-recipe catalog |
| `backup:save`/`:list`/`:restore`/`:prune` | other | Workspace checkpoint/rollback |
| `verify`, `:assembled`, `:fix` | verify | Playwright script-vs-visual checker (silent-loop gate) |
| `health` | other | Read-only pre-flight (lint + smoke:cli + tokens + ledger summary) |
| `usage`, `:unused` | other | Asset/module reference graph |
| `help`, `test` | other | Help is auto-discover; `test` is a stub |

---

## 2. The `npm run video` orchestrator — 14 flags, 1 positional

The header doc-comment (lines 1-60) is comprehensive, but **`--help` only prints a 6-line banner**. To learn `--allow-watch`, `--use-legacy`, `--framework`, `--aspects`, you must open the source.

| Flag | Purpose | In `--help`? |
| ---- | ------- | ------------ |
| `<url>` positional, `--seconds=N`, `--template=`, `--name=`, `--no-render`, `--keep-artifacts`, `--dry-run` | core | yes |
| `--framework=<AIDA\|PAS\|FAB\|STAR\|BAB\|Heros-Journey\|Transformation\|Q-Payoff\|Sensory>` | copy framework override | no |
| `--with-music`, `--no-tts`, `--no-verify`, `--auto-fix` | toggles | no |
| `--allow-watch` | render despite `watch` verdict; also unblocks `iterating` templates | no |
| `--use-legacy` | render against `legacy` template (default: blocked) | no |
| `--aspects=<9:16,1:1,16:9\|all>` | multi-aspect cover-crop pass | no |

No `--vibe`, `--brand`, or `--register` flag exists despite the prompt's conjecture — vibe is derived from `TEMPLATE_REGISTRY[name].vibe`, brand from URL.

---

## 3. Awkward UX issues

**#1 — Three renderers, no clear default note.** `render` (production wrapper around `hyperframes render` + post-grade), `render:vite` (in-repo Phase-1-6 PoC, not used by `video.mjs`), and `render:queue` (forwards to `render.mjs`) all sit at the same level in `package.json`. The orchestrator itself shells out to `npx hyperframes render` directly, bypassing all three. New operators can't tell which is canonical. **Fix:** rename `render:vite` → `render:vite-experimental`.

**#2 — `video --help` is 6 lines for a 14-flag command.** Already-parsed metadata is right there in the header comment. **Fix:** when `--help` is detected, dump the header comment block (~5 lines of code).

**#3 — `usage:unused` reports 423 cleanup candidates as a flat list.** Includes baselines, all 16 vertical templates, 24 unwired Lucide icons, and active brand-capture artifacts. Without grouping by reason or last-modified, the list isn't safely actionable. **Fix:** add `--age=<days>` and `--top=<N>` flags to `scripts/usage.mjs`.

**#4 — `new:copy` and `copy:gen` are duplicate aliases.** Both run `node scripts/extract-copy.mjs`; neither is flagged deprecated; neither is canonical in LEARNINGS. **Fix:** drop `new:copy`. The four `comp:*` aliases are fine — each maps to a distinct verb.

**#5 — Vendor version skew is silent.** `npx hyperframes doctor` reports `0.4.26 → 0.4.31 available`, but nothing surfaces this during normal use. **Fix:** extend `npm run health` to compare installed vs latest hyperframes.

**#6 — `RENDER_PROGRESS=off` and `--no-progress` are equivalent but only `--no-progress` is documented in `render.mjs` line 16.** Minor; just under-surfaced.

---

## 4. Proposed shortcut commands

Common patterns from LEARNINGS / QUICKSTART / PROCESS:

| Pattern | Frequency | Proposed shortcut |
| ------- | --------- | ----------------- |
| `video -- <url> --no-render --keep-artifacts --name=<slug>` | very common (assemble + inspect) | `npm run video:assemble -- <url> --name=<slug>` |
| `video -- <url> --with-music --no-render --keep-artifacts` | proof-run pattern | `npm run video:proof -- <url>` |
| `video -- <url>` | full pipeline | `npm run video:full -- <url>` (alias for clarity) |
| `video -- --dry-run` | smoke-test orchestrator | already trivial |

These are pure `package.json` aliases — no orchestrator changes, ~3 lines.

**Flag rationalization:** `--help` should explicitly state defaults: `tts=on, verify=on, render=on, music=off`. `--allow-watch` and `--use-legacy` could collapse into `--bypass-gates=watch,legacy` but the breakage isn't worth it.

---

## 5. Orphaned scripts (cleanup candidates)

Verified by grep across `scripts/`, `docs/`, `package.json`, `LEARNINGS.md`. "0 refs" = no caller anywhere except the file itself.

| Script | Refs | Action |
| ------ | ---- | ------ |
| `scripts/_tmp_capture_assembled_frames.mjs` | self only | **delete** (one-shot kindred-nz capture) |
| `scripts/_tmp_capture_faq_frames.mjs` | self only | **delete** (one-shot motion check) |
| `scripts/_tmp_check_faq_template.mjs` | self only | **delete** (one-shot template load) |
| `scripts/preview-brand-animations.mjs` | self only | **delete** (one-shot screenshot) |
| `scripts/combo-discovery.mjs` | 0 | **archive** — output already committed in `combos/candidates/` |
| `scripts/fetch-pexels.mjs` | 0 | **archive** unless Pexels coverage planned |
| `scripts/fetch-undraw.mjs` | 0 | **archive** unless wired |
| `scripts/fetch-unsplash.mjs` | 0 | **archive** unless planned |
| `scripts/fetch-tts-google.mjs` | 0 | **archive** (Edge TTS is the path) |
| `scripts/fetch-tts-streamelements.mjs` | 0 | **archive** |
| `scripts/lint-sweep.mjs` | self only | **investigate** — name suggests recursive lint; may already be replaced by `npm run lint` |
| `scripts/templates-baselines.mjs` | 2 | **add `npm run baselines:templates`** — called by skills, not exposed |
| `scripts/frame-flipbook.mjs` | 4 | **add `npm run flipbook`** — central to silent loop, not in package.json |
| `scripts/extract-amp.mjs` | 1 | **add `npm run amp -- <audio>`** for ad-hoc baking |

Active scripts confirmed by reference count (leave alone): render-vite, render-queue, smoke-cli, verify-render, preview-voices, backup, pick-music, pull-assets, renders-prune, fetch-pixabay-music, fetch-tts-edge, post-grade, fingerprint-brands.

---

## 6. Error messages, dry-run, verbosity — already in good shape

**Error messages.** Spot-checked all `console.error` and `throw new Error` in `video.mjs` and `render.mjs` (~30 sites). Every one names the failing stage, the bad value, and valid alternatives:

- `✗ unknown --aspects value "42:1". Valid: 9:16, 1:1, 16:9 | all | comma-list`
- `Unknown template "foo". Pick from: social-reel, hero-promo, ...`
- `verify failed (verdict=watch)\n  report: <path>\n----\n<tail>`

The bundled-ffmpeg story is solved (LEARNINGS §3) — every project script routes through `scripts/lib/ffmpeg-path.mjs`. Only the HyperFrames vendor CLI itself still hits PATH for ffmpeg in some paths; out of scope here.

**Dry-run coverage.** `npm run video -- --dry-run` writes synthetic `tokens-dryrun-test.css` + `dryrun-test.{copy,meta,music}.json`, uses 60-180ms deterministic delays so the parallel-batch wall-clock log is meaningful, hard-skips render, runs `lint` only (full `check` would launch Playwright). Target <5s, actual ~3s. `--dry-run` implicitly OR's into `skipRender`, `skipVerify`, `allowWatch`, `useLegacy` — no surprise gating. `try/finally` keeps the working tree clean. `scripts/smoke-cli.mjs` asserts the parallel-batch line prints. Solid.

**Verbosity.** `RENDER_PROGRESS=off` / `--no-progress` reverts to silent inherit-stdio (CI). `--keep-artifacts` is opt-in. HyperFrames CLI has `--quiet` and `--strict`/`--strict-all`. `npm run health` reports 66 warnings, but those are pre-existing cross-comp false positives, not lint noise. No flag is too verbose by default.

---

## Summary of recommendations

1. **Add full-help to `video.mjs --help`** — dump the header comment block (~5 lines).
2. **Rename `render:vite` → `render:vite-experimental`** — surfaces it's not the production renderer.
3. **Add `npm run video:assemble`, `:proof`, `:full` aliases** — encode the recurring invocation shapes.
4. **Surface `npx hyperframes upgrade` in `npm run health`** — version skew is currently silent.
5. **Delete 4 orphans** (3 `_tmp_*.mjs` + `preview-brand-animations.mjs`); **archive 6 unused fetchers** (pexels, undraw, unsplash, tts-google, tts-streamelements, combo-discovery).
6. **Add `npm run flipbook`, `baselines:templates`, `amp`** — scripts reachable via skills/orchestrator but not via direct npm.
7. **Drop `new:copy` alias.**
8. **Extend `usage.mjs`** with `--age=<days>` and `--top=<N>` filters so `:unused` is actionable.

`help.mjs`, error messages, dry-run, and cache hygiene are all in good shape. The fixes above are mostly polish — adding ~50 lines across `package.json`, `video.mjs`, `usage.mjs`, `health-check.mjs` would close every gap.
