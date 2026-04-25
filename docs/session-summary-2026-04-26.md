# Session summary — 2026-04-26 (cold-read entry point)

**Read this first** when starting the next session. Tells you what shipped, where each tool lives, what's parked with a verdict, and the 2-3 best next-session candidates.

## Headline

**32 commits since `ca4b666`**. Pipeline got faster, safer, better-instrumented, and gained ~10 new tools.

## What shipped, by outcome

### Faster renders
- **Vite renderer Phase 1→6** (`scripts/render-vite.mjs`) — Playwright + ffmpeg, parallel BrowserContexts, JPEG intermediate, CDP screenshots, raw-RGBA scaffold.
- **Measured speedup**: 1.75× total (Phase 4) on `kindred-recut` 540 frames vs single-worker baseline. Phase 5 (CDP) shipped at-parity (see `065c54f` honest correction). Phase 6 (raw-RGBA via `[data-render-canvas]`) waits for a comp to opt in.
- **Live progress bar** for `npm run render` — `scripts/lib/render-progress.mjs`.

### Cleaner pipeline
- **Single-source `<head>`** — `design/compose-head.html` + hydrate pass in `build-bundle.mjs`. Editing one file fans out across 25 templates.
- **DEP0190 spawn warnings gone** — `scripts/lib/platform-bin.mjs` exposes `node`/`npmCliJs`/`npxRunArgs`. No `shell:true` anywhere.
- **Pinned `hyperframes@0.4.26`** (exact, no caret).

### New tools (all `npm run X`)
- `help` — auto-doc all scripts from leading-comment blocks
- `usage` / `usage:unused` — asset/module/token usage graph
- `voices:preview` — synth a 4s sample with every Edge TTS voice
- `audio:duck` — spectral sidechain (voice over music, 3 styles: podcast / cinematic / tiktok)
- `music:catalog` — Pixabay → `assets/music/.catalog/<vibe>.json`
- `comp:diff` — structural diff between two compositions
- `backup:save / list / restore / prune` — snapshot the authored surface
- `renders:list / prune` — disk hygiene
- `smoke:cli` — 12 fast CLI tests (~5s, in `npm run check` chain)
- `suggest:comp` — deterministic template ranker for (vibe, duration, vertical, framework)
- `copy:gen` — Anthropic-API copy generator gated by 9 frameworks

### Safety (lint:strict now 17 detectors)
- 3 new (Wave C): `font-var`, `audio-no-clip`, `subcomp-currentscript`
- 2 new (Wave E): `video-bleed-guard`, `repeat-no-final-set`
- 3 new (Wave H#2): `narration-mid-tween`, `track-index-collision` (error), `scene-overlap-visual`

### Cinematic effects (opt-in WebGL)
- `design/modules/shader-fx.js` (815 LOC) — `shaderFx.dof` (bokeh), `shaderFx.chroma` (radial RGB split), `shaderFx.glow` (god-rays). Vendored `design/vendor/twgl.min.js`. Demo at `compositions/shader-fx-demo.html`.
- **Not in auto-bundle** — opt-in via `<script src="design/modules/shader-fx.js">`. See [docs/webgl-bundle-regression-2026-04-26.md](webgl-bundle-regression-2026-04-26.md) for why.

## Parked with verdicts

| Item | Verdict | Source |
|---|---|---|
| Bun runtime swap | WAIT until Q3 2026 (Playwright+Win+Bun broken) | [bun-feasibility-2026-04-26.md](bun-feasibility-2026-04-26.md) |
| TypeScript scripts | JSDOC-CHECKJS, defer full migration | [typescript-scripts-feasibility-2026-04-26.md](typescript-scripts-feasibility-2026-04-26.md) |
| WebCodecs | WAIT for Phase 6 plateau | [webcodecs-feasibility-2026-04-26.md](webcodecs-feasibility-2026-04-26.md) |
| WebGL effects | DONE — DOF + chroma + glow shipped | (this session) |
| HyperFrames CLI bump | DONE — pinned to 0.4.26 | (this session) |
| WebGL auto-bundle | KEEP OPT-IN — no fix found | [webgl-bundle-regression-2026-04-26.md](webgl-bundle-regression-2026-04-26.md) |

## Best next-session candidates

1. **Real `npm run video -- <url>` end-to-end** — pick a brand URL, watch the full pipeline run, surface friction. ~10 min, high signal.
2. **`font-var` migration + lint promotion** — 482 sites to rewrite from `var(--font-x)` → direct names + `@font-face`, then flip detector to error. Multi-hour but unblocks compiler determinism warnings.
3. **WebGL Phase 4 (real DOM sampling)** — pixel-true bokeh via canvas snapshot of DOM content (currently procedural-only). Needs a working `Page.captureScreenshot` → texture path. Multi-day.

## Session standing directives (still active)

1. Always look for stack improvements — surface to LEARNINGS §8.
2. Plan long-term completion via §8.
3. Use as many parallel subagents as possible.
4. Commit regularly + in logical chunks.

## Memory feedback this session
- [Plain-language status updates](../../../.claude/projects/C--Users-wirihere-aivideomaker/memory/feedback_plain_language.md) — group ships by outcome (faster/cleaner/safer/new tool); names + hashes are supporting detail not headline.
