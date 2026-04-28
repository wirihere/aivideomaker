> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# Lint Detectors — Audit 2026-04-27

Coverage of `scripts/fix.mjs` (project) + `npx hyperframes lint`
(framework). What fires today, what bites that lint misses, what to ship next.

---

## 1. Detector inventory (`scripts/fix.mjs`)

17 detectors registered. Run on 78 HTML+CSS files: **915 findings · 0 err · 915 warn · 0 info · 36 auto-fixable.**

| # | id | sev | what it checks | hits | known FP | opt-out |
|---|---|---|---|---|---|---|
| 1 | `script-close` | err | literal `</script>` after `//` JS comment | 0 | low | manual |
| 2 | `from-opacity` | warn | `tl.from(...{opacity:0})` brittle on paused tl | 6 | low | rewrite as `fromTo` |
| 3 | `scene-override` | warn | `.scene { 1080×1920 }` redundant under cards.css 100%/100% | 0 | medium (deliberate landscape) | none |
| 4 | `autoplay-guard` | warn | paused+registered tl missing `window===window.top` guard | 23 | low | append guard (auto-fix) |
| 5 | `cdn` | warn | GSAP from jsdelivr/unpkg/cdnjs/etc | 13 | low | use vendor (auto-fix) |
| 6 | `bundle` | info | 4+ individual `design/modules/*.css` links | 0 | low | none |
| 7 | `audio-id` | err | `<audio data-start>` w/o `id` (silently dropped) | 0 | none | add id |
| 8 | `audio-track` | err | overlapping `<audio>` on same `data-track-index` | 0 | low | unique track |
| 9 | `gsap-set-loop` | info | `for` loop running `tl.set()` ≥30 iters | 0 | low | CSS @keyframes |
| 10 | `font-var` | warn | `font-family: var(--*-font-*)` skips embedding | 574 | low (after token whitelist) | direct font / @font-face |
| 11 | `audio-no-clip` | err | `<audio data-start>` missing `class="clip"` | 0 | low | add `class="clip"` |
| 12 | `subcomp-currentscript` | warn | `document.currentScript.closest()` in sub-comp wrapper | 0 | low | querySelector / `// inline-only-reference` |
| 13 | `video-bleed-guard` | err | `<video>` in clip ancestor w/o `opacity:0` + tl.set pair | 0 | medium (regex ancestor check) | `<!-- video-bleed-ok -->` |
| 14 | `repeat-no-final-set` | warn | `repeat:N` opacity/scale w/o yoyo or landing keyframe | 0 | low | yoyo / landing / `// pulse-end-handled` |
| 15 | `narration-mid-tween` | warn | `<audio>` ends inside active GSAP tween (>0.15s off boundary) | 4 | low (excludes tweens ≥4s) | `// narration-mid-tween-ok` |
| 16 | `track-index-collision` | err | two clips share track-index AND time-overlap | 0 | low | `<!-- track-collision-ok -->` |
| 17 | `scene-overlap-visual` | warn | clips on different tracks overlap >0.5s | **295** | **HIGH** — most prod templates legitimately stack header+scene tracks | `<!-- scene-stack-ok -->` |

### HyperFrames built-in lint

Two visible rules: `overlapping_gsap_tweens` (warn, 10) and
`duplicate_audio_track` (warn, 56). Duplicate-audio is a LEARNINGS-confirmed
**cross-comp FP** — HF walks every `compositions/*.html` independently and
double-counts the same audio under different relative paths. `--help`
advertises only `--json` / `--verbose`; rule set hard-coded upstream.

---

## 2. Fire counts — top to bottom

| rule | hits | reading |
|---|---|---|
| `font-var` | 574 | Long-tail. Needs migration before flipping to error. |
| `scene-overlap-visual` | 295 | Almost all noise — stack pattern. |
| `autoplay-guard` | 23 | Real fix work in sub-comps. Auto-fixable. |
| `cdn` | 13 | Same fileset. Auto-fixable. |
| `from-opacity` | 6 | Real bugs latent in older comps. |
| `narration-mid-tween` | 4 | Recent — sacred-oracle family. |
| Other 11 | 0 | Either covered or not yet seeded. |

**869 / 915 (95%) of warns** come from two rules — `font-var` (advisory
migration) and `scene-overlap-visual` (noisy). Warn S/N ratio is poor.

---

## 3. False positives — known and suspected

| detector | FP shape | upstream fix |
|---|---|---|
| `scene-overlap-visual` | Header (track 1) overlaps scene (track 0) entire comp — by-design stack. One comp 20+ fires. | Auto-detect persistent-overlay tracks (clip ≥80% of comp); exempt cross-track pairs including them. |
| `font-var` | None today after cards.css + templates whitelist. 510→574 hits = new comps; recheck whitelist. | Probably none. |
| HF `duplicate_audio_track` | Cross-comp double-counting via different relative paths (§4). | Upstream issue. Mitigation: lint per-file. |
| HF `validate` contrast | Samples hidden inactive scenes; impossible 1:1 ratios. 32→29 confirmed FP on Kindred. | Upstream — should respect `class="clip"` + `data-start/duration`. |
| `video-bleed-guard` | Regex ancestor check (not real DOM parser). Can miss-fire on commented-out tags or when `tl.set` lives in a different `<script>` block. | Replace ancestor check with parse5/cheerio. |

---

## 4. Real bugs lint missed

| bug | how caught | proposed detector |
|---|---|---|
| `.scene { height: 0 }` silent layout collapse — sacred-oracle CSS module missing `.scene` baseline | flipbook (parallel agent) | **`scene-baseline-rule`** (S) |
| B4 typeOn question text overflow — flipbook hit mid-typing | full render + user-eye | **`typeon-overflow`** (M) |
| Photo path pointing to foreign-brand asset | manual review | **`asset-path-brand-mismatch`** (S) |
| Hardcoded foreign-brand paths in templates | manual grep | covered by `asset-path-brand-mismatch` |
| Music duration < comp duration — bed cuts mid-narration | listening | **`music-budget-fits`** (S) |
| `textFx.typeOn` >300 chars → DOM bloat / perf cliff | render slowdown | **`typeon-char-budget`** (S) |
| Loop-friendliness — start frame ≠ end frame | manual playback | **`loop-seam`** (L, defer) |

Brand-name absence is verifier-covered (lint can't see scrubbed visible
text). `<video>` autoplay bleed shipped as `video-bleed-guard` post-v3.3.

---

## 5. Top 5 missed-bug detectors to ship

| # | id | sev | effort | rationale |
|---|---|---|---|---|
| 1 | `scene-baseline-rule` | err | **S** | §4 entry exists, almost shipped 2026-04-27. Pure-regex on `design/**/*.css`. |
| 2 | `asset-path-brand-mismatch` | warn | **S** | Foreign-brand assets keep slipping in. `<img>` regex cross-checked vs `meta.json` slug. |
| 3 | `music-budget-fits` | warn | **S** | Reuses `extractAudioTags`. |
| 4 | `typeon-overflow` | warn | **M** | Playwright DOM measurement; hook into existing flipbook stage. |
| 5 | `typeon-char-budget` | info | **S** | Lint-time text-length count. |

Right split: **lint = DOM-static correctness, verifier = pixel reality.**
Visual fidelity / palette / content-slot checks belong in verifier, not
`fix.mjs`. Placeholder-leakage detection already exists per SUGGESTIONS;
if templates declared `data-slot="…"`, "no `data-slot` left containing seed
copy" becomes a feasible Tier-2 lint.

---

## 6. Severity rebalance

| detector | now → proposed | reason |
|---|---|---|
| `font-var` | warn → **err after migration** | LEARNINGS §8 explicit. 574 hits make flipping today error spam. |
| `scene-override` | warn → **info** | Bug structurally impossible since `.scene { 100%/100% }`. Keep advisory. |
| `subcomp-currentscript` | warn → **err** | §4: "11 script errors + render hang." 0 fires (sub-comps marked inline-only-reference) but pre-emptive — any active comp wiring `data-composition-src` hangs the renderer. |
| `scene-overlap-visual` | warn → **info** OR header-aware variant | 295 hits, almost all legitimate stacking. Drop tier or detect "clip spans ≥80% of comp = header" and exempt. |
| All error-tier (`script-close`, `audio-id`, `audio-track`, `audio-no-clip`, `video-bleed-guard`, `track-index-collision`) | (no change) | Correct. |

---

## 7. Lint-detector-proposals doc status

`docs/lint-detector-proposals-2026-04-26.md` lists 9 already-gated + 5
"DISPATCH READY" proposals. **All 5 shipped** (`font-var`, `audio-no-clip`,
`subcomp-currentscript`, `video-bleed-guard`, `repeat-no-final-set`), plus
3 §8 choreography rules. Doc unchanged since 2026-04-26 — reads stale.
**Action:** replace with §5 top-5 as the new "parked next" list.

---

## 8. Effort estimates

| id | effort | notes |
|---|---|---|
| `scene-baseline-rule` | **S** ~30m | Glob `design/cards-*.css` + `design/templates/*.css`, regex `.scene\s*\{[^}]+\}`, require non-zero `width` + `height`. Add to `kinds:["css"]`. |
| `asset-path-brand-mismatch` | **S** ~45m | Read sibling `meta.json` slug; scan `<img>`/`<video>` for `assets/<brand>/...`; warn when `<brand>` ≠ slug AND ≠ shared dirs. |
| `music-budget-fits` | **S** ~30m | Reuse `extractAudioTags` → filter track 8 → sum durations vs comp `data-duration`. |
| `typeon-overflow` | **M** ~2h | Wire into flipbook stage; auto-seek to `at + duration + 0.1` for every `textFx.typeOn`, DOM-measure overflow, emit typed finding. |
| `typeon-char-budget` | **S** ~30m | Inline-script regex; count chars in selector's element. Info >300, warn >500. |

**Tier-2 parked:** `scene-overlap-visual` header-aware refactor (M, 295→~10);
`loop-seam` (L, defer); visual-fidelity / palette — deepen verifier, not lint.

---

## 9. Bottom line

17 detectors cover the §4 mechanical-pitfall surface well — 5 error-gated
for renderer-breaking bugs, rest advisory. Missed are **bugs visible only
in render output or DOM measurement**: `.scene{height:0}`, typeOn overflow,
foreign-brand asset paths, music duration. Need (a) cheap CSS-glob lint rules
(3 S-effort detectors next session), (b) flipbook-side DOM measurement
(M, leverages existing stage), (c) verifier deepening for palette / content /
asset truth.

**Severity rebalance is the unblocked win:** drop `scene-overlap-visual`
to info (or make it header-aware), promote `subcomp-currentscript` to err.
Warn signal-to-noise jumps from ~30% real to roughly the inverse without
writing any new detector code.

---

**Sources:** `scripts/fix.mjs` (17 detectors); `docs/lint-detector-proposals-2026-04-26.md` (stale, all 5 shipped); `LEARNINGS.md` §4 + §8 + sacred-oracle / wave-R entries; `docs/render-learnings/{SUGGESTIONS,LEDGER}.md`.
