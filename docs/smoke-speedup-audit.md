# Smoke parallel-scene speedup — audit (2026-04-26)

## Status: DONE for `smoke`, FLOORED for `smoke:diff`

The parallelization landed cleanly in commit `ca4b666` (188 inserts in
`scripts/smoke.mjs`). Scene work runs in parallel via `Promise.all` over a
prewarmed pool of `BrowserContext`s, with scene 1 reusing the probe page to
skip a full nav. No worker pool dependency was added.

## Code review of `scripts/smoke.mjs`

- `prewarmedContexts` (line ~287) — up to 5 unstubbed contexts whose navs
  start in parallel with the probe nav, so their nav cost overlaps with it.
- Probe page is asset-stubbed (images/fonts/media → 204) for non-screenshot
  runs, then reused as scene 1 for screenshot runs (when stubs are off).
- `runScene` fans out per-scene work (inject helpers, pause CSS, seek, shot,
  diff) on each scene's own page, in parallel, with stable scene-order
  output via report buffering.

## Timings (5 runs each, no env stripping)

| Command           | runs              | min  | max  |
| ----------------- | ----------------- | ---- | ---- |
| `npm run smoke`   | 1.0, 1.0, 0.9, 1.0, 1.0 | 0.9s | 1.0s |
| `npm run smoke:diff` | 2.0, 2.1, 2.0, 2.0, 2.2 | 2.0s | 2.2s |

`npm run check`: 10 passed, 0 warnings, 0 failed.

## Why `smoke:diff` floors at ~2.0s

The fan-out itself runs ~1.0-1.1s wall-time (4 scenes truly parallel). The
remaining ~1.0s is fixed cost: chromium launch (~300ms), probe nav (~500ms,
non-stubbed because scene 1 reuses it), scene-list extract + teardown.
Reducing further requires architectural change (Node-side PNG decode, or
dropping scene-1 reuse) — not in the brief's scope. The four `diff sN: 25.20%`
fails reflect stale baselines, unrelated to speedup.
