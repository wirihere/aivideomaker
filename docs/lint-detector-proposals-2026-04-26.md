# Lint Detector Proposals — 2026-04-26

Audit of `scripts/lint-strict.mjs` (via `scripts/fix.mjs`) against `LEARNINGS.md §4`.

## Currently gated (9)

| id | Sev | §4 pitfall |
|---|---|---|
| `script-close` | **err** | `</script>` literal in JS comments |
| `from-opacity` | warn | `tl.from(...{opacity:0})` on paused timelines |
| `scene-override` | warn | `cards.css` portrait override on landscape |
| `autoplay-guard` | warn | Standalone autoplay guard missing (§3) |
| `cdn` | warn | GSAP from CDN (§3) |
| `bundle` | info | 4+ `design/modules/*.css` links (§3) |
| `audio-id` | **err** | `<audio data-start>` without `id` |
| `audio-track` | **err** | Overlapping `<audio>` on same track |
| `gsap-set-loop` | info | Per-frame `tl.set()` particle bloat |

Only 3 of 9 are error-gated. Growth target = error tier.

---

## Top picks (DISPATCH READY)

### 1. `font-var` — DISPATCH READY

- **Pitfall (§4):** *Compiler doesn't resolve `var(--font-*)` for deterministic font embedding.*
- **Rule:** Scan inline `<style>` + linked project-relative `*.css`. Match `font-family\s*:\s*var\(\s*--[\w-]*font[\w-]*` (case-insensitive). Skip `@font-face` blocks and `design/tokens-*.css` (token source of truth).
- **Message:** `font-family uses var(--...) — compiler skips deterministic embedding (§4). Use a direct font name (nunito, jetbrains-mono, inter) or add @font-face.`
- **True positives:** 791 occurrences across 44 active HTML files plus 43 in `design/**/*.css`. Compiler emits the matching warning on every render today.
- **False-positive risk:** Low — every hit is a real instance once tokens-file whitelist applied.
- **Severity:** `warn` initially → `error` once codebase migrated.
- **Effort:** **S**.

### 2. `audio-no-clip` — DISPATCH READY

- **Pitfall (§4):** *One `data-track-index` = one audio channel — overlapping SFX must use different tracks* (companion: every audio with timing must have `class="clip"` so HyperFrames gates visibility/audio correctly).
- **Rule:** For every `<audio ...>` carrying `data-start`, require `class` to contain `clip`. Mirrors existing `audio-id` shape.
- **Message:** `<audio id="${id}"> with data-start lacks class="clip" — framework won't gate visibility, audio may persist after scene exit.`
- **True positives:** `archive/index-v13-pre-recut-preview.html` lines 518–642 have 15 audio tags missing `class="clip"`, exactly the pre-fix state. Production now pairs them uniformly.
- **False-positive risk:** Very low — production convention is uniform.
- **Severity:** **error**.
- **Effort:** **S** — extend `extractAudioTags()` consumer.

### 3. `subcomp-currentscript` — DISPATCH READY

- **Pitfall (§4):** *Sub-composition `document.currentScript` is null + multi-instance collides on `window.__timelines[id]`.*
- **Rule:** If file contains `<template id="..."` OR `data-composition-id="..."` AND inline `<script>` body matches `document\.currentScript\.closest\s*\(`, flag.
- **Message:** `document.currentScript inside a sub-comp wrapper returns null (§4). Use document.querySelector('[data-composition-id="<id>"]') or inline this comp.`
- **True positives:** 7 sub-comp files carry the exact pattern: `compositions/backgrounds/{video-bg,ken-burns,crossfade-two}.html` and `compositions/overlays/{wordmark-cta,word-reveal,step-badge,lower-third,ledger-card,declined-stamp}.html`. The §4 entry says these break at runtime, manifesting as 11 script errors + render hang.
- **False-positive risk:** Low — opt-out via `// inline-only-reference` comment for files only used as copy-paste templates.
- **Severity:** `warn` (advisory, no current consumer); promote to `error` if any active comp adds `data-composition-src`.
- **Effort:** **S**.

### 4. `video-bleed-guard`

- **Pitfall (§4):** `<video>` autoplays from t=0, bleeds through earlier scenes, bypasses `class="clip"` visibility.
- **Rule:** For every `<video ...>` whose nearest ancestor has `data-start` AND `class*="clip"`, require all of: (a) inline `style` with `opacity:0`, (b) `id="..."`, (c) matching `tl.set('#<id>',{opacity:1},...)` in the inline script.
- **Message:** `<video #${id}> not opacity-gated — autoplays from t=0 and bleeds (§4). Add inline style="opacity:0" + tl.set pairs at sceneStart/sceneEnd.`
- **True positives:** `compositions/backgrounds/video-bg.html:3` — bare `<video class="vb-video grade" muted playsinline></video>`, no opacity gate, no `id`. Historic bleed survived three renders before frame audit caught it.
- **False-positive risk:** Medium — restrict to clipped parents; opt-out via `<!-- video-bleed-ok -->` comment.
- **Severity:** **error**. **Effort:** **M** (nearest-ancestor check, not pure regex).

### 5. `repeat-no-final-set`

- **Pitfall (§4):** `repeat: N` on pulse can end on a hidden keyframe.
- **Rule:** For every GSAP tween with `repeat:\s*(\d+)` AND `(opacity|scale)` in vars AND no `yoyo: true`, look ahead 60 lines for matching `tl.set("<selector>",{opacity:1...},...)`. If absent, warn.
- **Message:** `Pulse tween (repeat: ${n}, no yoyo) on '${selector}' may end hidden (§4). Add tl.set("${selector}",{opacity:1}, sceneEnd-0.01).`
- **True positives:** Pre-v5 brandmark pulse rendered empty rectangle. Active comps use `yoyo: true` (`kindred-production-30s.html:714`), so won't false-fire today.
- **False-positive risk:** Low — `yoyo` exemption + `// pulse-end-handled` opt-out.
- **Severity:** `warn`. **Effort:** **M**.

---

## Not lint-able

- **Content-truth:** invented facts; Māori in TTS; wrong logo; stock-filename mismatch.
- **Runtime / shell:** Pixabay hidden-dropdown; FFmpeg PATH; ffmpeg `C:\` filter parsing; `taskkill //F //IM node.exe`; render `-w 4` crash.
- **Upstream framework:** `preview` esbuild; studio iframe hangs; `validate` contrast false-positives.
- **DOM-measurement:** typography width overflow (needs puppeteer).
- **Generic JS lint:** stale variable refs after rename — `no-undef` covers it.

---

## Ship priority

1. `font-var` (44 files, S effort, biggest blast radius).
2. `audio-no-clip` (error tier, S effort, mirrors `audio-id`).
3. `subcomp-currentscript` (7 files today, S effort).
