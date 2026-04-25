# Video pipeline parallelization plan — 2026-04-26

The `npm run video -- <url>` orchestrator (`scripts/video.mjs`) runs 7 stages sequentially. Several can run in parallel without changing outputs. This doc plans the sequence so next session can dispatch directly.

## Current shape (sequential)

```
Stage 1  brand extract     (new-comp.mjs)        Playwright nav + sample colors
Stage 2  pull assets       (fetch-assets.mjs)    spawns 4 child fetchers, awaits each
Stage 3  generate copy     (extract-copy.mjs)    Anthropic API call
Stage 4  pick music        (pick-music.mjs)      reads shortlist, downloads track
Stage 5  TTS narration     (fetch-tts-edge.mjs)  Edge TTS synth
Stage 6  compose           (compose-from-template) wire scenes
Stage 7  render            (render.mjs)          ALREADY parallel (Phase 3 workers)
```

Wall-clock today on a typical run: ~30s asset stages + ~3-7min render. Stages 1-6 are ~30-60% of the total time.

## Dependency map

```
                ┌─────────────────────────────────┐
                │ Stage 1  brand extract          │
                │ outputs: tokens-<slug>.css       │
                └─────────────────┬───────────────┘
                                  │
       ┌──────────┬───────────┬───┴────────┬───────────┐
       │          │           │            │           │
   ┌───┴────┐ ┌──┴───┐ ┌──────┴─────┐ ┌───┴────┐ ┌────┴────┐
   │ Stage 2│ │ Stg 3│ │ Stage 4    │ │ Stg 5  │ │  (all   │
   │ assets │ │ copy │ │ pick music │ │ TTS    │ │  read   │
   │ fetch  │ │ gen  │ │            │ │        │ │  tokens)│
   └───┬────┘ └──┬───┘ └──────┬─────┘ └───┬────┘ └─────────┘
       │         │            │            │
       └─────────┴────────────┴────────────┘
                       │
                ┌──────┴──────┐
                │ Stage 6     │
                │ compose     │
                └──────┬──────┘
                       │
                ┌──────┴──────┐
                │ Stage 7     │
                │ render      │ (already parallel internally)
                └─────────────┘
```

**Stages 2, 3, 4, 5 are independent** — they only need Stage 1's output, not each other.

## Phase 1 — fan out Stages 2-5 (DISPATCH READY)

**Effort:** S (~1-2h). **Speedup:** 30-50% on the URL-to-MP4 path.

In `scripts/video.mjs`, replace the sequential awaits:
```js
// before
await runStage("pull:assets", ...);
await runStage("copy:gen", ...);
await runStage("pick:music", ...);
await runStage("tts", ...);

// after
await Promise.all([
  runStage("pull:assets", ...),
  runStage("copy:gen", ...),
  runStage("pick:music", ...),
  runStage("tts", ...),
]);
```

**Risks:**
- Network / API rate limits — 4 parallel fetchers each hitting their own API is fine; Pixabay rate limit is per-key and `scripts/lib/usage.mjs` already gates.
- Anthropic API has its own rate limit but a single call per video doesn't stress it.
- Stdout interleaving — log lines from 4 stages mix. Use a per-stage `[stage-name]` prefix in the spawn helper. Already half-implemented; just needs to be enforced.
- Failure handling — `Promise.all` rejects on first failure. Switch to `Promise.allSettled` + report per-stage failures + abort with a clear summary if any failed.

**Acceptance:**
1. `npm run video -- <url>` completes in measurably less wall-clock than before (compare a baseline run).
2. Failure of any one stage produces a clean error summary (not a Node unhandled rejection).
3. Output MP4 is byte-identical to the pre-parallel version when all stages succeed.

**Files:**
- `scripts/video.mjs` — refactor stage runner

## Phase 2 — fan out within Stage 2 (DISPATCH READY)

**Effort:** S (~30min). **Speedup:** 5-15s within Stage 2.

`scripts/fetch-assets.mjs:run()` spawns child fetchers and awaits each. Switch to `Promise.allSettled` over the children:
```js
// before
for (const item of manifest.photos) await run("node", [...]);
for (const item of manifest.videos) await run("node", [...]);

// after — all photos in parallel, all videos in parallel, etc.
await Promise.all([
  Promise.all(manifest.photos.map(p => run(...))),
  Promise.all(manifest.videos.map(v => run(...))),
  Promise.all(manifest.music.map(m => run(...))),
  Promise.all(manifest.icons.map(i => run(...))),
]);
```

Each fetcher already has its own asset-cache (Wave C), so re-runs are fast. The Pixabay rate limit (in `lib/usage.mjs`) tracks per-call, which is already correct.

**Risks:**
- Same API hit 4× concurrently — Pixabay tolerates ~5 RPS per key.
- Disk IO from concurrent writes — fine on modern NVMe.

**Acceptance:**
1. Same set of assets fetched in less wall-clock.
2. Cache hits still log per-asset.
3. `npm run check` green.

## Phase 3 — overlap render post-passes (NICE-TO-HAVE)

**Effort:** M (~2h). **Speedup:** ~5-10s.

In `scripts/render.mjs`, the sequence today is: render → grade → watermark → mux. Color grade reads the rendered video and outputs a graded MP4. Watermark reads the graded MP4 and outputs final. Audio mux runs in parallel today already.

The grade pass can start as soon as render's video-only MP4 is ready (which is BEFORE the audio mux pass starts). So render → (grade in parallel with audio mux) → watermark.

**Risks:**
- ffmpeg invocations stomp on the same temp paths — need to use distinct temp dirs.
- Two ffmpegs hitting GPU encoder simultaneously can exceed VRAM on weaker hardware.

**Acceptance:**
1. Final MP4 byte-identical or visually-identical to sequential version.
2. Wall-clock measurably reduced.
3. Works on the laptop AND on render-farm hardware.

### Phase 3 finding 2026-04-26 — overlap not possible at this layer

After reading `scripts/render.mjs` end-to-end, the proposed overlap doesn't match the
actual dependency graph. Recording the finding so future sessions don't re-investigate.

**Actual post-pass graph in `scripts/render.mjs`:**

```
hyperframes render (subprocess, opaque)
        │  writes: renders/<ts>.mp4   ← already fully muxed (video + audio)
        ▼
post-grade.mjs <rendered>
        │  reads:  renders/<ts>.mp4
        │  writes: renders/<ts>-graded.mp4
        ▼
ffmpeg (watermark, in render.mjs)
        │  reads:  renders/<ts>-graded.mp4   (= currentTopMp4)
        │  writes: renders/<ts>-graded-wm.mp4
        ▼
finalisation (rename / unlink)
```

**Why the plan's overlap doesn't apply here:**

1. **There is no audio-mux step in `scripts/render.mjs`.** The plan claims "render → grade
   → watermark → mux" with audio mux already parallel. In reality `hyperframes render` is
   a single opaque subprocess — no `audio mux` ffmpeg call exists in `render.mjs`. Whatever
   hyperframes does internally finishes before the script sees a new MP4 in `renders/`
   (the script detects completion via `newestMp4Since(before)` after `runWithProgress`
   resolves). There is no video-only intermediate for grade to consume early.

2. **Grade and watermark are strictly sequential by data dependency.** Watermark's input is
   `currentTopMp4`, which is set to `gradedPath` after the grade pass writes it
   (`render.mjs:416`). Watermark literally reads what grade writes. No shared input we
   could fork from — the chain is the chain.

**What would actually unlock this overlap:** a hyperframes mode that emits the video-only
MP4 as a separate artefact before the audio mux completes, so grade could start on the
video-only file while hyperframes finishes muxing audio in parallel. That's a hyperframes
upstream change, not something `render.mjs` can do from outside the subprocess.

**Decision:** no code change to `scripts/render.mjs`. Phase 3 as written is closed. If we
want the speedup later, the lever is upstream (expose video-only intermediate from
`hyperframes render`), not in this wrapper script.

## Phase 4 — DAG-aware orchestrator (DEFERRED)

**Effort:** L (~half day). **Speedup:** marginal beyond Phase 1+2+3.

A real DAG executor where each stage declares its inputs/outputs and the orchestrator picks the schedule. Useful if we add more stages, marginal otherwise. Defer until a 2nd or 3rd kind of pipeline exists (e.g., a "remix" mode that branches different copy variants).

## Recommended next-session order

1. Phase 1 (fan-out 2-5) — biggest win, simplest change
2. Phase 2 (within Stage 2) — small follow-up, mostly about flipping the for-loops
3. Phase 3 (post-pass overlap) — only if Phase 1+2 don't already feel fast enough

Phases 1 and 2 can be one agent. Phase 3 is a separate agent.

## Acceptance for the wave

After Phase 1+2:
- Baseline: time `npm run video -- <some URL>` end-to-end, capture the seconds for each stage.
- Parallelized: same URL, same flags, capture end-to-end.
- Expected: 30-50% faster on the pre-render stages. Render itself unchanged (already parallel).
- `npm run check` green throughout.
