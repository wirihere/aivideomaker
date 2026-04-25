# Claim Mate v2 — Color Grade

**Reads:** plans/claim-mate-v2/script.md, plans/claim-mate-v2/shotlist.md, assets/logo/README.md
**Through-line:** Desaturated cool-neutral baseline on all photographic material — the brand SVG, paper grid, and ink typography are unchanged; stock photos and video are pulled into the same muted ink-and-paper world so every frame feels like one shoot, not a clip library.

---

## Master palette (from brand canonical source — not invented)

| Token        | Hex                  | Role in grade                                          |
| ------------ | -------------------- | ------------------------------------------------------ |
| paper        | `#eef1f5`            | Base background for all typographic beats              |
| paper-deep   | `#e2e7ed`            | Secondary background, paper-grid zone                 |
| paper-line   | `#c8d0da`            | Cadastral grid stroke colour                           |
| ink          | `#0d1826`            | Body text, vignette edge colour, overlay base          |
| ink-2        | `#1a2a3d`            | Headings                                               |
| ink-3        | `#4b5a6d`            | Muted labels, step eyebrows                            |
| ink-mute     | `#7d8a9a`            | Fine-print line (Shot 8.2)                             |
| accent       | `#1f3a68`            | Navy — only saturated colour allowed; overlay base     |
| warn         | `#9a3a3a`            | DECLINED stamp in Shot 1.2 only                        |
| rule         | `rgba(13,24,38,.14)` | Thin hairlines, ledger rules                           |

No amber, no warm yellows, no purples. The brief confirms this — warm colours break the ordnance aesthetic.

---

## 1. The single `.grade` class

Applied to every photographic element — every `<img>`, every `<video>`. No per-asset variation.

```css
.grade {
  filter: grayscale(0.45) sepia(0.22) contrast(1.08) brightness(0.88);
}
```

**Justification against the brief's suggestion (`grayscale(0.45) sepia(0.22) contrast(1.08) brightness(0.88)`):**
The brief's suggestion is adopted without change. Here is the reasoning for each value:

- `grayscale(0.45)` — removes roughly half the chroma. Enough to kill the wildly inconsistent colour casts of Pixabay footage (green fluorescents, orange sunset, studio tungsten) without making the image feel black-and-white. The remaining 55% chroma is then tinted by sepia.
- `sepia(0.22)` — nudges the residual chroma toward the warm-brown that reads as aged paper, but at 0.22 it is restrained: it does not push into nostalgia/golden territory. At 0.30+ it would fight the cool-navy accent. 0.22 is the ceiling.
- `contrast(1.08)` — a 8% lift tightens the midtones, which compensates for the brightness reduction and keeps edges crisp against the paper background. Without it, the 0.88 brightness would make the image look muddy.
- `brightness(0.88)` — pulls the photo down 12%, ensuring it recedes behind text overlays and never competes with the white/paper typography. This is mandatory on every shot where text appears over a photographic element (Shots 5.1, 2.2). On purely typographic beats it has no effect because `.grade` is not applied there.

**Why not warmer (`sepia(0.30)` or a hue-rotate into amber)?** The brand README is explicit: "No amber, no bright yellows." The vibe is documentary, not nostalgic. The `sepia(0.22)` tint is the maximum permitted without breaking the cool ordnance aesthetic. If `workspace.jpg` still reads warm after `.grade` (it has native warmth per the shotlist note on Beat 2), do not compensate with a filter adjustment — add the paper-tone wash overlay described below instead. The filter stays identical.

---

## 2. Global overlay layer

A semi-transparent navy-to-transparent gradient sits over the full frame at all times. It is a single `<div>` in the composition root, not per-scene.

```css
.global-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(31, 58, 104, 0.07) 0%,
    rgba(238, 241, 245, 0.00) 55%
  );
  z-index: 900;
  mix-blend-mode: multiply;
}
```

**Values explained:**

- `rgba(31,58,104,0.07)` at the top — the accent navy at 7% opacity. This is the minimum that creates a visible cool push without darkening the frame. At 0.10 it visibly cools warm stock footage; at 0.07 it is a tint, not a grade.
- Fade to `rgba(238,241,245,0.00)` at 55% — the overlay only affects the top half of the frame. The lower half (where lower-third text and step labels live) receives no overlay so text contrast is not compromised.
- `mix-blend-mode: multiply` — multiplying a cool navy tint onto a muted-sepia photo pulls it toward the ink/paper palette rather than just darkening it. On paper-tone backgrounds it is nearly invisible (white × tint ≈ tint), so typographic beats are unaffected.
- `z-index: 900` — sits above all photographic layers but below all text and UI elements (which should start at 1000+).
- `pointer-events: none` — the overlay must never intercept clicks or hover events.

**Does this vary per scene?** No. The global overlay is constant. Per-scene overlay needs are handled by scene-specific overlay divs (see §4), not by modifying this layer.

---

## 3. Per-scene grade notes

The filter string does not change per scene. These notes describe overlay adjustments only.

---

### Beat 1 — Hook: the letter (~0.0–4.0s) · COLD

- `.grade` on: `denied-letter.jpg` (both shots)
- Extra overlay — Shot 1.1: deep radial vignette
  ```css
  .vignette-heavy {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 38%, rgba(13,24,38,0.55) 100%);
    z-index: 50;
  }
  ```
  The shotlist specifies `rgba(13,24,38,0.55)` at the edges — this is exact.
- Extra overlay — Shot 1.2: background photo blurred (`filter: blur(6px)` on the photo element only — this is NOT a modification of the `.grade` filter; it is a separate inline style on the `<img>` used as the ECU background). The DECLINED text is sharp foreground, unfiltered.
- Warm colour guard: `denied-letter.jpg` should be a cold, flat, high-key scan — `.grade` will push it further cold. No warm wash needed here.
- Note: the DECLINED stamp (`--warn: #9a3a3a`) in Shot 1.2 is the only saturated colour in the entire Beat 1–2 section. It must not receive `.grade`. It is a CSS text element, not a photographic asset.

---

### Beat 2 — Reframe (~4.0–7.5s) · WARMING (overlay only, filter unchanged)

- `.grade` on: `workspace.jpg` (both shots)
- The shotlist flags: "workspace.jpg has more warmth in its native tones — the grade should not erase that." With `grayscale(0.45)` the native warmth is reduced but not eliminated, and `sepia(0.22)` nudges what remains toward brown rather than orange. The residual warmth is desirable here — it signals the mood shift.
- Shot 2.1: Slightly lighter vignette than Beat 1.
  ```css
  .vignette-light {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(13,24,38,0.28) 100%);
    z-index: 50;
  }
  ```
- Shot 2.2: Paper-tone wash layer (as noted in shotlist) to carry the brand palette into the warmer photo without neutralising it.
  ```css
  .wash-paper {
    position: absolute; inset: 0; pointer-events: none;
    background: rgba(238, 241, 245, 0.12);
    z-index: 48;
  }
  ```
  This is additive: global overlay (navy, 7%) + wash-paper (paper, 12%) + light vignette together keep the scene warmer than Beat 1 while still clearly in the same paper world.

---

### Beat 3 — Process: Step 01 (~7.5–11.5s) · CLEAN

- Shot 3.1: `.grade` on the phone/document close-up photo (if a stock photo is used). No vignette — the shotlist is explicit: "no vignette — this beat is clean and light."
- Shot 3.2: Typographic insert on paper background. No `.grade` on paper background or text. No overlay.
- Paper grid background: `--paper-line: #c8d0da` at 8% opacity on a white grid pattern. This is a CSS background, not a photographic asset — no `.grade`.

---

### Beat 4 — Process: Step 02 (~11.5–14.5s) · PROFESSIONAL

- Shot 4.1: `.grade` on `workspace.jpg` crop or `working.mp4` desk segment. No vignette. A slow drift left layer serves as the only spatial treatment.
- Shot 4.2: Typographic insert on paper background. No `.grade`. The `check-circle-2.svg` icon at `--accent: #1f3a68` fill is a brand asset, not photographic — no `.grade`.

---

### Beat 5 — Process: Step 03 (~14.5–17.5s) · PURPOSEFUL

- Shot 5.1: `.grade` on `working.mp4` video element. This is the first and only shot where text sits directly over moving video. Mandatory lower-third darkening strip:
  ```css
  .lower-third-darken {
    position: absolute;
    inset: 75% 0 0 0;
    pointer-events: none;
    background: linear-gradient(to bottom, transparent, rgba(13, 24, 38, 0.45));
    z-index: 40;
  }
  ```
  The shotlist specifies `rgba(13,24,38,0.45)` over the bottom 25% — this is exact.
- Shot 5.2: Typographic card on paper background. No `.grade`. The LODGED / WITHIN 5 DAYS card is pure brand typography.

---

### Beat 6 — Silent card (~17.5–19.5s) · DOCUMENTARY PLAIN

- No photographic elements. No `.grade` applied.
- Paper background with cadastral grid. Global overlay is present but nearly invisible on paper tone (multiply blends invisibly on near-white). No additional overlays.
- Nakedness of this beat is intentional per shotlist: "the nakedness of a plain card is the point."

---

### Beat 7 — Cost (~19.5–23.0s) · SETTLED

- No photographic elements. No `.grade` applied.
- Same paper-and-grid world as Beat 6. Fine grid at 8% opacity.
- No vignette, no overlays. Starkness is the treatment.
- Contrast check: `$0` at `--ink: #0d1826` or `--accent: #1f3a68` on `--paper: #eef1f5`:
  - `--ink` (#0d1826) on `--paper` (#eef1f5): approximately 14.2:1. Passes WCAG AAA. No issue.
  - `--accent` (#1f3a68) on `--paper` (#eef1f5): approximately 7.8:1. Passes WCAG AAA. No issue.
  - Either is acceptable. Recommend `--ink` for the `$0` numeral (authority, not brand accent) and `--accent` for the `ACC PAYS OUR FEE` subline only.

---

### Beat 8 — CTA (~23.0–27.0s) · CLEAN CLOSE

- No photographic elements. No `.grade` applied.
- Wordmark renders exactly as brand CSS — `--ink` on `CLAIM` and `MATE`, `--accent` on `/`. No filter of any kind on the wordmark.
- Fine print (`--ink-mute: #7d8a9a` on `--paper: #eef1f5`): approximately 3.2:1. Marginal for WCAG AA (requires 4.5:1). Flag to html-composer: if lint warns, upgrade to `--ink-3: #4b5a6d` (approximately 4.6:1, passes AA). The shotlist already notes this.
- Paper-tone top-edge gradient to soften entry from Beat 7 (as noted in shotlist):
  ```css
  .top-edge-soften {
    position: absolute;
    inset: 0 0 auto 0;
    height: 80px;
    pointer-events: none;
    background: linear-gradient(to bottom, rgba(238,241,245,0.45), transparent);
    z-index: 48;
  }
  ```
  This is barely visible but prevents a hard cut edge from the ink-heavy ledger card.

---

## 4. Which elements receive `.grade` vs not

| Element type                                   | Gets `.grade`? | Reason                                              |
| ---------------------------------------------- | -------------- | --------------------------------------------------- |
| `<img>` stock photos (denied-letter.jpg, workspace.jpg, phone/doc CU) | YES | Photographic — must be graded into paper world |
| `<video>` stock footage (working.mp4)          | YES            | Photographic — same filter, same class              |
| CLAIM/MATE wordmark (HTML CSS text)            | NO             | Brand asset — authored at correct values            |
| Step labels (STEP 01, STEP 02, etc.)           | NO             | Brand typography at `--ink-3`                       |
| DECLINED stamp text (Shot 1.2)                 | NO             | Brand colour `--warn` — must stay red, not graded   |
| Lucide SVG icons (check-circle-2, file-text)   | NO             | Brand assets — authored fill, no filter             |
| Paper background divs                          | NO             | CSS colour, not photographic                        |
| Cadastral grid overlay                         | NO             | CSS pattern, not photographic                       |
| Typographic insert cards (Beats 5.2, 6.1, 7.x, 8.x) | NO      | Pure typography — no photo content                  |
| `.global-overlay` div                          | NO             | This is itself an overlay — do not filter it        |
| `<audio>` elements                             | NO             | Audio has no visual rendering                       |

**Rule:** `.grade` is applied to the `<img>` or `<video>` element directly. It is never applied to a wrapper `<div>` that also contains text, because `filter` on a container creates a new stacking context and clips the text from the overlay system. Apply `.grade` to the media element only.

---

## 5. Exact CSS to paste into `<style>` block

```css
/* ─── COLOR GRADE ─────────────────────────────────────────────────── */

/* Applied to every stock photo and video element. No per-asset variation. */
.grade {
  filter: grayscale(0.45) sepia(0.22) contrast(1.08) brightness(0.88);
}

/* Global frame overlay — present in every scene, not per-scene */
.global-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(31, 58, 104, 0.07) 0%,
    rgba(238, 241, 245, 0.00) 55%
  );
  z-index: 900;
  mix-blend-mode: multiply;
}

/* ─── SCENE OVERLAYS (add per-shot as needed) ─────────────────────── */

/* Beat 1 — deep vignette for forensic cold open */
.vignette-heavy {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 38%, rgba(13,24,38,0.55) 100%);
  z-index: 50;
}

/* Beat 2 — lighter vignette for reframe warmth */
.vignette-light {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(13,24,38,0.28) 100%);
  z-index: 50;
}

/* Beat 2 shot 2.2 — paper-tone wash, preserves native warmth of workspace.jpg */
.wash-paper {
  position: absolute; inset: 0; pointer-events: none;
  background: rgba(238, 241, 245, 0.12);
  z-index: 48;
}

/* Beat 5 shot 5.1 — lower-third darkening for text over video */
.lower-third-darken {
  position: absolute; inset: 75% 0 0 0; pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgba(13,24,38,0.45));
  z-index: 40;
}

/* Beat 8 — top-edge soften to ease entry from ledger card */
.top-edge-soften {
  position: absolute; inset: 0 0 auto 0; height: 80px; pointer-events: none;
  background: linear-gradient(to bottom, rgba(238,241,245,0.45), transparent);
  z-index: 48;
}
```

---

## 6. Contrast concerns flagged

| Context                          | Colours                                   | Ratio   | Verdict                                                     |
| -------------------------------- | ----------------------------------------- | ------- | ----------------------------------------------------------- |
| Body text on paper               | `#0d1826` on `#eef1f5`                   | ~14.2:1 | AAA — no issue                                              |
| Accent text on paper             | `#1f3a68` on `#eef1f5`                   | ~7.8:1  | AAA — no issue                                              |
| Step labels / eyebrows on paper  | `#4b5a6d` on `#eef1f5`                   | ~4.6:1  | AA — acceptable for 13px caps with letter-spacing           |
| Fine print (Shot 8.2)            | `#7d8a9a` on `#eef1f5`                   | ~3.2:1  | Below AA. Use `#4b5a6d` if lint flags accessibility         |
| DECLINED stamp on blurred photo  | `#9a3a3a` over `.grade`-filtered photo   | Varies  | The blur and darkening of Shot 1.2 background keeps contrast adequate; confirm in preview |
| $0 on paper                      | `#0d1826` on `#eef1f5`                   | ~14.2:1 | AAA — the ledger figure is fully legible                    |
| Lower-third text over video      | `#eef1f5` text over `.lower-third-darken` gradient | ~6–8:1 (estimated post-gradient) | Depends on video content — verify in preview; gradient is there specifically to ensure this passes |

---

## Anti-patterns avoided

- Different filter per stock asset is prohibited. One string, every photo and video.
- `.grade` is never applied to a wrapper `<div>` containing text — always to the `<img>` or `<video>` directly (stacking context issue).
- Wordmark and brand SVG icons are never filtered.
- No amber or warm-golden overlays — brief and brand README both forbid it.
- No per-scene changes to the `.grade` filter string — overlay layers carry the scene-to-scene mood shifts, not filter changes.
