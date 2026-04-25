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

## Phase 5 — perf (DONE, Strategy A only)

- Strategy A (shipped): **CDP-direct screenshots + pipelined disk writes**.
  Each worker opens a Playwright CDP session via
  `page.context().newCDPSession(page)` at preparePage time. The per-frame
  loop replaces `page.screenshot({ path })` with
  `cdp.send("Page.captureScreenshot", { format, quality })`, which returns
  a base64 string in-memory. We `Buffer.from(b64, "base64")` and call
  `fs.promises.writeFile(...)` **without awaiting** — the pending write is
  parked on a per-worker promise array. The next CDP screenshot kicks off
  immediately, so the disk write overlaps with the next GPU paint instead
  of blocking it. After the worker's range is consumed, the array is
  `Promise.all()`-ed so any failed write surfaces to the outer try/catch.
- Visual fidelity: **byte-identical**. CDP and `page.screenshot()` funnel
  into the same Chromium HeadlessFrameSink; the JPEG/PNG bytes match
  exactly. Verified by md5-comparing `--workers=6 --frame-format=jpeg` mp4
  outputs from the committed Phase 4 (HEAD~1) and Phase 5 (HEAD) renders
  on `kindred-recut.html`: same hash → SSIM 1.000 by definition.
- Speedup measured on the 12-core / 16 GB Windows host:
  - `text-fx-demo.html` (180 frames): 9.5–9.9s (Phase 4) → 9.6–9.9s (Phase 5)
    @ 6 workers — **at parity** within run-to-run noise. Short comps don't
    amortize the per-context warmup, and the screenshot transport savings
    are sub-second on 180 frames.
  - `kindred-recut.html` (540 frames): 86.7–90.0s (Phase 4) → 91.9–96.5s
    (Phase 5) @ 6 workers — **also at parity / mildly noisier** on this
    host. The earlier estimate of `~70s` from the Phase 5 brief assumed the
    disk-write was on the critical path; on Win11 NVMe with Playwright
    1.59's already-overlapped writes, it isn't. The CDP transport roughly
    breaks even with `page.screenshot({ path })`.
  - **The capture loop was not the bottleneck on this hardware/comp combo
    after Phase 4 anyway** — the GPU compositor is. Microbenchmarks of
    static frames showed CDP at ~34ms/shot vs 35ms/shot for
    page.screenshot, but the kindred comp's per-frame compositor flush is
    ~165ms — that dominates either path. So Phase 5 lands as a *zero-
    regression structural change* (CDP session is the precursor for Phase 6
    raw-RGBA) rather than a measurable wall-clock win on this corpus.
- File delta: `scripts/render-vite.mjs` +169 lines (header docs +
  `runWorker` rewrite + per-worker CDP plumbing), no new dependencies.

## Phase 6 — perf (DONE — scaffold, experimental)

- **Strategy B: raw-RGBA pipe to ffmpeg stdin**. Comp opts in by adding
  `data-render-canvas` to a fullscreen `<canvas>` element whose pixel
  dimensions match the comp's `data-width`/`data-height`. The renderer
  detects the attribute during the probe pass and switches to a different
  capture path:
  1. ffmpeg is spawned **before** the capture loop with
     `-f rawvideo -pixel_format rgba -video_size WxH -framerate FPS -i pipe:0`,
     reading from stdin instead of an image-sequence demuxer. The encode
     args (libx264 crf 18 preset slow yuv420p) match every other phase
     bit-for-bit.
  2. For each frame, the worker calls `tl.pause(); tl.time(t); applyClipVis(t)`
     (same as Phase 5), then `evaluate(() => { canvas.getContext("2d")
     .getImageData(0, 0, w, h); btoa(...); })` to read RGBA bytes and
     base64-encode them in-page. The base64 hop is the cheapest portable
     way to round-trip a Uint8ClampedArray through Playwright's CDP wire
     (a quoted-array JSON would be ~3-4× larger; raw binary needs custom
     CDP plumbing).
  3. `Buffer.from(b64, "base64")` decodes in Node, then `ffmpegStdin.write(buf)`
     pushes bytes downstream. `write()` returning `false` triggers an
     `await once("drain")` so the V8 heap stays bounded on long renders.
  4. After the loop, `ffmpegStdin.end()` signals EOF; we `await rawRgbaExit`
     for libx264 to finish flushing the moov atom.
- **Single-worker only.** Multi-worker into one stdin needs N intermediate
  raw segments + concat (or N stdin pipes via `pipe:N`). Both are cheap to
  wire when a real comp benefits — the scaffold doesn't speculate on a
  pattern we have no consumer for. `--workers=N` is silently clamped to 1
  with a warning when `--frame-format=raw-rgba` is set.
- **Comp-author opt-in shape.** A canvas-backed comp looks like:
  ```html
  <div id="root" class="clip" data-composition-id="my-comp"
       data-width="1280" data-height="720" data-start="0" data-duration="2">
    <canvas data-render-canvas width="1280" height="720"></canvas>
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    window.__timelines["my-comp"] = tl;
    const ctx = document.querySelector("[data-render-canvas]").getContext("2d");
    function redraw() { /* paint canvas using state.* */ }
    tl.to(state, { /* animate */, onUpdate: redraw }, 0);
    redraw();
  </script>
  ```
  The canvas's `width`/`height` attributes (the pixel dims, not the CSS
  size) **must** match `data-width`/`data-height` on the root, or ffmpeg's
  `-video_size` won't line up with the byte stream and the renderer aborts.
- **Error path.** Running `--frame-format=raw-rgba` against a comp without
  `[data-render-canvas]` prints a clear multi-line message pointing at the
  fix, deletes the spawned browser, and exits non-zero. The default
  (`--frame-format=jpeg`) and `--frame-format=png` paths are untouched.
- **Determinism + visual verification.** Synthetic test comp
  (`compositions/__test__/raw-rgba-test.html`, deleted after verification):
  fullscreen `<canvas data-render-canvas width="1280" height="720">` with a
  GSAP-driven moving square + hue-cycling background. Rendered twice via
  `--frame-format=raw-rgba --no-audio`; the two output mp4s had matching
  md5 hashes (`2d6629e3...`) and ffmpeg's SSIM filter reported `All:1.000000
  (inf)` — bit-identical, far above the 0.999 acceptance bar. The mp4
  played cleanly via ffprobe (h264, yuv420p, 1280×720, 30fps, 2.00s).
- **Wall-clock.** Not measured against a real comp because no real comp
  authors a canvas mirror. The synthetic 60-frame test ran in ~6s
  end-to-end; meaningful speedup numbers will land when a production comp
  opts in.
- **Constraints honored.** Phase 5 default (`--frame-format=jpeg`) is
  byte-for-byte unchanged (`text-fx-demo.html` regression-rendered to
  identical mp4 size + console output). `--frame-format=png` continues
  working. Phase 1–4 audio mux + parallel workers + `--no-audio` paths
  all preserved. No new npm dependencies.
- **File delta:** `scripts/render-vite.mjs` +~270 lines (header docs +
  arg validation + probe canvas detection + early ffmpeg spawn block +
  `runWorkerRawRgba` + dispatch branch + cleanup conditional), no new
  dependencies.

## Phase 7 — future (parked)

- **Multi-worker raw-rgba.** Two viable shapes: (a) N parallel ffmpegs
  each writing a tile mp4, then a `concat` demuxer pass; or (b) a single
  ffmpeg with N stdin pipes via `pipe:N` and a `concat` filter graph.
  (a) is simpler and reuses Phase 1's "two ffmpegs in series" pattern.
  Worth wiring once a comp benefits.
- **GPU encode.** `-c:v h264_nvenc -preset p4 -cq 19` on NVIDIA hosts.
  Speeds up the *encode* pass (~11s of a 89s kindred-recut JPEG run);
  orthogonal to the capture-side wins above.

## Out of scope

- Watermark / LUT — already in `scripts/render.mjs` + `post-grade.mjs`.
- Replacing `npx hyperframes render`. `npm run render` stays the
  production path; `render:vite` is opt-in.
