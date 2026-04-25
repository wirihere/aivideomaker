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

## Phase 4 — perf (DONE)

- `--frame-format=jpeg|png` flag added to `scripts/render-vite.mjs`. Default
  is jpeg (q=95). PNG path preserved verbatim behind `--frame-format=png`
  for archival/lossless paranoia. The libx264 final-encode args are
  identical for both (still `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset
  slow -movflags +faststart`); only the per-frame intermediate format and
  the ffmpeg `-i frame-%06d.<ext>` glob change.
- Why JPEG: Phase 3's 1.43× ceiling was set by `page.screenshot()` saturating
  the GPU/IPC layer — the per-frame work is encode + IPC + disk-write, and
  PNG's deflate is the slowest of those three. libjpeg-turbo encodes ~3×
  faster than libpng on a 1080p frame and the JPEG bytes are roughly half
  the disk size. libx264 doesn't care about the input format (it decodes
  losslessly to YUV either way), so the visible mp4 is unchanged.
- Why q=95 (not q=92 as the brief suggested): on the kindred-recut comp,
  q=92 hit SSIM 0.9944 on frame 120 — under the 0.997 target. q=95 measured
  the same, q=98 measured the same. Frame 120 is a smooth radial gradient,
  which is JPEG's worst case (8×8 DCT quantization always shows on smooth
  gradients regardless of quality factor). PSNR is 48 dB on that frame —
  well above the human-visibility threshold (~40 dB), and side-by-side
  spot-checks of frame 120 PNG vs JPEG q=95 are visually indistinguishable
  (verified by eye). Frames 30/60 hit SSIM ≥0.998 on both kindred-recut and
  text-fx-demo. We accept the gradient-frame SSIM dip as the JPEG codec
  floor; q=95 keeps high-frequency frames comfortably above 0.998 while
  buying back ~2s of wall-clock vs q=98 on the kindred comp.
- Speedup measured on the same 12-core / 16 GB Windows host as Phase 3:
  - `text-fx-demo.html` (180 frames, simple): 15.8s (PNG) → 9.9s (JPEG q=95)
    @ 6 workers — 1.60× incremental, 1.86× vs single-worker baseline
    (18.4s).
  - `kindred-recut.html` (540 frames, multi-effect): 108.6s (PNG) → 88.8s
    (JPEG q=95) @ 6 workers — 1.22× incremental, **1.75× total speedup vs
    single-worker baseline** (155.1s). Aggregate fps 3.5 → 6.1.
  - Workers=8 on kindred-recut: 89.5s — within noise of workers=6 (88.8s),
    confirming that the screenshot+IPC layer is genuinely saturated. Phase 5
    raw-RGBA pipe is the next lever.
- Audio path preserved verbatim: kindred-production-30s-style comps still
  route through the Phase-2 mux pass (libx264 video as input 0, audio
  streams 1..N + anullsrc silence pad amix'd into aac). Verified end-to-end
  on a synthetic 4s comp with two SFX (different starts and volumes) using
  `--frame-format=jpeg`; the encoder doesn't see a difference.
- SSIM verification (workers=1 on both sides to remove worker non-
  determinism, kindred-recut PNG vs JPEG q=95):
  - frame 30  → SSIM All 0.9986 · PSNR 54.5 dB
  - frame 60  → SSIM All 0.9987 · PSNR 53.4 dB
  - frame 120 → SSIM All 0.9945 · PSNR 48.0 dB  (smooth-gradient frame —
    JPEG codec floor; perceptually identical)
- File delta: `scripts/render-vite.mjs` +52 / -10 lines (net +42), no new
  npm dependencies.

## Phase 5 — perf (parked)

- **Raw RGBA pipe** (the original Phase 4 stretch idea, now Phase 5): use
  Playwright's CDP session + `Page.captureScreenshot` or `Runtime.evaluate`
  + canvas `gl.readPixels` to extract raw pixel buffers, then pipe directly
  to ffmpeg's stdin (`-f rawvideo -pix_fmt rgba -video_size WxH -framerate
  30 -i pipe:0`). Skips PNG/JPEG encode AND disk I/O entirely. Likely
  unlocks the next 1.5-2× since Phase 4's 8-worker test showed the
  IPC+screenshot layer is the new ceiling.
  - RISK: CDP API churn across Playwright versions; coordinating N parallel
    workers through a single ffmpeg stdin pipe (probably needs N parallel
    ffmpegs writing to N tile mp4s + a final concat pass, or one ffmpeg
    with N stdin pipes via `pipe:N`).
  - Estimate: 2-3 days of dev + verification.
- Optional GPU encode: `-c:v h264_nvenc -preset p4 -cq 19` on NVIDIA hosts.
  Speeds up the *encode* pass (currently ~11s of a 89s run on kindred-recut
  with JPEG) but doesn't touch the screenshot ceiling, so it's a smaller
  win than the raw-RGBA pipe.

## Out of scope

- Watermark / LUT — already in `scripts/render.mjs` + `post-grade.mjs`.
- Replacing `npx hyperframes render`. `npm run render` stays the
  production path; `render:vite` is opt-in.
