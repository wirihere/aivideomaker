# Playbook — Scene Transitions for Website to Video

Reusable transition patterns between scenes. Each transition is brand-agnostic (uses tokens) and has a defined emotional fit. Choose the transition based on the energy needed at the cut, not on visual variety alone.

| Transition | Energy | Use between |
|---|---|---|
| **Soft cross-dissolve** | Calm, contemplative | Two cream scenes mid-narration; emotional beats |
| **Color wash** | Brand arrival, warm reveal | Cream → brand-color (the "moment of brand") |
| **Whip + whoosh** | Energy injection, scroll-stopping | Any cut that needs a pace change; CTA build-ups |
| **Match cut** | Story continuity, "same idea, new angle" | When an element bridges two scenes (e.g., logo grows) |

The whoosh SFX is fetched via [scripts/fetch-pixabay-sfx.mjs](../../scripts/fetch-pixabay-sfx.mjs) and trimmed to a single ~0.65s clip at `assets/sfx/whoosh-short.mp3`.

---

## Transition 01 — Soft Cross-Dissolve

**What it does:** Outgoing scene's content gently scales down + fades to ~40% opacity while incoming scene fades up. Lasts ~0.6s.

**When to use:** Calm beats. The viewer's eye stays in the same emotional place; the content underneath shifts. Use between two scenes that share a background tone (cream→cream).

### GSAP

```js
// Outgoing scene softens (this IS the transition; not a banned exit animation)
tl.to("#scene-N .scene-content",
  { scale: 0.98, opacity: 0.4, duration: 0.5, ease: "power1.inOut" }, NEXT_START);
// Incoming scene fades up
tl.from("#scene-N+1", { opacity: 0, duration: 0.6, ease: "power2.out" }, NEXT_START);
```

No SFX needed. No streak overlay needed.

---

## Transition 02 — Color Wash

**What it does:** A brand-colored sheet drops down from the top, briefly covers the canvas, then peels off at the bottom — revealing the next scene. ~0.5s total.

**When to use:** The "moment of brand arrival" — typically the cut from the hook (cream) into the first brand scene (teal/navy/whatever the brand color is). Reads as decisive and warm.

### Markup

```html
<div id="wash-1" class="clip color-wash"
     data-start="<wash-start>" data-duration="0.70" data-track-index="11"></div>
```

### CSS

```css
.color-wash {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--card-accent) 0%, var(--card-slate) 100%);
  z-index: 80;
  pointer-events: none;
  will-change: transform;
}
```

### GSAP

```js
// Wash drops down (covers canvas)
tl.fromTo("#wash-1",
  { y: "-100%" },
  { y: "0%", duration: 0.22, ease: "power2.in" }, WASH_START);
// Wash peels off (reveals next scene)
tl.to("#wash-1",
  { y: "100%", duration: 0.22, ease: "power2.out" }, WASH_START + 0.33);
```

`WASH_START` typically lands ~0.15s before the next scene's `data-start` so the cover is mid-canvas at the boundary.

---

## Transition 03 — Whip + Whoosh

**What it does:** Whole-scene horizontal slide. Outgoing scene blurs and slides off-frame to the left; a bright streak sweeps across the canvas; incoming scene blurs in from the right. A whoosh SFX plays simultaneously. ~0.32s total.

**When to use:** Energy injection. Use between scenes that need a pace change — going from a calm explanation into the action steps, or building energy into the CTA. Very TikTok / Reels native.

### Markup (per whip)

```html
<!-- Streak overlay -->
<div id="whip-streak-1" class="clip whip-streak"
     data-start="<whip-start>" data-duration="0.55" data-track-index="11"></div>
<!-- Whoosh SFX -->
<audio id="whip-sfx-1" class="clip"
       src="assets/sfx/whoosh-short.mp3"
       data-start="<whip-start>" data-duration="0.65"
       data-track-index="12" data-volume="0.55"></audio>
```

### CSS

```css
.whip-streak {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 80;
  will-change: transform, opacity;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.0) 38%,
    rgba(255, 255, 255, 0.55) 50%,
    rgba(255, 255, 255, 0.0) 62%,
    transparent 100%
  );
  filter: blur(18px);
}
```

### GSAP

```js
// Whole outgoing scene slides off-frame left with motion blur
tl.to("#scene-N",
  { x: -1280, filter: "blur(10px)", duration: 0.32, ease: "power3.in" }, WHIP - 0.02);
// Streak sweeps left → right across canvas
tl.fromTo("#whip-streak-1",
  { x: "-100%", opacity: 0 },
  { x: "100%", opacity: 1, duration: 0.32, ease: "power2.inOut" }, WHIP);
tl.to("#whip-streak-1", { opacity: 0, duration: 0.10 }, WHIP + 0.34);
// Incoming scene slides in from right with motion blur
tl.from("#scene-N+1",
  { x: 1280, filter: "blur(10px)", duration: 0.32, ease: "power3.out" }, WHIP + 0.15);
```

`WHIP` is the moment of peak streak. Typically `WHIP = NEXT_SCENE_START + 0.05` so the streak peaks just after the boundary.

### Whoosh SFX setup (one-time)

Fetch a whoosh from Pixabay's sound-effects search:

```bash
node scripts/fetch-pixabay-sfx.mjs "whoosh transition" whoosh.mp3
```

Pixabay search results often return long montage files. Trim to a single ~0.65s clip with fade in/out:

```bash
ffmpeg -i assets/sfx/whoosh.mp3 -ss 0 -t 0.65 \
  -af "afade=t=in:d=0.03,afade=t=out:d=0.18,volume=1.3" \
  -ac 2 -b:a 128k assets/sfx/whoosh-short.mp3
```

The trimmed file is the asset every whip references via `<audio src="assets/sfx/whoosh-short.mp3">`. One file, many whips.

### Volume

`data-volume="0.55"` keeps the whoosh assertive but not louder than narration. Adjust by ±0.1 if the music bed is loud or quiet.

---

## Transition 04 — Match Cut (advanced)

**What it does:** An element in scene N visually bridges to scene N+1 — e.g., the small Kindred header word morphs to the giant Scene-2 wordmark, OR a row icon scales up to become the next scene's hero element. Both scenes share the bridging element's visual identity at the cut.

**When to use:** Story continuity moments. "Same idea, new angle" cuts where you want the viewer to feel the connection rather than a hard switch.

**Status:** Not yet implemented in the Kindred render. Pattern proposal (untested):

1. Animate a "ghost" element in scene N that occupies the position of the bridging element
2. At the boundary, the ghost morphs (position + scale) to where the same element will land in scene N+1
3. Scene N+1's actual hero element appears at the morphed-to position with opacity 0
4. Cross-fade ghost → real element

Promote this to "first proven" once it lands.

---

## Picking transitions for a 5-scene comp

For a typical 25-30s vertical promo:

```
sc1 (hook)  →  sc2 (brand)  →  sc3 (features)  →  sc4 (proof)  →  sc5 (CTA)
            │                │                  │                │
        color wash       whip+whoosh         soft cross       whip+whoosh
        (brand           (energy             (calm beat)      (energy build
         arrival)         injection)                           to action)
```

This gives the viewer a rhythm: **arrival → kinetic → calm → kinetic → land**. Don't use the same transition twice in a row — vary the energy. Don't whip on every cut — exhausting; the whip earns its keep by being the loudest tool in the box.

---

## Whoosh-as-a-layer pattern

The whoosh SFX is its own audio track (`data-track-index="12"`), separate from narration (track 9) and music bed (typically track 8 or 9). This means:

- You can whoosh without ducking narration — the SFX is short enough not to fight
- You can layer multiple whooshes on the same track if they don't overlap in time
- For a busy mix, lower whoosh `data-volume` (e.g., 0.4) instead of removing the whip

If you want a whoosh on every transition, just add another `<audio>` clip referencing the same `assets/sfx/whoosh-short.mp3` file at each transition's start time. Cheap, reusable.
