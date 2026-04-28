> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Streamline proposals — 2026-04-26

Per LEARNINGS §5.5: every chunk surfaces 1+ stack improvement. Wins so far
2026-04-25..26: vendored GSAP, module bundle, bundled ffmpeg, lint:strict
gate, templates × verticals, `npm run video -- <url>` master.

Each item is sized **<2h** and removes a recurring papercut. `DISPATCH
READY` = the brief is self-contained.

---

## 1. Render progress reporting — kill the silent 5-minute wait · DISPATCH READY

**Pain.** `npm run render` and `video` stage 7 spawn `npx hyperframes
render` silent for 3-7 min. Operator context-switches, misses ETA. §8
parking-lot "Real-time render progress reporting" open since 2026-04-25.

**Outline.** In `scripts/render.mjs` pipe child stdout, regex
`/frame=\s*(\d+)/` (ffmpeg) and HyperFrames' `[render] Frame N/M`, write
a `\r`-updated bar (`▰▰▰▱▱▱ 124/300 · ETA 2m14s`). Total frames =
`data-duration` × fps from comp `<head>`. Heartbeat dot if no progress
lines for 5s.

**Files.** `scripts/render.mjs`, `scripts/render-queue.mjs` (forward),
`scripts/video.mjs` stage 7.

**Accept.** `npm run render` prints a line updated ≥1/sec; `npm run
video -- <url>` shows the same; final "done in Xs" survives.

**Effort.** S.

**Risks.** Windows pipe buffering — use `\r`, fall back to plain prints
when `!process.stdout.isTTY`.

---

## 2. Compose-from-template helper — kill the 25× boilerplate header · DISPATCH READY

**Pain.** All 25 templates duplicate the same ~10-line `<head>` (cards →
vibe → tokens-PLACEHOLDER → effects-batch-08 → modules/all.css → vendor
gsap → modules/all.js). Any path change = 25-file edit. Already bit us
via cards.css portrait fix.

**Outline.** New `design/compose-head.html` fragment + `<!-- HEAD-INCLUDE
-->` marker. Extend `scripts/build-bundle.mjs` with a hydrate pass that
replaces the marker on every build. Fragment is single-source. Opt-out:
`<!-- HEAD-INCLUDE: skip -->`.

**Files.** new `design/compose-head.html`, `scripts/build-bundle.mjs`
(hydrate step), 25 templates (one-time normalise),
`scripts/comp-manifest.mjs` (drift check).

**Accept.** Adding a module needs editing only `compose-head.html`; `npm
run check` after `build:bundle` clean across all 25; first hydrate diff
is uniform across files.

**Effort.** M.

**Risks.** A template needing an extra import — handle via `skip`
opt-out marker.

---

## 3. `npm run` self-documenting help — surface 36 scripts to the operator · DISPATCH READY

**Pain.** 36 npm scripts, bare `npm run` has no descriptions, operators
and cold-read agents keep flipping to QUICKSTART §10 (which drifts).

**Outline.** Most `scripts/*.mjs` already have leading-comment doc
blocks. New `scripts/help.mjs` parses each `package.json` script entry,
reads the script file's first comment line, prints a grouped table
(build / new / preview / render / cache / fetch). `--md` flag emits the
QUICKSTART §10 table so docs stay fresh from one source.

**Files.** new `scripts/help.mjs`, `package.json` (one entry), few
leading-comment touch-ups.

**Accept.** `npm run help` prints grouped listing in <3s; `--md` outputs
paste-ready markdown table.

**Effort.** S.

**Risks.** None — read-only.

---

## 4. Render output retention policy — `renders/` is at 283MB / 62 MP4s · DISPATCH READY

**Pain.** `renders/` is 283MB / 62 MP4s, growing every session. No
purge, no naming convention for "the keeper". §8 has "backup-and-restore"
but that's bigger.

**Outline.** New `scripts/renders-prune.mjs` + `npm run renders:list` /
`renders:prune`. List shows path, size, duration (ffprobe), ctime, grade
tags. Prune flags: `--keep-last=N` (default 10), `--older-than=14d`,
`--dry-run` default, `--apply`. Zero-byte `.keep` sidecars are never
deleted. `npm run check` summary warns at >200MB.

**Files.** new `scripts/renders-prune.mjs`, `package.json` (2 entries),
footer line in `scripts/smoke.mjs`.

**Accept.** `--dry-run` lists deletions; `--apply --keep-last=10`
reduces dir; `.keep` honoured; check warns at threshold.

**Effort.** S.

**Risks.** Accidental delete of production keeper — `.keep` sidecars +
`--dry-run` default mitigate. Document in QUICKSTART §10.

---

## 5. Asset cache coverage — route the 5 outlier fetchers through `asset-cache.mjs` · DISPATCH READY

**Pain.** `scripts/lib/asset-cache.mjs` exists; only Pixabay (×4) +
`pull-assets.mjs` route through it. Five fetchers don't:
`fetch-{pexels,iconify,undraw,unsplash,assets}.mjs` plus all 4 TTS
(`fetch-tts-{edge,elevenlabs,google,streamelements}.mjs`). Re-runs on
the same brand re-hit network → slow, fragile, quota-burning.

**Outline.** Wrap each fetcher's download with `cacheGet(key) ??
cacheSet(key, download())`. Keys: TTS = `voice|text|rate|pitch` (all
deterministic), Iconify/Undraw = icon URL, Pexels/Unsplash = photo ID +
size. Pattern is identical across all 9 — copy-paste. Add a `cacheText()`
helper for the TTS write path.

**Files.** `scripts/fetch-{pexels,iconify,undraw,unsplash,assets}.mjs`,
`scripts/fetch-tts-*.mjs` (×4), `scripts/lib/asset-cache.mjs`
(`cacheText`).

**Accept.** Two consecutive `npm run video -- <url>` runs show "cache
hit" lines on second; `cache:stats` covers all 9; second run stages 1-4
drop from ~30s to ~5s.

**Effort.** M.

**Risks.** TTS cache key must include all generation params or it busts
on voice change — covered by including them in the key.

---

## Stretch ideas — context only, not ship-now (L-tier)

**S1. Smoke parallel-scene speedup.** `docs/RESUME-AT-3AM.md` priority
3, partial work on disk. Fan out scene captures across N Playwright
browser contexts. Why stretch: needs benchmark first — Windows
context-startup may eat the parallel win. Lives in `scripts/smoke.mjs`.

**S2. Vite-based renderer Phase 1.** `RESUME-AT-3AM.md` priority 4 + §8
"Remotion / Motion Canvas". Playwright frame-capture + ffmpeg encode
(`scripts/render-vite.mjs`) sidesteps flaky studio iframes. Why stretch:
multi-day — audit, audio-mux, render-compare phases.

---

## Ranking by leverage

| # | Proposal                                  | Pain frequency | Unlock size | Effort | Pick |
|---|-------------------------------------------|----------------|-------------|--------|------|
| 1 | Render progress reporting                 | Every render (3-10×/session) | M (kills idle waiting) | S | **TOP** |
| 2 | Compose-from-template head fragment       | Every module/cards.css edit | L (one-edit-fans-out) | M | **TOP** |
| 5 | Asset cache coverage (9 fetchers)         | Every re-run on same brand   | M (network + quota)    | M | **TOP** |
| 4 | Renders prune + warning                   | Steady disk creep            | S (hygiene)            | S | ship after #1 |
| 3 | `npm run help` self-doc                   | Every cold-read              | S (DX polish)          | S | ship anytime |

**Recommended next session order:** #1 (highest visible win), then #2 in
parallel agent (independent files), then #5 follow-up. #3 + #4 are S-tier
fillers when the main thread is waiting on a render.
