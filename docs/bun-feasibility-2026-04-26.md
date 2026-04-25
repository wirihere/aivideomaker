# Bun Runtime Swap — Feasibility (2026-04-26)

## Verdict: **WAIT** (revisit Q3 2026)

> Playwright + Bun + Windows is the blocking combination. On Linux/macOS Bun runs Playwright only via a hand-applied `bun patch` to `playwright-core`'s bundled `ws` import; on Windows the Chromium launch path has additional unresolved `child_process` issues. Since `scripts/smoke.mjs`, `scripts/render-vite.mjs`, and `scripts/build-catalog.mjs` are all Playwright-driven and we ship on Windows 11, the headline win does not survive contact with our actual workload.

Re-evaluate when [oven-sh/bun#13543](https://github.com/oven-sh/bun/issues/13543) closes green or [microsoft/playwright#38095](https://github.com/microsoft/playwright/issues/38095) lands official Bun support.

---

## Compatibility matrix

| Concern                                  | Status | Notes                                                                                                           |
| ---------------------------------------- | :----: | --------------------------------------------------------------------------------------------------------------- |
| ESM-only `.mjs` scripts                  |   ✓    | Bun is ESM-first; all 25+ scripts run as `bun scripts/foo.mjs`.                                                 |
| `child_process.spawn` for ffmpeg         |   ✓    | `node:child_process` works via Bun's compat layer; `scripts/lib/ffmpeg-path.mjs` unchanged. ([Bun v1.0.22](https://bun.com/blog/bun-v1.0.22)) |
| `@ffmpeg-installer/ffmpeg` (CJS from ESM) |   ✓    | `mod.default ?? mod` shim already in place is correct under both runtimes.                                     |
| Playwright on Linux/macOS                |   ?    | Works only after `bun patch playwright-core` to swap bundled `ws`. Not one-line install. ([Kelner](https://www.mateuszkelner.com/blog/make-playwright-work-with-bun)) |
| **Playwright on Windows**                |   ✗    | Open: ENOENT on Chromium launch via Bun ([#13543](https://github.com/oven-sh/bun/issues/13543)); closed-as-not-planned, no documented fix path. **This is our environment.** |
| Native deps (Playwright browsers)        |   ✓    | Browser binaries downloaded by Playwright itself, runtime-agnostic.                                             |
| `edge-tts-universal`, `gsap`, agent-sdk  |   ✓    | Pure JS / Node-compat; no native binding issues flagged.                                                        |
| Windows 10/11 native runtime             |   ✓    | Native since Bun 1.1 (mid-2024); production-ready in 2.0. ([Strapi](https://strapi.io/blog/bun-vs-nodejs-performance-comparison-guide)) |

---

## Speed claims — verified, but tempered

| User claim                  | Reality                                                                                                  | Honest expectation                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 3–4× faster install         | 25–35× faster on cold installs ([bun.sh](https://bun.sh/package-manager), [Better Stack](https://betterstack.com/community/guides/scaling-nodejs/bun-install-performance/)). | Real on cold; warm installs (typical day-to-day) compress that delta a lot.                                   |
| `npm run check` 1.1s → 0.3s | Startup: Node ~40ms → Bun ~6ms per invocation ([Bun docs](https://bun.com/docs/runtime)). `check` chains 3 commands. | ~100ms recoverable from startup, **not 800ms**. The remaining ~1s is `lint` + `lint:strict` + `smoke` doing real work. **Claim is optimistic.** |
| `bun run` vs `npm run`      | `npm run` ~170ms vs Bun ~6ms per invocation ([nesterow](https://dev.to/nesterow/bunjs-is-indeed-faster-1man)). | ~150ms saved per invocation. Real across a busy session.                                                      |

Bottom line: install win is real on cold path, per-invocation win is real but small, sub-second `npm run check` is unlikely without speeding up Playwright cold-start.

---

## Migration path (when status flips to GO)

1. `winget install Oven-sh.Bun` (or `irm bun.sh/install.ps1 | iex`).
2. Add `"packageManager": "bun@<pinned>"` and `"engines": { "bun": ">=2.0" }` to `package.json`.
3. Flip ONE script first (`smoke`) to `bun scripts/...` and run side-by-side with the Node version.
4. If Playwright passes, flip the rest of `scripts`.
5. Drop `package-lock.json`; commit `bun.lock`.
6. CI: replace `setup-node` with `oven-sh/setup-bun`; keep Node available one cycle.
7. **Don't remove Node** — `npx hyperframes` is invoked externally and the HyperFrames CLI's runtime is not Bun-verified.

### Risk register

| Risk                                                  | Severity | Mitigation                                                                                                  |
| ----------------------------------------------------- | :------: | ----------------------------------------------------------------------------------------------------------- |
| Playwright Chromium launch fails on Windows           |   High   | Wait. Don't migrate until [#13543](https://github.com/oven-sh/bun/issues/13543) is fixed.                   |
| `bun patch playwright-core` drift on Playwright upgrade |  Medium  | Pin Playwright. Add a smoke step that fails fast if patch no longer applies.                                |
| `npx hyperframes` (registry CLI) assumes Node         |  Medium  | Keep Node installed; only switch internal scripts.                                                          |
| Hidden CJS↔ESM divergence                             |   Low    | Existing `mod.default ?? mod` shim handles it. Verify in test plan step 4.                                  |
| Anthropic acquired Bun (Dec 2025)                     | Positive | Net good for us — we ARE a Claude Code user; may accelerate Windows + Playwright fixes.                     |

---

## Test plan (run in order before flipping default runtime)

1. `bun install` from clean checkout; verify `@ffmpeg-installer/ffmpeg` binary present.
2. `bun scripts/lib/ffmpeg-path.mjs` — should print bundled path; match `node` output.
3. `bun scripts/lint-strict.mjs` — pure FS + parsing parity.
4. `bun -e "import('@ffmpeg-installer/ffmpeg').then(m => console.log(m.default?.path))"` — CJS interop.
5. `bun -e "import('child_process').then(({spawn}) => spawn(process.env.FFMPEG ?? 'ffmpeg', ['-version'], {stdio:'inherit'}))"` — spawn parity.
6. **`bun scripts/smoke.mjs` (the gate).** If this fails on Windows, stop — migration not viable yet.
7. `bun scripts/render-vite.mjs` for one composition; ffprobe-compare duration + frame count vs Node-rendered reference.
8. `Measure-Command { bun run check }` vs `Measure-Command { npm run check }` on Windows 11. Document actual delta.

---

## Recommendation

Stay on Node 22 today. Set a Q3 2026 nudge to re-check the two GitHub issues above. If both close green, run the test plan; if steps 1–8 pass, migrate. Until then, the realistic win (~150ms per `bun run` invocation + faster cold installs) does not justify maintaining a `bun patch` against `playwright-core` on Windows.

## Sources

- [Bun vs Node.js in 2026 — Strapi](https://strapi.io/blog/bun-vs-nodejs-performance-comparison-guide)
- [Bun in 2025: Critical Evaluation — Angelo Lima](https://angelo-lima.fr/en/bun-2025-critical-evaluation-javascript-runtime-alternative/)
- [Make Playwright work with Bun — Kelner](https://www.mateuszkelner.com/blog/make-playwright-work-with-bun)
- [How to Use Bun for Playwright Tests in 2026 — BrowserStack](https://www.browserstack.com/guide/bun-playwright)
- [Playwright on Windows doesn't work — oven-sh/bun#13543](https://github.com/oven-sh/bun/issues/13543)
- [Add support for bun — microsoft/playwright#38095](https://github.com/microsoft/playwright/issues/38095)
- [Bun v1.0.22 (Playwright pipes) — Bun Blog](https://bun.com/blog/bun-v1.0.22)
- [Why bun install Is So Fast — Better Stack](https://betterstack.com/community/guides/scaling-nodejs/bun-install-performance/)
- [bun install — package manager](https://bun.sh/package-manager)
- [Bun Runtime docs](https://bun.com/docs/runtime)
- [BunJS Is Indeed Faster — DEV](https://dev.to/nesterow/bunjs-is-indeed-faster-1man)
- [CommonJS is not going away — Bun Blog](https://bun.sh/blog/commonjs-is-not-going-away)
