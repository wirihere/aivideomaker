# Claim Mate — brand assets

## The idea in one line

**CLAIM — MATE approves.** The amber rounded-rect box is a literal approval
stamp on the word MATE. ACC stamps your file DECLINED; Claim Mate stamps it
back. Every visual should reinforce this story.

## Colours — these three only

| Role   | Hex       | Used for                                            |
| ------ | --------- | --------------------------------------------------- |
| Navy   | `#0B1F3F` | Backgrounds (video, dark site), CLAIM wordmark      |
| Cream  | `#F5F1E8` | CLAIM on dark bg, MATE inside the stamp, body text  |
| Amber  | `#FFB84D` | The stamp box. Accent only. Use sparingly — it's the hero colour. |

No greys. No extra blues. No drop-shadows other than the implicit lift the box
already has. Adding a fourth colour or a gradient breaks the stamp metaphor.

## Type

- **Inter Black 900** — the ONLY weight used in the logo. No light, no regular.
- **Tight letter-spacing** (-0.03em on all wordmarks). The letters sit close to
  each other; the lockup reads as one visual block.
- **No serif.** The brand is plain-speaking, not corporate-legal.

## The 2° tilt

The MATE stamp is rotated 2° clockwise. This is deliberate:

- Reinforces "stamp" — real rubber stamps never land square.
- Adds human warmth — perfect angles feel bureaucratic.
- Consistent across all variants. Never 3°, never 1°, never 0°.

## Files

| File                              | Use                                                   |
| --------------------------------- | ----------------------------------------------------- |
| `claim-mate-logo.svg`             | Navy CLAIM on any bg, amber MATE stamp. Default.      |
| `claim-mate-logo-reverse.svg`     | Cream CLAIM on dark bg. Use in video, dark site mode. |
| `claim-mate-favicon.svg`          | 32×32 mark for browser tab. Amber box with "M".       |

## Sibling-brand note

Consent Mate is the same lockup framework. When that brand needs its own mark,
use:

- Same type, same 2° tilt, same cream MATE.
- Swap the amber box to **green** (#2F8F5F or similar — pick at that time).
- Same tick dot.

The family reads as "Mate" brands with different accent colours per domain.

## What NOT to do

- Don't rotate the box more than 2°.
- Don't use the amber as body text or large background — it's a stamp, not a fill.
- Don't add a tagline inside the box.
- Don't stretch the box to fit longer words — if a word is longer than MATE, it
  doesn't belong in the stamp.
- Don't separate the tick dot from the stamp. They belong together.

## Logo in the video composition

See `index.html`. The logo is reproduced in HTML/CSS (not the SVG) so GSAP can
animate individual pieces — CLAIM, the box, MATE, the tick — separately. The
CSS version and the SVG version should stay visually identical. If you redesign
one, update the other.
