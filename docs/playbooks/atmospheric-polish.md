# Playbook — Atmospheric Polish (Make It Feel Like Video)

The difference between "PowerPoint with motion" and "video" is mostly atmospheric — small, near-subliminal layers that add organic life to every frame. None of these layers carries information; they all carry feel.

Add these as a polish pass after content + transitions are locked. Don't add them while iterating on layout or copy — they hide layout issues.

---

## The polish stack (apply in this order)

1. **Music bed** — biggest single quality jump. Without music, every promo feels like a tutorial.
2. **Camera push-in** — every scene scales 1.0 → 1.03 over its duration. Almost imperceptible per frame; cumulative effect is enormous.
3. **Vignette** — subtle edge darkening, per-scene.
4. **Film grain** — global SVG noise texture, drifts slowly across the comp.
5. **Atmospheric layers per scene** — particles on dark scenes, light beam on long scenes, paper-grain drift on light scenes.

After all five, the render reads as cinema. Drop any one and it slips back toward presentation.

---

## 1. Music bed

Default volume `0.18` — sits under narration without competing. For sections without narration, can swell to `0.45`.

```html
<audio id="audio-music"
       src="assets/music/<brand>-bed.mp3"
       data-start="0" data-duration="<full>"
       data-track-index="8" data-volume="0.18"></audio>
```

For Kindred, the warm-acoustic bed is `assets/music/kindred-bed.mp3` (213s file, only first 29.5s played). See [music.md](music.md) for the user-first fetch flow.

---

## 2. Camera push-in (every scene)

Generic — auto-applies to every `.scene .scene-content` based on the scene's `data-start` and `data-duration`. Drop into the timeline script:

```js
document.querySelectorAll('[data-composition-id="<comp-id>"] .scene .scene-content')
  .forEach((content) => {
    const scene = content.closest(".scene");
    const start = parseFloat(scene.dataset.start || "0");
    const dur = parseFloat(scene.dataset.duration || "5");
    const pushDur = Math.max(0.6, dur - 0.4);  // stop 0.4s early to avoid fighting transitions
    tl.fromTo(content,
      { transformOrigin: "50% 50%", scale: 1.0 },
      { scale: 1.03, duration: pushDur, ease: "none" },
      start);
  });
```

Scope: `.scene-content` (the inner wrapper), NOT the scene element itself — leaves the scene transform free for whip transitions to use `x`. The push-in is `scale` only on a different element; no GSAP conflict.

Push amount: `1.03` is the default — enough to feel "alive" but not enough to clip content. For longer scenes (8s+) consider `1.04`.

---

## 3. Vignette (per scene)

Simple per-scene element. Drop one into every scene that wants depth:

```html
<div class="scene ...">
  ...
  <div class="vignette"></div>
  ...
</div>
```

```css
.vignette {
  position: absolute; inset: 0;
  z-index: 3;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 45%,
    transparent 50%,
    rgba(15, 22, 33, 0.18) 100%);
  mix-blend-mode: multiply;
}
```

`mix-blend-mode: multiply` lets the vignette tint *whatever* is underneath without specifying a color — works on cream, teal, navy, whatever the brand bg is. Token-free, one CSS class.

---

## 4. Global film grain

Persistent overlay above all scenes, below the brand header. SVG turbulence inlined as data URI — no external asset.

```html
<div id="film-grain" class="clip film-grain"
     data-start="0" data-duration="<full>" data-track-index="13"></div>
```

```css
.film-grain {
  position: absolute; inset: 0;
  z-index: 95;
  pointer-events: none;
  opacity: 0.08;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 200px 200px;
  will-change: background-position;
}
```

Animate slow drift so the grain feels alive:

```js
tl.fromTo("#film-grain",
  { backgroundPosition: "0px 0px" },
  { backgroundPosition: "-200px 140px", duration: <full>, ease: "none" },
  0);
```

---

## 5a. Particles (dark scenes)

Generic — fills any `[data-particles="N"]` container with N seeded-random `.particle` children, then drifts them upward with sway. Used on teal/dark/brand scenes for ambient depth. Don't use on cream or busy scenes — particles compete with content.

```html
<div class="scene scene-bg-teal ...">
  <div class="particles" data-particles="14"></div>
  ...
</div>
```

```css
.particles {
  position: absolute; inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}
.particle {
  position: absolute;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  filter: blur(2.5px);
  will-change: transform, opacity;
}
```

JS — uses mulberry32 seeded PRNG (deterministic; no `Math.random`):

```js
function _mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _seedRng = _mulberry32(7);
document.querySelectorAll('[data-particles]').forEach((container) => {
  const count = parseInt(container.dataset.particles || "14", 10);
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = (_seedRng() * 92 + 4).toFixed(2) + "%";
    p.style.top = (_seedRng() * 70 + 30).toFixed(2) + "%";
    p.style.opacity = (_seedRng() * 0.4 + 0.35).toFixed(2);
    p.style.transform = `scale(${(_seedRng() * 0.8 + 0.5).toFixed(2)})`;
    container.appendChild(p);
  }
});

// Drift each particle upward with seeded sway, fade out near scene end
let _pidx = 0;
document.querySelectorAll('.particle').forEach((p) => {
  const scene = p.closest(".scene");
  if (!scene) return;
  const start = parseFloat(scene.dataset.start || "0");
  const dur = parseFloat(scene.dataset.duration || "5");
  const r = _mulberry32(200 + _pidx++);
  const rise = -(r() * 280 + 180);
  const sway = (r() - 0.5) * 90;
  const delay = r() * (dur * 0.25);
  tl.to(p, { y: rise, x: sway, duration: dur - delay, ease: "sine.out" }, start + delay);
  tl.to(p, { opacity: 0, duration: Math.min(0.9, dur * 0.25), ease: "power1.out" },
    start + dur - Math.min(0.9, dur * 0.25));
});
```

The seeded PRNG ensures deterministic frames — same particle positions every render, no flicker between frames. Critical for the "no `Math.random()`" rule.

---

## 5b. Light beam sweep (long scenes)

A diagonal soft beam crosses the canvas once per scene. Used on the longest calm scene (typically Scene 3 features) to add motion without distracting from content.

```html
<div id="<scene>-beam" class="light-beam"></div>
```

```css
.light-beam {
  position: absolute; inset: -50px;
  z-index: 4;
  pointer-events: none;
  background: linear-gradient(100deg,
    transparent 0%, transparent 38%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 62%, transparent 100%);
  filter: blur(40px);
  transform: translateX(-110%);
  mix-blend-mode: soft-light;
}
```

```js
tl.fromTo("#<scene>-beam",
  { x: "-110%" },
  { x: "110%", duration: <scene-duration * 0.6>, ease: "power1.inOut" },
  <scene-start + 0.1>);
```

---

## 5c. Paper-grain drift (light scenes)

The existing `.paper-grain` (subtle dot pattern) on cream scenes — animate its background-position to give it slow organic motion.

```js
document.querySelectorAll('.paper-grain').forEach((grain) => {
  const scene = grain.closest(".scene");
  const start = parseFloat(scene.dataset.start || "0");
  const dur = parseFloat(scene.dataset.duration || "5");
  tl.fromTo(grain,
    { backgroundPosition: "0px 0px" },
    { backgroundPosition: "26px 26px", duration: dur, ease: "none" },
    start);
});
```

Drift distance = one tile (`26px`). Slow, perceived only subliminally.

---

## What NOT to do

- **Don't add particles to cream/light scenes** — they compete with text instead of adding depth. Reserve for dark/brand-color scenes.
- **Don't push-in faster than `1.0 → 1.04`** — anything more becomes obvious zoom and looks amateur.
- **Don't stack film-grain over film-grain** — one global layer is enough. More just blurs.
- **Don't animate the film-grain `opacity`** — keep it constant (around `0.08`) so it reads as texture, not a flicker.
- **Don't apply atmospheric layers while iterating layout** — they hide spacing/typography problems. Polish AFTER content lock.
- **Don't go above `0.22` music bed volume under narration** — it eats consonants and the voice loses authority.

---

## Render cost

Adding the full polish stack roughly **5×s the render time** on this box (1m → 5m for 30s vertical). Worth it for a finished promo; consider toggling off some layers (particles, film grain) during iteration loops where you're checking layout.

---

## What's still missing (parking lot)

- **Color grade per-scene** — slight tint shifts (cooler hook → warmer brand → neutral features → warm proof → branded CTA). Currently every scene uses the same flat palette.
- **Subtle camera shake on whip transitions** — adds visceral impact. Not yet implemented.
- **Light leak flash** during whips — coloured wash on the moment of cut.
- **Audio-reactive bass-thump** under reveals — sub-frequency woof on key entrances.
- **Match-cut** transitions that morph one element across scenes.

These are next-pass candidates, not required for "video feel".
