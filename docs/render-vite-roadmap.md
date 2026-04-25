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

## Phase 2 — audio mixing

- Scan the comp DOM for `<audio>` elements and their `data-start` /
  `data-duration`.
- Encode video first (current path), then a second ffmpeg pass:
  `ffmpeg -i video.mp4 -i audio.mp3 -map 0:v:0 -map 1:a:0 -c:v copy
  -c:a aac -b:a 192k -shortest out.mp4`. `-c:v copy` keeps the libx264
  encode untouched.
- Multi-track: `-filter_complex amix=inputs=N:duration=longest` ahead of
  `-map`. Mirror level/duck logic from `scripts/render.mjs` once known.

## Phase 3 — perf

- Parallel BrowserContexts (smoke already uses up to 6 — see
  `MAX_PARALLEL`). Split frame ranges across workers; `frame-%06d.png`
  numbering keeps ffmpeg input deterministic.
- Optional GPU encode: `-c:v h264_nvenc -preset p4 -cq 19` on NVIDIA hosts.
- Stretch: pipe raw RGBA to ffmpeg (`-f rawvideo -pix_fmt rgba`), skipping
  PNG disk I/O entirely.

## Out of scope

- Watermark / LUT — already in `scripts/render.mjs` + `post-grade.mjs`.
- Replacing `npx hyperframes render`. `npm run render` stays the
  production path; `render:vite` is opt-in.
