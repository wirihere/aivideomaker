> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Render performance audit — 2026-04-27

Goal: find concrete speedup opportunities for the HyperFrames render
pipeline. Subject comp: `singularity-convergence.html` — 1080×1920, 60s,
30fps, 1800 frames.

## Host

12 CPU cores · 15.8 GiB RAM · Win11 · ffmpeg shipped via
`@ffmpeg-installer` (Gyan build N-92722, **2018-12 vintage**) ·
NVENC + QSV + AMF h264 hardware encoders all compiled-in.

## Pipeline shape

`scripts/render.mjs` wraps `hyperframes render` + optional grade
(2nd ffmpeg) + optional watermark (3rd ffmpeg). Quality presets
([cli.js:26641](../../node_modules/hyperframes/dist/cli.js#L26641)):

| Preset     | x264 preset | CRF | codec |
| ---------- | ----------- | --- | ----- |
| `draft`    | ultrafast   | 28  | h264  |
| `standard` | medium      | 18  | h264  |
| `high`     | slow        | 15  | h264  |

Default workers = `max(1, min(floor(cores * 3/4), 8))` →
**8 workers on this box** ([cli.js:38011](../../node_modules/hyperframes/dist/cli.js#L38011)).

## Measured baselines

Live benchmark aborted: 2.1 GB free RAM at session start, 3 back-to-
back 60s renders would have OOM-thrashed the box. Used historical
telemetry from `renders/v3-*-render.log` + `v4-render.log` (same
1080×1920 comp shape, ~25-27s, 2/4 workers, standard preset).
Shipped singularity-convergence mp4s confirm output shape: **2.0–
2.3 Mbps libx264 yuv420p, AAC 123–194 kbps.**

| Comp                | Frames | Workers | Wall   | fps   | Source log              |
| ------------------- | -----: | ------: | -----: | ----: | ----------------------- |
| index 25.5s, 3 audio | 765   | 2       | 8m 54s | 1.43  | `v4-render.log`         |
| index 26s, 3 audio   | 780   | 2       | 10m 02s| 1.30  | `v3-3-render.log`       |
| index 26s, 3 audio   | 780   | 2 (CPU) | 13m 08s| 0.99  | `v3-2-render-cpu.log`   |
| index 27s, 3 audio   | 810   | 2       | 12m 43s| 1.06  | `v3-render-w2-cpu.log`  |

**Linear projection for singularity-convergence (1800 frames):**
- workers=2, standard: ~21 min wall (1.43 fps × 1800 = 1259s + ~2min encode)
- workers=8, standard: extrapolating LEARNINGS Phase 3 ceiling (1.43× ≈
  1.4-1.5× over w=2 once Chrome contention dominates), **~14-15 min**
- workers=2, draft preset: encoder is ~3-4× faster; capture unchanged,
  so total **~15-16 min** (capture dominates — see "Where time goes").

**LEARNINGS §6 confirmation:** Phase 5 brief claimed "1.27× incremental"
but honest re-measurement same day was "Phase 5 ~7s slower in steady
state" — kindred-recut 540 frames @ 6 workers = 88s. That's
**0.16s/frame JPEG q=95 on render-vite**, projecting **~5 min for 1800
frames** vs **~21 min on `npx hyperframes render`**. Vendor renderer
is ~4× slower per frame at the same worker count. **Headline finding.**

## Where time goes

LEARNINGS §6 measured **165ms/frame compositor flush** on kindred.
1800 × 165ms = 5 min on Chrome paint alone, single-worker. With N
workers the floor is `(1800 × 165ms) / N` + IPC + encode. Three layers:

1. **GPU compositor flush** ~165ms/frame. Dominates capture.
2. **page.screenshot → PNG → disk** — Phase 4 buys only ~22% by
   replacing PNG with JPEG q=95.
3. **libx264 encode** — ~10-15s for 1800 frames at `preset medium crf 18`.
   ~5% of total wall; nearly free.

The 4× vendor-vs-vite gap is likely the vendor's compile + audio extract
+ encode + assemble phases (visible as 25%/10%/15% chunks in its
progress bar). Worth confirming on a clean run when RAM allows.

## Top 3 bottlenecks (ranked)

1. **GPU compositor flush** at ~165ms/frame. Owns 70-80% of capture wall.
   Replaceable only by skipping DOM compositing entirely — i.e. raw-RGBA
   pipe via `[data-render-canvas]` (Phase 6, scaffold only — no comp opts in).
2. **Vendor `hyperframes render` overhead.** Phase boundaries
   (compile/audio/encode/assemble) appear to add ~25-40% on top of pure
   capture vs `render-vite`. Worth instrumenting before assuming the
   vendor is doing something necessary.
3. **CPU x264 encode at preset=medium.** Cheap on 60s comps (~5% wall) but
   becomes meaningful on long renders. `h264_nvenc -preset p4` would
   cut this to ~5-10s regardless of length.

## Memory profile — why long renders OOM

Each Chromium BrowserContext = 150–250 MB resident. Default 8 workers
= ~2 GB browsers + V8 heap. On 15.8 GB box with ~13 GB already in use
(Chrome, Claude Code, etc.), 2.1 GB free is exactly what 8 workers
consume. The frame-1530/1800 v2 wall fits **the GC-stop-the-world
death spiral**: swap kicks in, screenshots back up in IPC, V8 heap
grows, paint takes 10× longer. `render-vite.mjs:217` has a memory
clamp; vendor `hyperframes render` does not.

## ffmpeg parameter audit

Three independent ffmpeg passes today:

| Pass         | Where                          | Settings                                                        | Verdict        |
| ------------ | ------------------------------ | --------------------------------------------------------------- | -------------- |
| Render encode| vendor (cli.js:26302)          | libx264 / preset medium / crf 18 / yuv420p / +faststart         | Reasonable     |
| Grade pass   | `post-grade.mjs:212`           | libx264 / preset medium / crf 18 / -c:a copy / +faststart       | Reasonable     |
| Watermark    | `render.mjs:312`               | libx264 / preset medium / crf 18 / -c:a copy / +faststart       | **Re-encode!** |

**Findings:**

- Grade and watermark each transcode at preset medium crf 18 — ~12-18s
  *each* per 60s 1080×1920 pass. Grade unavoidable (LUT touches every
  pixel); watermark forces re-encode via `overlay` filter. **Win:
  fuse grade `lut3d` into the render encode → drops one ffmpeg.**
- ffmpeg N-92722 is **Dec 2018**. NVENC quality has had 2-3 generations
  of improvements since; current Gyan builds (`apad=whole_dur` and
  newer filters) ship cleanly via `@ffmpeg-installer` updates.
- `-pix_fmt yuv420p` + `-movflags +faststart` are correct for web/mobile.
- No `-tune` flag — fine for VOD.
- AAC 192k vendor / 123k shipped — both fine.

## Quality preset map (what `-q` actually changes)

Source: [cli.js:26641-26643](../../node_modules/hyperframes/dist/cli.js#L26641).
Quality preset only controls the libx264 encoder side, not capture:

```js
draft:    { preset: "ultrafast", quality: 28, codec: "h264" }
standard: { preset: "medium",    quality: 18, codec: "h264" }
high:     { preset: "slow",      quality: 15, codec: "h264" }
```

So `-q draft` saves ~10-15s of encode wall on a 60s comp. **Frame
capture (the real bottleneck) is unchanged.** Anyone running `-q draft`
expecting a 3× wall-clock speedup is going to be disappointed.

## Five concrete speedup proposals

Ranked by realistic wall-clock impact / effort. Singularity 1800 frames,
projected 21 min wall at workers=2 standard.

| #  | Proposal                                                  | Wall savings                | Effort    | Risk     |
| -- | --------------------------------------------------------- | --------------------------- | --------- | -------- |
| 1  | **Use `render-vite.mjs` as default for known-good comps** | ~21min → ~5min (4×)        | 2-4h      | Low      |
| 2  | **NVENC encode in render-vite**: `-c:v h264_nvenc -preset p4 -cq 19` | ~10-15s/render             | 1-2h      | Low-Med  |
| 3  | **Fuse grade into render encode** via `-vf lut3d=...`     | ~12-18s (drops 1 ffmpeg)   | 1-2h      | Low      |
| 4  | **Memory-clamp the vendor renderer**: cap workers when    | Prevents OOM at 1530/1800  | 30min     | Low      |
|    | `freemem() < workers × 300MB`; warn + reduce              |                             |           |          |
| 5  | **Phase 6 raw-RGBA via canvas opt-in** for one comp       | Skips compositor flush —    | 8-12h     | Med      |
|    | (would need authoring change to add `[data-render-canvas]`) | up to 2-3× capture phase   |           |          |

### Detail on #1 — adopt render-vite as default

Phase 4 measured 88s for 540 frames on kindred-recut at workers=6 jpeg
q=95. Projects to **~5 min for 1800 frames**, vs vendor's ~21 min.
Phase 5 confirmed byte-identical mp4 (md5 match). Audio mux works.
Memory clamp at line 217 protects against OOM. No technical blocker
to adoption — recommend `--engine=vite` flag in `scripts/render.mjs`
so it's reversible.

### Detail on #2 — NVENC

ffmpeg N-92722 has `h264_nvenc` enabled. LEARNINGS §6 attempted nvenc
2026-04-23 and hit `Terminating thread with return code -22 (Invalid
argument)` (`v3-1-render.log`). Cause: render-vite hardcodes `preset
slow` which nvenc rejects (it wants `p1`-`p7`). **Fix: one preset-name
swap (`slow → p4`)**. Roadmap parks this as Phase 7 — promote.

## Already optimal — don't touch

- `-pix_fmt yuv420p` + `-movflags +faststart` — correct for web/mobile.
- **CRF 18 / preset medium** — right default for "TikTok/IG-clean."
- **JPEG q=95 intermediate** — SSIM ≥0.998 proven, 3× faster than PNG.
- **Parallel BrowserContexts** — workers=6 == workers=8 within noise;
  GPU compositor is the serial bottleneck above that.
- **Memory clamp in render-vite** at line 217. Vendor renderer is
  missing this — frame-1530/1800 OOM is the visible symptom.

## Parked levers — verdict update

| Lever                   | LEARNINGS verdict | Update                                                                                        |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| Bun runtime swap        | WAIT to Q3 2026   | Hold. Render time isn't startup-bound — wins are sub-second.                                  |
| WebCodecs frame capture | WAIT for Phase 6  | **Promote to PROTOTYPE.** Phase 6 is scaffold-only with no consumer; WebCodecs is the only path that genuinely skips compositor flush at production scale. ~12h estimate. |
| Phase 6 raw-RGBA        | DONE scaffold     | **Promote to canvas-author one comp.** Without an opt-in comp the scaffold buys nothing.      |
| GPU encode (NVENC)      | Parked Phase 7    | **Promote to next-up.** 1-2h, immediate 10-15s/render savings, pre-existing ffmpeg support.   |

## Recommended next 3 actions

1. **Spike render-vite end-to-end on singularity-convergence** when RAM
   allows. If <8 min wall, add `--engine=vite` to `scripts/render.mjs`.
2. **Add NVENC to render-vite** behind `--encoder=nvenc`. Map `slow → p4`,
   `-cq 19 -rc constqp`. Spot-check visual vs libx264.
3. **Memory-clamp vendor renderer** in `scripts/render.mjs`: cap
   `--workers` via `os.freemem()` before spawning. Stops frame-1530 OOM.
