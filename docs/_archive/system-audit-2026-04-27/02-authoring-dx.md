> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# 02 — Authoring DX

Field report on what it actually feels like to write a HyperFrames composition in this repo, post sacred-oracle wave. Source material: the 5 sacred-oracle compositions (`compositions/templates/sacred-oracle/sacred-{hook-15s,witness-30s,path-45s,revelation-60s}.html` + `compositions/singularity-convergence.html`), the 8 structural templates at `compositions/templates/*.html`, the scaffolders in `scripts/{new-scene,new-comp,extract-copy}.mjs`, and `npx hyperframes docs <topic>` output.

**TL;DR.** The framework is healthy — `lint` + `lint:strict` + `smoke` form a tight feedback loop, and `cards-sacred-oracle.css` plus `compositions/templates/README.md` show that the team has internalized layered authoring. But every new template still hand-writes the same five-block scaffold, and the scaffolders we have today (`new:scene`, `new:comp`) don't speak the structural-template grammar, so they can't help author a sacred-style file from scratch. Cold-read time-to-first-edit is acceptable (~25 min) thanks to inline LESSONS-APPLIED comments, but cold-read time-to-first-render is closer to 90 min because of pathing and audio-file friction.

---

## 1. Friction points

### F1. `data-track-index` reservations are tribal knowledge in 3 places

Reserved ranges live duplicated at `LEARNINGS.md:394`, `LEARNINGS.md:828`, and the detector at `scripts/fix.mjs:30`. `scripts/new-scene.mjs:196` hardcodes `audioTrack = 9` and never validates against existing comp tracks. Result: a fresh `npm run lint` against `index.html` currently emits 17 `duplicate_audio_track` warnings — every sacred template re-references `PLACEHOLDER.mp3` at track 9 once index.html sub-composes them. No central manifest, no pre-flight check.

### F2. Music + VO + ambient boilerplate is hand-rolled per template

The same 8-line `<audio id="music">` + `<audio id="vo">` block appears verbatim (modulo duration) in `sacred-hook-15s.html:217-229`, `sacred-path-45s.html:251-265`, `sacred-revelation-60s.html:386-400`, `sacred-witness-30s.html:281-295`. Same for `<div class="ambient-haze">` + its `@keyframes haze-breathe`, and the `prepareStrokes` SVG-dasharray helper in `singularity-convergence.html:870-888`. None is a registry block; none is emitted by a scaffolder. The four PLACEHOLDER.mp3 references collide on track 9 the moment index.html sub-composes them — pre-render lint should have caught it.

### F3. Path depth changes silently break asset references

`compositions/templates/sacred-oracle/sacred-hook-15s.html:225` uses `src="../../../assets/...mp3"` (three `..` for two-level nesting). Move the file and every `<audio src>`, `<img src>`, and `<link href>` must be hand-rewritten. No `<base>` tag, no resolver, no audit. `scripts/new-scene.mjs:193-228` punts entirely with a printed warning ("Adjust if you paste into a sub-composition"). The scaffolder cannot produce a working nested-path comp.

### F4. The two existing scaffolders don't speak the structural-template language

`scripts/new-scene.mjs` builds N narration-anchored beats (one `.beat-text` per scene, GSAP `textFx.cascade` per beat). It produces something topologically very different from a sacred or community-app template: no register-level CSS file (`design/cards-sacred-oracle.css`), no per-beat unique stage classes (`.b0-stage`, `.b1-question`, `.b2-stage`), no music+VO scaffolding, no LESSONS-APPLIED comment block. The 8 structural templates and the 5 sacred templates were all written by hand. Anyone adding a 9th structural template OR a 6th sacred-register template starts from copy-paste, not `npm run new:template`.

### F5. The 8 structural templates aren't internally consistent

Template head-blocks vary (`compositions/templates/social-reel-15s.html:28-43` has the `HEAD-INCLUDE` markers that `compositions/templates/community-app-tour-30s.html:35-44` also has, but `sacred-hook-15s.html:37-40` doesn't). Asset path conventions differ: some templates use `assets/PLACEHOLDER/logo.png` (community-app-tour:340), some use `tokens-PLACEHOLDER.css` (`social-reel-15s.html:31`), the sacred family uses neither — sacred is hard-wired to its register's own `cards-sacred-oracle.css` palette and never references brand tokens at all. Naming for scenes is inconsistent: kinetic-pop family uses `s1/s2/...`, sacred family uses `b0/b1/...` (B for "beat"), community-app-tour mixes both. A new author asks "what's the convention?" and gets four answers depending on which template they opened first.

---

## 2. Tooling additions that would help

### T1. `npm run new:template -- --register=sacred-oracle --duration=20s` — register-aware scaffolder

Today's `new-scene.mjs` is narration-driven and generic. Add a sibling `new-template.mjs` that takes a **register** (sacred-oracle, kinetic-pop, warm-community, …) and emits:
- The header with the right vibe + brand token + bundle imports for that register
- N scene blocks with **register-conventional** IDs (`b0..bN` for sacred, `s1..sN` for kinetic-pop)
- The audio + music boilerplate with **already-correct** `data-track-index` for that register's reservations
- A LESSONS-APPLIED comment block sourced from `docs/social-video-patterns.md` Part 7 (sacred) or the register's playbook
- The relative-path `../` count derived from where the file is being written

This is the missing 3rd scaffolder. `new:comp` builds a brand from a URL; `new:scene` builds N narration beats; `new:template` would build a structural shell within a given register.

### T2. Track-index manifest + lint rule

`design/track-index-reservations.json` listing the canonical assignments (`{ "0-7": "scene clips", "8": "music", "9": "narration", ... }`). `scripts/fix.mjs:30` already has a `track-index-collision` detector for **runtime overlaps**; extend it (or add a new id `track-index-violation`) to flag any element that uses a track outside its reserved range without an `<!-- track-override-ok -->` opt-in. `scripts/new-scene.mjs:196` should read the manifest instead of hardcoding `9`. Today the lint output from a vanilla `npm run lint` is buried under 17 redundant duplicate-audio-track warnings caused by `index.html` sub-composing four templates that all use `PLACEHOLDER.mp3` at track 9 — that's noise the author has to learn to ignore, instead of a tool catching the real "you put two narrations on one track" case.

### T3. Path-aware asset resolver

Author writes `data-asset-music="sacred-cosmic-1"`; a JS shim in `design/modules/all.js` resolves to the right relative path at runtime based on comp depth. Eliminates the `..`-counting bug (F3). Alternative: emit `<base href>` from the scaffolder.

### T4. Pre-render audio-track audit (extend `lint:strict`)

A new detector `audio-placeholder` that errors when **any** committed comp ships with `src="...PLACEHOLDER.mp3"`, plus a sibling `audio-todo` (warn) that surfaces every `data-todo` attribute. This catches the sacred-oracle batch's `<audio data-todo="provide TTS for this template's narration">` (`sacred-hook-15s.html:228`) before render time — right now those PLACEHOLDER.mp3 references are why the duplicate-track lint warnings cascade.

### T5. Frame-flipbook should gate render

`scripts/frame-flipbook.mjs` exists but isn't part of `npm run check`. Per memory `feedback_silent_loop_not_skipped`, flipbook review must happen BEFORE render, not after. Add `npm run check:flipbook` that captures 6-8 mid-scene frames to `renders/.flipbook/` and exits non-zero on any < 1 KB (blank) or solid-black/white frame, then wire into the standard check chain.

---

## 3. What works and should be promoted

### W1. Inline LESSONS-APPLIED comment blocks

Each sacred comp opens with a 12-line block listing the canon rules applied (`sacred-hook-15s.html:24-35`) — `max-width: 920px` on hero italic, Arial for utility lines, gold hairline draw direction, hard-kill `tl.set(opacity:0)` at scene boundary, etc. A cold reader knows what's load-bearing without opening `docs/social-video-patterns.md`. This should be mandatory and emitted by `new:template` (T1). The 8 older structural templates have only CONTENT-SLOT-PROTOCOL blocks; backfill them.

### W2. Register-level CSS file pattern (`cards-sacred-oracle.css`)

`design/cards-sacred-oracle.css` factors out the 5 templates' shared atoms: `:root` tokens, `.comp` baseline, `.ambient-haze` keyframes, `.starfield`, `.clip` helper. ~100 shared lines, each template adds 100-200 of its own. This is the 3-layer architecture in `compositions/templates/README.md` applied at a **register layer** — a missing 4th tier above brand tokens. Future registers (e.g. industrial-hard for biker/motorsport per memory `project_music_shortlist_gap`) should ship as `design/cards-<register>.css` + N templates from day one.

---

## 4. Patterns that deserve to be skill files / registry blocks

Looking at what's NOT covered by `~/.claude/skills/{hyperframes,gsap,hyperframes-cli,hyperframes-registry,website-to-hyperframes}` and what authors keep redoing:

- **`/sacred-oracle-template`** skill — encodes the LESSONS APPLIED list, the `b0..bN` naming, the music+VO track reservations (8/9/0.18/0.95), the hairline-draw + emblem-fade + textFx.typeOn beat grammar, and the replay-loop end-frame rule. Right now this knowledge lives in 5 inline comment blocks — a skill would let agents author a 6th sacred template without a human re-reading them.
- **`hyperframes add audio-vo-track`** registry block — drops the canonical 4-line music + 4-line VO snippet with placeholder src + correct tracks (fixes F2). Same for `audio-sfx-track-20` (per-SFX scaffold from `LEARNINGS.md:386-394`).
- **`hyperframes add scene-replay-loop`** registry block — the "end frame matches start frame" pattern (B0 → B6 in `sacred-revelation-60s.html`, 0-6s flame mirror at 56-60s).
- **`/render-flipbook-check`** skill (or extension to `iterate-render`) — capture 6-8 mid-scene PNGs, present visually, prompt for ship/iterate. The user-feedback memory `feedback_silent_loop_not_skipped` makes this non-negotiable; encoding it as a skill makes it cheap to invoke.

---

## 5. Cold-read time-to-first-edit budget

**Time-to-first-edit** (open a sacred template, swap "What if the answer was always inside the question?" with the brand's hook, render preview): **~25 minutes** for a new contributor who has read CLAUDE.md but not LEARNINGS.md.

Breakdown:
- 5 min: read the LESSONS-APPLIED comment block + skim `compositions/templates/README.md`
- 5 min: locate `#b1-question` element, edit text, locate `#b2-wordmark/#b2-wordmark-sub/#b3-cta/#b3-url`, swap copy
- 10 min: realize `PLACEHOLDER.mp3` exists but they need a real VO, run `npm run new:scene` and discover it generates a different scaffold shape, fall back to manually invoking `fetch-tts-edge.mjs`
- 5 min: `npx hyperframes preview` works; first-edit ships

**Time-to-first-render** is realistically **~90 minutes** because:
- The path-depth issue (F3) bites on first move
- The track-index-collision lint warnings (F1, F4) are 17 lines of noise on a fresh checkout
- `npm run check` flipbook-gating doesn't exist yet (T5), so the user catches a blank-scene issue post-render and re-runs

If T1+T2+T4 land, time-to-first-render drops to ~30 min — within "lunch break" range.

---

## File-path index

- `compositions/templates/sacred-oracle/sacred-{hook-15s,witness-30s,path-45s,revelation-60s}.html` — 288/348/326/497 lines
- `compositions/singularity-convergence.html` — 1320 lines, the master "exhibition" comp
- `design/cards-sacred-oracle.css` — register-level shared CSS (W2)
- `scripts/new-scene.mjs:196` — hardcoded `audioTrack = 9`
- `scripts/fix.mjs:13-30` — 15 detectors; missing `audio-placeholder` (T4) and `track-index-violation` (T2)
- `LEARNINGS.md:394, 828` — track-index reservations duplicated; should source from a manifest (T2)
- `compositions/templates/README.md:8-28` — 3-layer architecture diagram; add a 4th "register" tier (W2)
