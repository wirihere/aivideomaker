# Playbook — Website-to-Video Cards Library

Reusable card patterns for the Website-to-Video method. Each card here is **brand-agnostic** — it draws colors and fonts from `design/tokens-<brand>.css` and works for any website's brand. Adding a new brand = swap the tokens file; cards adapt automatically.

We build one card at a time, prove it on the current render, then promote it here so the next render gets it for free.

---

## Card 01 — Persistent Brand Header

**What it does:** Shows the brand's logo + wordmark at the top of the frame from t=0 through to the end. Establishes the brand immediately and keeps it visible across every scene.

**Why it pops:** The viewer never has to wonder whose video this is. On a 6-second scroll past, the brand registers in the first frame.

**First proven on:** Kindred 2026-04-25 — [renders/aivideomaker_2026-04-25_12-16-25.mp4](../../renders/aivideomaker_2026-04-25_12-16-25.mp4).

### How to drop it into any composition

**Step 1 — Markup** (place inside the root composition `<div>`, above the scenes):

```html
<div id="brand-header" class="clip brand-header"
     data-start="0" data-duration="<full-duration>" data-track-index="10">
  <img class="brand-header__logo" src="assets/logo/<brand>-icon.png" alt="" />
  <div id="brand-header-wordmark" class="brand-header__wordmark"><Brand></div>
</div>
```

**Step 2 — Per-scene mode** — every scene declares whether its background is light or dark:

```html
<div id="scene-1" class="clip scene scene-bg-cream"
     data-start="0" data-duration="3.5" data-track-index="0"
     data-scene-mode="light">    <!-- light bg → header uses dark text -->
  ...
</div>

<div id="scene-2" class="clip scene scene-bg-teal"
     data-start="3" data-duration="5" data-track-index="1"
     data-scene-mode="dark">     <!-- dark bg → header uses light text -->
  ...
</div>
```

**Step 3 — Auto-discovery in GSAP** — replace any hardcoded color flips with this generic loop:

```js
// Soft entrance
tl.from("#brand-header", { y: -28, opacity: 0, duration: 0.7, ease: "power3.out" }, 0.1);

// Reads data-scene-mode from every scene and flips the header [data-mode] attr
// at scene start. CSS handles the actual color swap. Works for any number of
// scenes, any brand, any composition.
const _scenes = document.querySelectorAll(
  '[data-composition-id="<comp-id>"] .scene[data-scene-mode]'
);
_scenes.forEach((scene) => {
  const start = parseFloat(scene.dataset.start || "0");
  const mode = scene.dataset.sceneMode || "light";
  tl.set("#brand-header", { attr: { "data-mode": mode } }, start);
});
```

**Step 4 — CSS** (currently lives inline in `index.html`; will be promoted to `design/cards.css` once a second card uses it):

```css
.brand-header {
  position: absolute;
  top: 56px;
  left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  z-index: 50;
  pointer-events: none;
}
.brand-header__logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}
.brand-header__wordmark {
  font-family: var(--card-font-display);
  font-weight: 600;
  font-size: 56px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--card-navy);                /* default — for light scenes */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: color 0.4s ease;
}
.brand-header[data-mode="dark"] .brand-header__wordmark {
  color: var(--card-paper);               /* swap to light text on dark scenes */
}
```

### Tokens this card depends on

These must exist in `design/tokens-<brand>.css`:
- `--card-navy` — primary dark text color (for light backgrounds)
- `--card-paper` — primary light text color (for dark backgrounds)
- `--card-font-display` — the brand's display/serif font

Already defined for Kindred. For a new brand, just ensure the tokens file sets these three.

### Asset requirement

`assets/logo/<brand>-icon.png` — square logo, 1024×1024 ideal. Renders at 64px in the header (cropped to a 14px-radius square).

### Headroom in scenes

Scenes that pin content to the top with `padding-top: <small-value>` will collide with the header. The header occupies y=56–120. Scenes using `justify-content: center` are fine (content stays vertically centered). Scenes using `justify-content: flex-start` need `padding-top: 200px` or more.

### Constraints

- The wordmark text in the header must match the brand's actual wordmark spelling and casing — read the brand's website to confirm.
- The `<full-duration>` on the header `data-duration` must match the root composition duration exactly.
- Don't also place a separate `<img>` of the same logo inside any scene — duplicate-media lint warning. The header IS the logo presence; scenes that want to celebrate the brand use giant typography (the wordmark) instead of repeating the icon.

---

## Card 02 — Three-Up Feature Card (numbered + line-icon)

**What it does:** Three stacked rows showing the brand's three primary actions / features / steps. Each row has: a line-icon in a tinted circle, a numbered mono kicker (`01 · LABEL`), a serif title, a sans body.

**Why it pops:** The icon-in-tinted-circle is a depth move — the soft accent glow behind reads as a halo. Numbered kickers add structure. SVG line-icons (rather than emoji) feel intentional and themeable.

**First proven on:** Kindred Scene 3 — "How it works" (give / ask / local-help).

### Markup pattern

```html
<div class="s3-row">
  <div class="icon"><svg viewBox="0 0 24 24"><!-- Lucide path here --></svg></div>
  <div class="text-group">
    <div class="num">01 · GIVE</div>
    <div class="t">Give what you've got.</div>
    <div class="b">Surplus food, tools, kids' clothes — share with neighbours.</div>
  </div>
</div>
```

### CSS notes

```css
.s3-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 32px;
  width: 880px;
  padding: 30px 40px 30px 36px;
  background: var(--card-paper-soft);
  border: 1px solid rgba(27, 42, 61, 0.06);
  border-radius: 28px;
  box-shadow: 0 6px 22px rgba(27, 42, 61, 0.06), 0 1px 0 rgba(255, 255, 255, 0.6) inset;
}
.s3-row::before {  /* soft accent glow behind icon */
  content: ""; position: absolute; top: 50%; left: 36px;
  width: 180px; height: 180px;
  border-radius: 50%; transform: translateY(-50%);
  background: radial-gradient(circle, rgba(var(--card-accent-rgb), 0.16) 0%, transparent 65%);
  pointer-events: none; z-index: 0;
}
.s3-row > * { position: relative; z-index: 1; }
.s3-row .icon {
  width: 116px; height: 116px;
  border-radius: 50%;
  background: var(--card-paper);
  border: 1.5px solid rgba(var(--card-slate-rgb), 0.18);
  color: var(--card-slate);  /* SVG inherits via stroke="currentColor" */
}
.s3-row .icon svg {
  width: 56px; height: 56px;
  stroke-width: 2; stroke: currentColor; fill: none;
  stroke-linecap: round; stroke-linejoin: round;
}
```

### Entrance pattern (GSAP)

```js
// Each row: row slides up, icon scales/rotates in independently, num kicker fades after
tl.from("#s3-row-1", { y: 40, opacity: 0, duration: 0.6, ease: "back.out(1.4)" }, START);
tl.from("#s3-row-1 .icon", { scale: 0.4, rotate: -10, opacity: 0, duration: 0.5, ease: "back.out(2.2)" }, START + 0.13);
tl.from("#s3-row-1 .num",  { y: 12, opacity: 0, duration: 0.4 }, START + 0.25);
```

Cue each row's `START` to the narration sentence boundary in the VTT (e.g., "Give..." / "Ask..." / "Find..."). Alternate icon `rotate: -10` / `+10` / `-6` for natural variety.

### Where to get icons

Inline Lucide SVGs (paths come from [lucide.dev](https://lucide.dev)). Use `stroke="currentColor"` so the icon themes itself via the parent's CSS color. For asset-fetched alternatives: [scripts/fetch-iconify.mjs](../../scripts/fetch-iconify.mjs).

---

## Card 03 — Per-Letter Wordmark Reveal

**What it does:** The brand wordmark appears at hero size (200px+), with each letter staggered into place from below + slight rotation, against a soft breathing accent glow.

**Why it pops:** Per-letter motion turns a static logotype into kinetic typography — the wordmark feels *announced* rather than just shown. Pairs with the persistent header (Card 01) — the small Kindred at top is continuous; the giant Kindred in this scene is the *moment*.

**First proven on:** Kindred Scene 2 — brand introduce.

### Markup pattern

```html
<div class="scene scene-bg-teal" data-scene-mode="dark" ...>
  <div class="s2-glow"></div>
  <div class="scene-content">
    <div id="s2-wordmark" class="s2-wordmark" data-text="Kindred">Kindred</div>
    <div id="s2-tagline" class="s2-tagline">tagline goes here</div>
  </div>
</div>
```

The `data-text="Kindred"` attribute is the source-of-truth; a generic JS splitter reads it and rebuilds the element with one `<span>` per character.

### Generic splitter (drop into the timeline script, before timeline construction)

```js
document.querySelectorAll('[data-composition-id="<comp-id>"] [data-text]')
  .forEach((el) => {
    if (el.children.length > 0) return;  // already split
    el.innerHTML = (el.dataset.text || el.textContent)
      .split("")
      .map((c) => c === " "
        ? '<span class="s2-wordmark__sp">&nbsp;</span>'
        : `<span>${c}</span>`)
      .join("");
  });
```

Reusable for any per-letter element in any composition — just add `data-text` to the source element.

### CSS notes

```css
.s2-wordmark {
  display: flex; justify-content: center;
  font-family: var(--card-font-display);
  font-weight: 600; font-size: 200px; line-height: 1;
  letter-spacing: -0.025em;
  color: var(--card-paper);
  text-shadow: 0 6px 20px rgba(0, 0, 0, 0.30);
}
.s2-wordmark > span { display: inline-block; will-change: transform, opacity; }
.s2-wordmark__sp { width: 0.32em; }  /* spacing for multi-word wordmarks */

.s2-glow {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 52%, rgba(255, 255, 255, 0.10) 0%, transparent 55%);
  pointer-events: none; z-index: 0;
}
.s2-glow ~ * { position: relative; z-index: 1; }
```

### Entrance pattern (GSAP)

```js
tl.from(".s2-glow", { opacity: 0, scale: 0.92, duration: 1.0, ease: "power2.out" }, SCENE_START + 0.1);
tl.from("#s2-wordmark > span", {
  y: 90, opacity: 0, rotate: -4,
  duration: 0.7, ease: "back.out(1.7)",
  stagger: 0.055
}, SCENE_START + 0.45);
tl.from("#s2-tagline", { y: 30, opacity: 0, duration: 0.6 }, SCENE_START + 1.5);
// Soft glow breathing for ambient life
tl.to(".s2-glow", { opacity: 0.55, scale: 1.06, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: 1 }, SCENE_START + 1.7);
```

---

## Card 04 — Kinetic Proof + Phone Frame + Notification Ping

**What it does:** Each line of a multi-line headline ("No money. / No ads. / No algorithm. / Just local.") reveals separately, cued to its own narration sentence in the VTT. A phone frame anchors the visual centre. A notification ping (e.g. "+1") pops onto the phone at a key emotional beat.

**Why it pops:** Kinetic stacking turns a static headline into a rhythmic delivery — each "No X" lands with the voice. The notification ping is the human-alternative moment ("not algorithm — actual people").

**First proven on:** Kindred Scene 4 — proof.

### Markup pattern

```html
<div class="s4-headline">
  <span class="s4-h-line">No money.</span>
  <span class="s4-h-line">No ads.</span>
  <span class="s4-h-line">No algorithm.</span>
  <span class="s4-h-line s4-h-line--em">Just local.</span>
</div>
<div class="s4-phone-wrap">
  <img class="s4-phone-screen" src="<brand>-app-screenshot.png" alt="" />
  <div class="s4-ping">+1</div>
</div>
```

### CSS notes

```css
.s4-headline {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  text-align: center;
}
.s4-h-line {
  display: block;
  font-family: var(--card-font-display);
  font-weight: 500; font-size: 86px; line-height: 1.04;
  letter-spacing: -0.025em;
  color: var(--card-navy);
}
.s4-h-line--em { color: var(--card-slate); font-style: italic; font-weight: 600; }

.s4-phone-wrap {
  position: relative;  /* required — ping is absolute child */
  width: 440px; height: 952px;
  border-radius: 60px;
  background: #0F1621;  /* phone-bezel color, kept neutral across brands */
  padding: 16px;
  box-shadow: 0 40px 100px rgba(15, 22, 33, 0.30), inset 0 0 0 2px #222a36;
}
.s4-ping {
  position: absolute;
  top: 70px; right: -28px;
  min-width: 78px; height: 78px; padding: 0 18px;
  border-radius: 50%;
  background: var(--card-warn);  /* coral / accent / brand "alert" color */
  color: var(--card-paper);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--card-font-ui);
  font-weight: 800; font-size: 28px;
  box-shadow: 0 12px 28px rgba(var(--card-warn-rgb), 0.45);
  z-index: 5;
}
```

### Entrance pattern (GSAP) — VTT-anchored

```js
// Phone enters first to anchor the visual centre
tl.from("#s4-phone", { y: 80, scale: 0.92, opacity: 0, duration: 0.85, ease: "back.out(1.3)" }, SCENE_START + 0.4);

// Each headline line cued to the corresponding word-time from the VTT
tl.from(".s4-h-line:nth-child(1)", { y: 36, opacity: 0, duration: 0.55, ease: "expo.out" }, T_LINE_1);
tl.from(".s4-h-line:nth-child(2)", { y: 36, opacity: 0, duration: 0.55, ease: "expo.out" }, T_LINE_2);
tl.from(".s4-h-line:nth-child(3)", { y: 36, opacity: 0, duration: 0.55, ease: "expo.out" }, T_LINE_3);
tl.from(".s4-h-line:nth-child(4)", { y: 40, scale: 0.96, opacity: 0, duration: 0.7, ease: "back.out(1.4)" }, T_LINE_4);

// Ping arrives during a pause between lines (or after the punchline)
tl.from("#s4-ping", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2.2)" }, T_PING);
tl.to("#s4-ping", { scale: 1.14, duration: 0.34, ease: "sine.inOut", yoyo: true, repeat: 1 }, T_PING + 0.65);
```

### When to use a phone frame vs not

If the brand is a mobile app with a screenshot worth showing, use the phone frame. If it's a SaaS / web product, swap for a browser-frame card or device mockup. Either way, the kinetic-headline + accent-ping pattern transfers.

---

## Card 05 — CTA with Glow-Pulse Pill + URL Underline Draw-In

**What it does:** Final scene — kicker, hero wordmark, URL with a draw-in underline, fine print, and an action pill that glow-pulses (animated box-shadow + scale).

**Why it pops:** The URL underline draws attention to the actionable destination. The pill's glow-pulse simulates a button "ready" state — the viewer's eye locks onto the action.

**First proven on:** Kindred Scene 5 — CTA.

### Markup pattern

```html
<div class="scene scene-bg-teal" data-scene-mode="dark" ...>
  <div class="scene-content">
    <div class="s5-kicker">FREE · NO ADS · NO ALGORITHM</div>
    <div class="s5-mark">Kindred</div>
    <div class="s5-url">kindred-nz.org<span class="s5-url__underline"></span></div>
    <div class="s5-fine">Free for every street<br />in New Zealand.</div>
    <div class="s5-pill">Try it free</div>
  </div>
</div>
```

### CSS notes

```css
.s5-url {
  position: relative;  /* required — underline is absolute child */
  display: inline-block;
  font-family: var(--card-font-mono);
  font-size: 44px; letter-spacing: 0.06em;
  color: var(--card-paper);
  padding-bottom: 10px;
}
.s5-url__underline {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 3px;
  background: var(--card-paper);
  opacity: 0.7;
  transform: scaleX(0); transform-origin: left center;
}

.s5-pill {
  display: inline-flex; align-items: center;
  padding: 16px 34px; border-radius: 40px;
  background: rgba(255, 255, 255, 0.18);
  border: 1.5px solid rgba(255, 255, 255, 0.42);
  font-family: var(--card-font-mono);
  font-weight: 600; font-size: 26px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--card-paper);
  backdrop-filter: blur(6px);
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
}
```

### Entrance + pulse pattern (GSAP)

```js
tl.from("#s5-url", { y: 26, opacity: 0, duration: 0.55 }, START + 0.85);
// URL underline draws in left-to-right
tl.to(".s5-url__underline", { scaleX: 1, duration: 0.65, ease: "expo.out" }, START + 1.2);

tl.from("#s5-pill", { y: 24, opacity: 0, duration: 0.55, ease: "back.out(1.6)" }, START + 1.7);
// Pill glow pulse — animated box-shadow ring + slight scale bump
tl.to("#s5-pill", {
  scale: 1.06,
  boxShadow: "0 0 0 14px rgba(255, 255, 255, 0.14)",
  duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 1
}, START + 2.6);
```

The `repeat: 1` (one yoyo cycle) keeps the pulse subtle — it draws attention without being distracting. Don't `repeat: -1` (banned).

---

## Building a new card

When the user asks to "make X pop":
1. Identify which card pattern serves the moment (or whether a new pattern is needed).
2. Author it with brand-agnostic tokens and styling — never hardcode colors or fonts; always go through `design/cards.css` + `design/tokens-<brand>.css`.
3. Apply it to the current composition as the first instantiation.
4. Lint and render. Frame-verify on a representative scene.
5. Document here with: what it does, why it pops, how to drop in, tokens it depends on, constraints.
6. The next Website-to-Video render gets the card for free.
