# Custom renderer roadmap (`scripts/render-vite.mjs`)

In-repo alternative to `npx hyperframes render`. Goal: deterministic frame
capture + a place to bolt on custom passes (LUT, watermark inline,
multi-pass compositing). Always uses the bundled ffmpeg via
`scripts/lib/ffmpeg-path.mjs`.

## Phase 1 — proof of concept (DONE)

- CLI: `node scripts/render-vite.mjs <comp> [--out <mp4>] [--fps 30]`.
- Loads via `file://` in headless Chromium (Playwright). Relative asset
  paths (`../design/...`) resolve natively — no dev server needed.
- Reads `data-width` / `data-height` / `data-duration` from the
  `[data-composition-id]` root + timeline via `window.__timelines`.
- Frame loop: for each `t = i/fps`, `tl.pause(); tl.time(t)` plus the
  `.clip` display toggle from the smoke harness, then `page.screenshot()`.
- Encode: `ffmpeg -framerate <fps> -i frame-%06d.png -c:v libx264
  -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart`.
- Temp PNGs cleaned on success; preserved on ffmpeg failure.
- **No audio** — verified on `compositions/text-fx-demo.html`.

## Phase 2 — audio mixing (DONE)

- DOM-scan via `page.evaluate` for every `<audio>` (incl. nested
  sub-comps): pulls `src` (or wrapped `<source src>`), `data-start`,
  `data-duration`, `data-volume` (default 1), `data-track-index`. Resolves
  each `src` relative to the comp HTML's directory; missing files are
  warned-about but don't abort.
- Phase 1 frame-capture loop is unchanged. When audio exists, libx264
  writes to a `*.video.mp4` intermediate; a 2nd ffmpeg pass muxes audio
  with `-c:v copy` so the encode is bit-identical to the visual-only
  output. When `audio: none`, libx264 writes directly to the final path
  (Phase 1 byte-for-byte preserved).
- Filter graph per track: `[k:a]volume=V,adelay=Sms|Sms[a_k]` (volume
  segment dropped when v=1; adelay segment dropped when start=0; `anull`
  passthrough labels otherwise-bare inputs). All real tracks are amixed
  together with a synthetic `anullsrc=...:duration=<comp dur>` silence
  pad — that pad guarantees amix's `duration=longest` always reaches the
  comp's authored timeline length, so a comp whose last SFX ends early
  doesn't get its mp4 truncated by `-shortest`. (`apad=whole_dur` would
  be the cleaner choice but the bundled @ffmpeg-installer ships a 2018
  build that pre-dates that option.)
- `--no-audio` flag short-circuits the mux pass entirely.
- Output: `aac` audio (192k) muxed into the same h264 mp4. Verified end-
  to-end on a synthetic 4s comp with two SFX (different starts and
  volumes) and on `text-fx-demo.html` (no-audio path unchanged).

## Phase 3 — perf (DONE)

- Parallel BrowserContexts. Single Chromium launch, N contexts × N pages
  all bound to the same composition. Default N = `min(6, os.cpus().length)`;
  override with `--workers=N`. `--workers=1` falls back to a single-page
  sequential loop (still routed through the worker function — no separate
  code path) for debugging or low-memory machines.
- Frame range split: `ceil(F/N)`, worker k handles `[k*per, min((k+1)*per, F))`.
  PNG filenames are zero-padded by absolute frame index (`frame-NNNNNN.png`),
  so ffmpeg's `-i frame-%06d.png` glob is deterministic regardless of
  write order across workers.
- Worker 0 reuses the probe page (already navigated for dimensions/audio
  scan), saving one redundant context+nav. Workers 1..N-1 each get a
  fresh context+page; their navs run in parallel via `Promise.all`.
- Memory clamp: if `N × ~250 MB` would exceed 75% of `os.totalmem()`,
  log a warning and reduce N. Each Chromium context is 150–250 MB
  resident.
- Determinism: a `*, *::before, *::after { animation-play-state: paused;
  transition-duration: 0s }` style tag is injected at preparePage time
  (same trick scripts/smoke.mjs uses for baseline-stable screenshots) so
  wall-clock-driven CSS animations sample at the same phase regardless
  of which worker captures the frame. Spot-check: at frames 30/60/120
  the SSIM between `--workers=1` and `--workers=4` text-fx-demo runs is
  1.000 / 0.9988 / 0.9979 — visually identical (PSNR 32–84 dB; the
  re-encode noise floor is ~60 dB so the residual is sub-pixel font
  anti-alias jitter, not authoring drift).
- Predicate gotcha: Playwright's `waitForFunction` cannot serialize a
  GSAP timeline object back to Node — it hangs. Predicate must return
  a primitive: `() => !!(window.__timelines && window.__timelines[key])`.
- Speedup measured on 12-core / 16 GB Windows host:
  - `text-fx-demo.html` (180 frames, simple): 18.4 s → 15.4 s @ 4 workers
    (1.20×). Short comps barely amortize per-context warmup.
  - `kindred-recut.html` (540 frames, multi-effect): 155.1 s → 108.4 s @
    6 workers (1.43×). Aggregate fps 3.8 → 5.7. Below the 2–3× target
    because Playwright `page.screenshot()` is the bottleneck and serializes
    at the GPU/IPC layer; further wins likely require Phase 4 raw-RGBA
    pipe + parallel encode pipelines.

## Phase 4 — perf (parked)

- Optional GPU encode: `-c:v h264_nvenc -preset p4 -cq 19` on NVIDIA hosts.
- Stretch: pipe raw RGBA to ffmpeg (`-f rawvideo -pix_fmt rgba`), skipping
  PNG disk I/O entirely. Likely the biggest unlocked speedup since the
  Phase 3 ceiling appears to be screenshot serialization, not capture loop
  cost.

## Out of scope

- Watermark / LUT — already in `scripts/render.mjs` + `post-grade.mjs`.
- Replacing `npx hyperframes render`. `npm run render` stays the
  production path; `render:vite` is opt-in.
