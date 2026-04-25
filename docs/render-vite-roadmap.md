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
