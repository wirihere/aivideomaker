# Claim Mate — brand assets (corrected)

## Where the brand actually lives

The canonical brand is the existing Claim Mate landing page at
`C:\Users\wirihere\claim-mate\landing-page\index.html`. This folder mirrors
its brand decisions so the video stays in sync. If the site changes, update
here.

## Sibling-brand system

Claim Mate and Consent Mate share the same visual system: **cadastral / ordnance-
survey aesthetic**. Paper, ink, grid lines, corner crop-ticks, fine strokes.
The only per-brand difference is a single accent colour and a single accent
glyph inside the logo cartouche.

| Brand        | Accent colour | Glyph inside cartouche         |
| ------------ | ------------- | ------------------------------ |
| Consent Mate | `#2f5d3a`     | green tick (approved)          |
| Claim Mate   | `#1d4e89`     | navy up-arrow (rising / fight) |

Both share identical outer frame, corner ticks, and subdivision line.

## Colour tokens (from site CSS)

| Token         | Hex       | Role                                  |
| ------------- | --------- | ------------------------------------- |
| paper         | `#eef1f5` | Background                            |
| paper-deep    | `#e2e7ed` | Secondary background / footer         |
| paper-line    | `#c8d0da` | Grid lines                            |
| ink           | `#0d1826` | Body text, primary strokes            |
| ink-2         | `#1a2a3d` | Headings                              |
| ink-3         | `#4b5a6d` | Muted body text                       |
| ink-mute      | `#7d8a9a` | Very muted text, timestamps           |
| accent        | `#1f3a68` | Primary accent (Claim Mate navy)      |
| accent-ink    | `#122649` | Hover / deeper accent                 |
| accent-wash   | `#d5deec` | Accent background washes              |
| warn          | `#9a3a3a` | DECLINED / error / red flags          |
| rule          | `rgba(13,24,38,.14)` | Thin hairlines            |
| rule-strong   | `rgba(13,24,38,.38)` | Strong hairlines          |

**No amber, no bright yellows, no purples.** Warm colours break the ordnance
aesthetic.

## Typography

- **Inter** 400-600 — body text, headlines.
- **JetBrains Mono** 700 — the `claim/mate` wordmark, eyebrow labels, form
  numbers, ledger columns, any "document machinery".
- **Instrument Serif** italic — used sparingly inside Inter headlines to
  emphasise a key phrase. Never on its own.

Letter-spacing is tight (-0.02 to -0.04em) on headlines; looser (+0.14em) on
mono eyebrows. Never use 900 weights — this is not a brand that shouts.

## The logo in HTML — canonical form (verified against live site 2026-04-24)

The live `claim-mate/landing-page/index.html` uses the **wordmark only** in the
header. **Uppercase**, JetBrains Mono, navy slash. No SVG mark next to it.

```html
<a class="logo" href="/">
  <span class="word">CLAIM<span class="slash">/</span>MATE</span>
</a>
```

```css
.logo .word {
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-size: 18px;
  color: var(--ink);          /* #0d1826 */
}
.logo .word .slash { color: var(--accent); }   /* #1f3a68 */
```

Footer is even more minimal: `<h4>CLAIM/MATE</h4>`.

### Do NOT use

The cadastral-frame SVG with the navy up-arrow (the `claim-mate-favicon.svg`)
is **a favicon only**. Browser tab icon. **Not** a header logo, not a brand
mark to place next to the wordmark, not a hero asset. Earlier guidance to
"reproduce on every page" was wrong — corrected after checking the live site.

## Files in this folder

- `claim-mate-favicon.svg` — 40×40 favicon, identical to the site's favicon.

That's it. The wordmark is HTML+CSS, not an SVG, so it scales with the page
font system. No separate wordmark file needed.

## What I got wrong in v6

Earlier I invented an amber "stamp" lockup with Inter Black 900 and a 2° tilt.
Scrapped — moved to `archive/wrong-logo-v1/`. It looked bold but it wasn't
this brand. The real brand is quieter, more precise, more New Zealand.
