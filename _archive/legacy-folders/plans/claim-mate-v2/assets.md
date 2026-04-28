# Claim Mate v2 — Asset Manifest

Generated: 2026-04-24

---

## Photos

| Path | Size | Shots used | Source | Credit |
|------|------|------------|--------|--------|
| `assets/photos/denied-letter.jpg` | 213 KB | 1.1, 1.2 | Existing (v1) | Pixabay |
| `assets/photos/workspace.jpg` | 140 KB | 2.1, 2.2, 4.1 | Existing (v1) | Pixabay |
| `assets/photos/phone-doc.jpg` | 190 KB | 3.1 | Fetched — Pixabay scrape, query "hand phone document desk top-down", vertical, result #1 | Pixabay (royalty-free) |

---

## Videos

| Path | Size | Shots used | Source | Encoding status |
|------|------|------------|--------|-----------------|
| `assets/videos/working.mp4` | 16 MB | — | Existing (v1) — Pixabay | ORIGINAL — do not reference in composition |
| `assets/videos/working-encoded.mp4` | 13 MB | 5.1, 4.1 (video option) | Re-encoded from working.mp4 | RE-ENCODED: libx264 -r 30 -g 30 -keyint_min 30 -movflags +faststart |
| `assets/videos/bg-motion.mp4` | 13 MB | — | Existing (v1) — Pixabay | ORIGINAL — do not reference in composition |
| `assets/videos/bg-motion-encoded.mp4` | 9.7 MB | not used per shotlist note 3 | Re-encoded from bg-motion.mp4 | RE-ENCODED: libx264 with -fflags +genpts+discardcorrupt (source had corrupt frames) |

> **Note on bg-motion.mp4:** The source file contained corrupt h264 frames. Encoding required `-fflags +genpts+discardcorrupt` to recover. Output is 9.7 MB / 29s and probes clean. Per shotlist note 3, this video is NOT used in the composition — the CTA beat uses clean paper. The encoded file is available if the editor decides to use it.

---

## SVG Animations

| Path | Shots used | Source | Notes |
|------|------------|--------|-------|
| `assets/svg-animations/status/check-success.svg` | 4.2 | Existing | Green check animation, 1.1s, keep colour as-is (per animations.md) |

---

## Lucide Icons (static, no animation)

| Path | Shots used | Source |
|------|------------|--------|
| `assets/icons/lucide/check-circle-2.svg` | 3.2 | Existing |
| `assets/icons/lucide/search.svg` | 4.1 (option A) | Existing |
| `assets/icons/lucide/file-text.svg` | 4.1 (option B) | Existing |

> **Shot 4.1 icon:** Either `search.svg` or `file-text.svg` is valid per shotlist. html-composer to choose based on visual weight at 32×32px. Both exist on disk.

---

## What is NOT fetched (and why)

| Item | Reason |
|------|--------|
| Voiceover / TTS | Not in scope for this asset pass — html-composer to trigger separately |
| Music bed | Not in scope — no music fetched yet |
| Additional stock photos for Beats 6–8 | Beats 6, 7, 8 are pure typography on paper background — no photographic asset needed |
| Additional stock photo for Beat 4.1 | workspace.jpg re-used at a different crop, per shotlist |
| brand/claim-mate-paper-tick.svg | Explicitly excluded by animations.md — do not use in composition |

---

## Composition reference summary

The html-composer should reference these paths directly:

```
assets/photos/denied-letter.jpg       — Beats 1 (both shots)
assets/photos/workspace.jpg           — Beats 2 (both shots), Beat 4 Shot 4.1
assets/photos/phone-doc.jpg           — Beat 3 Shot 3.1
assets/videos/working-encoded.mp4     — Beat 5 Shot 5.1 (and Beat 4 Shot 4.1 if video preferred)
assets/svg-animations/status/check-success.svg  — Beat 4 Shot 4.2
assets/icons/lucide/check-circle-2.svg          — Beat 3 Shot 3.2
assets/icons/lucide/search.svg                  — Beat 4 Shot 4.1 (annotation icon)
assets/icons/lucide/file-text.svg               — Beat 4 Shot 4.1 (annotation icon, alternative)
```

Never reference `working.mp4` or `bg-motion.mp4` (originals) directly in the composition.
