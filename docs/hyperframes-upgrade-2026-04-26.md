# HyperFrames CLI upgrade audit — 0.4.24 → 0.4.26

**Date:** 2026-04-26
**Verdict:** **NO-OP — already on 0.4.26.** Optionally pin in `package.json` for reproducibility.

## Reality check

The premise ("we're on 0.4.24") was wrong. The project does **not** pin
hyperframes anywhere — `package.json` only references it via `npx hyperframes`
in scripts (`preview`, `lint`, `scripts/render.mjs`, `scripts/smoke.mjs`).
No `package-lock.json`; `hyperframes.json` only configures the registry.

```
$ npx --no-install hyperframes --version
0.4.26
```

npx resolved `latest` when 0.4.26 published (2026-04-25 15:16 UTC). Every
`preview / lint / render / smoke` since then has been on 0.4.26.

## Changelog: 0.4.24 → 0.4.26

Source: GitHub releases on `heygen-com/hyperframes`. Both bumps are pure patch.

**0.4.25** ([PR #489](https://github.com/heygen-com/hyperframes/pull/489))
- `fix(cli)`: resolve sub-composition `<audio>` `src` relative to its own
  file (was resolving against the root). Free win for any future sub-comp
  that brings its own audio; we keep audio next to `index.html` so today
  it's a no-op.

**0.4.26** ([PR #491](https://github.com/heygen-com/hyperframes/pull/491))
- `fix(cli)`: publish projects through staged uploads. Affects the
  `publish` command only — we don't use it.

Dependency surface (`hono`, `puppeteer-core`, `esbuild ^0.25`, `postcss`,
`prettier`, etc.) is byte-identical across 0.4.24, 0.4.25, 0.4.26, and
0.5.0-alpha.2.

## Known pitfalls — were they fixed upstream?

| Pitfall | Status |
| --- | --- |
| Studio iframe hang on >1k GSAP children (LEARNINGS §4) | **Not addressed.** Architectural — eager script execution in the studio shell. Our `?fresh=1` bypass and `render-vite.mjs` workaround stand. |
| esbuild path bug | **Already fixed in 0.4.24** (PR #483, "shut down preview embedded-mode server on Ctrl+C") and adjacent PRs #486 (symlinked render assets). Nothing further in 0.4.25/0.4.26. |
| `tl.from(opacity:0)` brittleness | GSAP-level, unaffected by hyperframes version (as noted in the brief). |

## 0.5.0-alpha.2 — wait for stable?

`0.5.0-alpha.1` introduced `feat(studio): add manual DOM editing inspector`
(PR #466) — a 20+ commit Studio rewrite (timeline editing, percentage-based
zoom, image asset picker, inline uploads, manual design inspector).
`0.5.0-alpha.2` republished without listed changes (likely realigning the
release-channel guard from PR #488).

This is a **Studio-shell** change, not a render-engine change. Our pipeline
renders headlessly via `puppeteer-core` + paused timelines, and the
documented hang lives in the Studio shell. An alpha that rewrites the
Studio inspector is higher risk than reward — wait for stable `0.5.0`.

## Recommendation

1. **Don't run `npm install hyperframes`** — there's nothing to install.
   Hyperframes is invoked via `npx` and the cache is already at 0.4.26.
2. **(Optional) Pin it** for reproducibility — `npm i -D hyperframes@0.4.26`
   stops smoke/render drift when `latest` ticks. Given the Claude-Code-only
   scope, skipping the pin is also defensible.
3. **Smoke after any future bump:**
   ```bash
   npm run check       # lint + lint:strict + smoke (preview + render)
   npm run render      # one full composition render
   ```
   `check` already exercises `lint`, `preview` (via the playwright smoke
   harness), and renders — covering the four commands in the brief.
4. **Re-audit when stable `0.5.0` ships** — watch for Studio fixes that
   might retire our `?fresh=1` and `render-vite.mjs` workarounds.
