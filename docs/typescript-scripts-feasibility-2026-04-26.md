# TypeScript for `scripts/` — Feasibility (2026-04-26)

## Verdict: **JSDOC-CHECKJS**

Add `tsconfig.json` with `allowJs` + `checkJs` + `noEmit`, layer JSDoc types on
high-leverage scripts, keep `.mjs`. Defer full `.ts` rename until a bug shows
up that JSDoc can't catch.

Why: this is a Claude-Code-only pipeline (per project memory). 90% of the
surface is `spawnSync` plumbing, file I/O, and HTML string munging — none of
which TS strongly types. Marginal bug-catch over `lint:strict` is small; the
friction of a build/loader step on every `npm run *` is not.

## Inventory

`scripts/**/*.mjs` — **38 files, 11,531 LOC** (lib/ included).

| Bucket             | Files                                                                                              | LOC   | Complexity | TS leverage                                     |
| ------------------ | -------------------------------------------------------------------------------------------------- | ----- | ---------- | ----------------------------------------------- |
| Orchestration      | `video.mjs`, `fix.mjs`, `lint-strict.mjs`, `lint-sweep.mjs`, `smoke.mjs`                           | 2,265 | High       | **High** — flag parsing, JSON payloads, exit codes |
| Composition gen    | `new-comp.mjs`, `new-scene.mjs`, `extract-copy.mjs`, `extract-amp.mjs`, `comp-manifest.mjs`         | 2,383 | High       | **Medium** — string templating dominates       |
| Build/render       | `render.mjs`, `render-vite.mjs`, `render-queue.mjs`, `build-bundle.mjs`, `watch-bundle.mjs`, `post-grade.mjs`, `gen-sfx.mjs` | 1,823 | Medium     | **Medium** — Playwright + ffmpeg shell-outs    |
| Asset fetchers     | `pull-assets.mjs`, `fetch-*.mjs` (×11), `pick-music.mjs`                                            | 2,538 | Medium     | **Low** — HTTP + buffer plumbing               |
| Catalog/baselines  | `build-catalog.mjs`, `templates-baselines.mjs`, `preview-brand-animations.mjs`, `preview.mjs`       | 1,798 | Medium     | **Medium** — recipe-registry shape would benefit |
| `lib/`             | `asset-cache.mjs`, `ffmpeg-path.mjs`, `usage.mjs`                                                   | 488   | Low        | **High** — small surface, many call sites       |

Top 5 by LOC: `build-catalog` (1094), `pull-assets` (760), `extract-copy` (677),
`fix` (652), `video` (639).

## Public APIs the scripts consume

| API                            | Types?                | Used in scripts? |
| ------------------------------ | --------------------- | ---------------- |
| Node built-ins (fs, path, child_process, https, crypto) | First-party `@types/node` | Everywhere (65 spawn calls across 18 files) |
| `playwright`                   | Bundled `index.d.ts`  | 10 scripts       |
| `@ffmpeg-installer/ffmpeg`     | Untyped (CJS, returns `{ path }`) | `lib/ffmpeg-path.mjs` |
| `edge-tts-universal`           | Has TS types (1.4)    | 3 scripts        |
| HyperFrames CLI                | Consumed via `spawn`/`spawnSync`, not as a JS module | `npm run lint`, `npm run preview` |
| `@anthropic-ai/claude-agent-sdk` | Strong TS types     | **Declared in `package.json` but not imported in `scripts/`** as of today |

The agent-SDK angle the user raised is real but currently latent — when it does
get wired in, that one file genuinely benefits from TS, and you can author it
as `.ts` standalone without converting the whole tree.

## Cost / risk of full migration

- **Loader tax.** `tsx` cold-start in late-2025 measurements is 200–500 ms vs
  Node ~50 ms. `swc-node` is ~120–200 ms but flakier on Windows ESM. `ts-node`
  is 600 ms+. `video.mjs` `spawnSync`s 6+ children — each child pays the tax
  again. Estimate **+1.5–4 s** per `npm run video`.
- **CI gate cost.** `tsc --noEmit` adds ~3–6 s. JSDoc + `checkJs` is the same
  cost — the question is whether the rename buys extra over that.
- **Migration hours.** `tsconfig` + types: **1 h**. Top 5 files (`video`,
  `fix`, `lint-strict`, `smoke`, `extract-copy`): **8–12 h**. `lib/`: **2 h**.
  Long tail (33 fetchers/glue): **15–25 h**. Finish: **25–40 h**. 80% value: **10–14 h**.
- **`package.json` churn.** 30+ `"node scripts/x.mjs"` entries flip to
  `"tsx scripts/x.ts"`. Mixed-extension period invites silent fall-throughs.
- **Doc drift.** `CLAUDE.md`, `LEARNINGS.md`, cold-read prompts all hard-code
  `scripts/*.mjs` paths.

## What `lint:strict` already catches

`scripts/fix.mjs` already detects: stray `</script>` literals, `tl.from()` opacity
traps, autoplay-guard absence, CDN GSAP, audio-id drops, overlapping audio
tracks, redundant `cards.css` overrides, and several others. **None of those are
type errors** — they're HTML/CSS/timeline pitfalls. TS would not catch any of
them. The actual JS-side bugs we've hit historically (per recent commits and
LEARNINGS) cluster around: ffmpeg arg ordering, file path resolution on Windows,
and JSON-payload shape between scripts. Of those:

- **ffmpeg args** — typed string arrays don't help; the bugs are semantic.
- **Path resolution** — already covered by `path.resolve(__dirname, ...)`.
- **JSON-payload shape between `fix.mjs` ↔ `lint-strict.mjs`** — *this* is where
  TS adds real value. JSDoc on the payload type at the boundary captures it.

## Recommendation

1. **Now (1 h):** add `tsconfig.json` with `allowJs: true`, `checkJs: true`,
   `noEmit: true`, `strict: false`, `target: "es2022"`, `moduleResolution: "bundler"`.
   Add `npm run typecheck` → `tsc -p . --noEmit`. Wire into `npm run check`.
2. **Next (3–4 h):** add JSDoc `@typedef` blocks for the cross-script JSON
   contracts: `fix.mjs` finding payload, `extract-copy.mjs` copy.json shape,
   `pull-assets.mjs` manifest. Annotate the public functions in `lib/`.
3. **Defer:** full `.mjs → .ts` rename until either (a) `claude-agent-sdk` gets
   meaningfully wired into a new orchestrator script — author *that* one as
   `.ts` natively via `tsx`, or (b) we hit a class of bug `checkJs` provably
   misses.

If the GO call later does come, **migrate in this order** (high-LOC × high-leverage):
`lib/*.mjs` → `fix.mjs` → `lint-strict.mjs` → `video.mjs` → `extract-copy.mjs`
→ `smoke.mjs` → everything else.

## Risk if we say no today

Low. The codebase is small, the bug history is HTML/timeline-shaped not
type-shaped, and `checkJs` gives us the escape hatch the moment a typed
contract earns its keep.
