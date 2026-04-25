# WebCodecs feasibility — 2026-04-26

Evaluate `VideoEncoder` (WebCodecs) as a replacement for the
Playwright→PNG→ffmpeg loop in `scripts/render-vite.mjs`.

## Verdict

**WAIT — prototype only if PNG-disk I/O becomes the proven bottleneck.**

The 19.9 s / 6 s benchmark we just shipped is dominated by GSAP tick +
DOM repaint + `page.screenshot()` round-trips, not by libx264. Phase 3
of the existing roadmap (raw RGBA pipe to ffmpeg, parallel
BrowserContexts) buys most of the speed WebCodecs would, with a
fraction of the lift. WebCodecs is the right destination only if
Phase 3 plateaus and we still want more.

## What WebCodecs offers in 2026

- `VideoEncoder` (Chrome ≥ 94, GA on desktop) accepts `VideoFrame`
  objects and emits `EncodedVideoChunk` callbacks.
- Codecs on Chromium-Windows: software AVC/H.264 always; hardware
  H.264 / HEVC via the OS encoder when `VideoEncoder.isConfigSupported`
  reports `hardwareAcceleration: "prefer-hardware"`. AV1 and VP9 are
  software-encode in most builds. Per-frame QP control landed on
  Windows in Chrome 134 (Jan 2025) and macOS in 135 (Feb 2025).
- WebCodecs is **video-only** — no MP4 container, no audio. A muxer
  is required.
- Headless Chromium needs `--enable-features=AcceleratedVideoEncoder`
  plus a working GPU process; default Playwright launch gets neither.

## Architecture sketch

```
Playwright + Chromium (--enable-gpu, --enable-features=AcceleratedVideoEncoder)
  └─ page: GSAP tl.time(t) → OffscreenCanvas → VideoFrame.fromCanvas
        └─ VideoEncoder.encode → EncodedVideoChunk callback
              └─ exposeBinding bridge → Node: collect chunks
                    └─ mp4-muxer (in-page) OR ffmpeg -f h264 -i pipe:
                          └─ second ffmpeg pass: mux audio (AAC, -c:v copy)
```

Two viable shapes: (a) mux entirely in-page with `mp4-muxer`, then
ship one MP4 to disk, then ffmpeg-mux audio; (b) stream raw H.264
NAL units to a Node ffmpeg child via `exposeBinding`, let ffmpeg
mux container + audio in one shot. (b) is simpler — we keep one
ffmpeg invocation and skip a JS muxer dependency.

## Speed estimate (defensible range)

- Hardware H.264 encode at 1080p on a modern Windows iGPU/dGPU:
  200–400 fps capacity. Irrelevant — that is not our bottleneck.
- Today's loop: 30 frames × 6 s = 180 frames in ~14 s capture
  (≈12.8 fps wall) + ~5 s encode. Capture is **~3×** the encode cost.
- Replacing PNG screenshot with `VideoFrame.fromCanvas` removes the
  CDP screenshot round-trip and PNG zlib pass. Realistic capture
  speed-up: **2–4×** for the capture phase, encode collapses to
  near-zero. Net wall-clock for the demo: ~7–10 s vs 19.9 s today.
- Phase 3 (raw RGBA pipe + 2 parallel contexts) likely gets us to
  the same ~8 s without leaving the current architecture. WebCodecs
  beats that only at higher resolutions, longer comps, or 60 fps.

## Risk register

| Risk                            | Severity | Mitigation                                                                                                            |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| Headless GPU not available      | High     | Playwright's bundled Chromium runs SwiftShader by default; hardware encode silently falls back to software. Audit via `chrome://gpu` in headed mode before trusting fps numbers. |
| Muxer choice                    | Med      | `mp4-muxer` (Vanilagy) is the only mature TS muxer for AVC + AAC; alternative is piping raw NAL to ffmpeg. Prefer ffmpeg path — one fewer dep, audio mux is free. |
| Audio sync                      | Med      | WebCodecs gives PTS in microseconds; ffmpeg mux from time-zero with `-shortest` matches our existing audio pipeline. Frame-accurate as long as we encode at the same fps the timeline was sampled. |
| Hardware encoder portability    | High     | Output bitstream parameters (level, B-frames, CABAC) differ between Intel QSV / NVENC / AMD VCN encoders. Visual output identical, but determinism of byte-exact MP4 is gone. Acceptable for our use case (videos for humans). |
| Determinism of seek-and-paint   | Low      | `tl.pause(); tl.time(t)` followed by `VideoFrame.fromCanvas(canvas)` captures the current paint synchronously — same guarantee as `page.screenshot()`. |
| Chromium-only                   | None     | Playwright pipeline already pins Chromium. Non-issue.                                                                  |
| Per-frame QP / CRF parity       | Low      | We currently use libx264 `crf 18 preset slow`. WebCodecs HW encoders use bitrate or QP. Visual quality at 8–10 Mbps 1080p is indistinguishable for short comps. |

## Lift estimate

- New in-page bridge (capture canvas, instantiate encoder,
  forward chunks via `page.exposeBinding`): **~3 h**
- ffmpeg-mux mode (raw H.264 stdin → MP4 + AAC): **~2 h**
- Headless GPU plumbing (correct launch flags, `chrome://gpu`
  check, fallback detection): **~2 h**
- Determinism + audio-sync verification on `text-fx-demo.html`
  and one full pipeline comp: **~3 h**
- Wiring into `scripts/render-vite.mjs` as `--encoder webcodecs`
  flag + roadmap update: **~2 h**

**Total: ~12 h** for a working prototype that is honestly compared
against Phase 3.

## Recommendation

Do not start with this. Do Phase 3 first: pipe raw RGBA from
`page.screenshot({ omitBackground: false, type: 'jpeg' })` (or a
Canvas `toBlob('image/png', 0)` short-circuit) to ffmpeg `-f
rawvideo`, and run two BrowserContexts in parallel. Re-measure. If
wall-clock still bothers us — and it likely won't for ≤ 30 s
comps — **then** prototype WebCodecs on `compositions/text-fx-demo.html`
behind a `--encoder webcodecs` flag, with the ffmpeg-mux variant
(no in-page muxer dependency). Keep the libx264 path as the
production default until WebCodecs has logged ≥ 10 successful
renders byte-comparable to the current output.

## Sources

- [Video processing with WebCodecs — Chrome for Developers](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs)
- [WebCodecs API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [VideoEncoder hardware acceleration — w3c/webcodecs#492](https://github.com/w3c/webcodecs/issues/492)
- [mp4-muxer — Vanilagy/mp4-muxer](https://github.com/Vanilagy/mp4-muxer)
- [Detect Hardware Video Codecs in Chrome — Gromnitsky 2025-02-17](https://sigwait.org/~alex/blog/2025/02/17/1mJJHm.html)
- [GPU Hardware Acceleration for Headless Chrome](https://mirzabilal.com/how-to-enable-hardware-acceleration-on-chrome-chromium-puppeteer-on-aws-in-headless-mode)
