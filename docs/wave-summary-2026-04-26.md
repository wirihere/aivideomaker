# Wave summary — 2026-04-26 session

> **Process note (added 2026-04-26):** This doc records the early-session
> wave-shipping pattern (16 parallel subagents). That pattern has since
> been **superseded** by the loop-until-perfect workflow in
> [docs/PROCESS.md](PROCESS.md). The waves below are kept for historical
> context — they shipped real infrastructure that's still load-bearing
> — but the breadth-first dispatching style they describe is no longer
> the operating model.

Across one session, dispatched 16 parallel subagents in three waves. This
doc consolidates verdicts so a cold-reading future-self has one place to
look. Per-topic detail lives in the linked docs.

## Tier 1 — high pain-relief, low risk

| # | Item | Status | Detail |
|---|---|---|---|
| 1 | Bundle ffmpeg via `@ffmpeg-installer/ffmpeg` | **DONE** | Already in `package.json` + `node_modules/@ffmpeg-installer/ffmpeg/win32-x64/ffmpeg.exe`. `scripts/lib/ffmpeg-path.mjs` resolves bundled first, system-PATH fallback. Tier-1 list was stale on this. |
| 2 | HyperFrames CLI version check | **DONE — no-op** | We're already on 0.4.26 (`npx` resolved latest). Optional pin recommended. See [hyperframes-upgrade-2026-04-26.md](hyperframes-upgrade-2026-04-26.md). |
| 3 | AI-assisted copy gen (`scripts/extract-copy.mjs`) | **PENDING** | Phase D of copy supervisor — gated on copy-apply finishing. |
| 4 | Custom lint rules from §4 pitfalls | **DONE** | `npm run lint:strict` ships 9 detectors gated as errors. Wave C extending with 3 more (`font-var`, `audio-no-clip`, `subcomp-currentscript`). |
| 5 | `npm outdated` audit | **DONE** | Only `@anthropic-ai/claude-agent-sdk 0.2.118 → 0.2.119` (patch). Everything else current. |

## Tier 2 — medium effort, real payoff

| # | Item | Verdict | Detail |
|---|---|---|---|
| 6 | Bun runtime swap | **WAIT** | Playwright on Windows + Bun is broken (oven-sh/bun#13543, won't fix). Revisit Q3 2026. Bun's other claims hold; the speedup ceiling for `npm run check` is ~100ms not ~800ms. See [bun-feasibility-2026-04-26.md](bun-feasibility-2026-04-26.md). |
| 7 | TypeScript for `scripts/` | **JSDOC-CHECKJS** | Full migration is 25–40h for 11.5k LOC. JSDoc + `checkJs` + `noEmit` is ~4h and covers the one real TS-shaped contract (`fix.mjs` ↔ `lint-strict.mjs` JSON). See [typescript-scripts-feasibility-2026-04-26.md](typescript-scripts-feasibility-2026-04-26.md). |
| 8 | Smoke parallel-scene speedup | **DONE** | Already shipped in `ca4b666` — `smoke` 0.9–1.0s, `smoke:diff` floors at ~2.0s (chromium launch is the floor). See [smoke-speedup-audit.md](smoke-speedup-audit.md). |
| 9 | WebCodecs frame capture | **WAIT** | Phase 3 of the Vite renderer (raw RGBA pipe + parallel BrowserContexts) gets ~2× without the migration. Re-evaluate if Phase 3 plateaus. See [webcodecs-feasibility-2026-04-26.md](webcodecs-feasibility-2026-04-26.md). |

## Tier 3 — speculative

| # | Item | Verdict | Detail |
|---|---|---|---|
| 10 | WebGL effects | **PROTOTYPE-NARROW** | Two effects (DOF bokeh + radial chromatic aberration) read visibly fake under CSS filters. Recommended: `twgl.js` + procedural canvas overlay (no `html2canvas` snapshot). 90% of the uplift at 10% of the cost. See [webgl-effects-feasibility-2026-04-26.md](webgl-effects-feasibility-2026-04-26.md). |
| 11 | Vite-based renderer | **DONE — Phase 1** | `scripts/render-vite.mjs` ships, 19.9s wall-clock for 6s comp, 0 deps beyond Playwright. Phase 2 (audio mix) + Phase 3 (raw RGBA + parallel contexts) queued. See [render-vite-roadmap.md](render-vite-roadmap.md). |

## What also shipped this session

- **Combo-fx batch-2** — 6 new combos (`glitchStamp`, `pricePop`, `testimonialReveal`, `focusPull`, `statGroup`, `spotlight`) + 2 new effect-fx primitives (`rackFocus`, `radialMask`). Commit `8395c9b`. 16-scene demo at `compositions/combo-fx-demo.html`. 29 catalog thumbnails. Fixes a latent `pick()` bug in `effect-fx.js`.
- **LEARNINGS §3 / §6 / §8** — combo-fx batch-2 entries + 8 explicitly deferred candidates to prevent relitigation.
- **Streamline scout proposals** — 5 ranked, 3 dispatch-ready ([streamline-proposals-2026-04-26.md](streamline-proposals-2026-04-26.md)). Wave C in flight implementing #3, #4, #5.
- **Lint detector scout proposals** — 3 dispatch-ready ([lint-detector-proposals-2026-04-26.md](lint-detector-proposals-2026-04-26.md)). Wave C in flight implementing all 3.

## Pending / in-flight at session end

- **Copy-apply** across 25 templates (long-running supervisor) — Phase C of the copy playbook rollout.
- **Wave C implementers** — renders-prune, asset-cache extension, 3 lint detectors, `npm run help` self-doc.
- **Tier 1 #1** — `@ffmpeg-installer/ffmpeg` npm bundle, held until package.json edits settle.
- **Tier 1 #3** — extend `extract-copy.mjs` with `--framework` flag (Phase D of copy supervisor).
- **Stale smoke baselines** — `smoke:diff` reports 4 scenes at 25.20% pixel-changed; refresh with `npm run smoke:baseline` next session.

## Standing directives still active

(LEARNINGS §5.5)
1. Always look for stack improvements — surface to §8 parking lot.
2. Plan long-term completion via §8.
3. Use as many parallel subagents as possible.
4. Commit regularly + in logical chunks.
