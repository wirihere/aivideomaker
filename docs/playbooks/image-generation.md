# Image generation playbook

> **The one-command summary:**
> ```bash
> npm run gen:image -- --prompt="..." --out=videos/<brand>/assets/<name>.png
> ```
> Then refresh the catalogue:
> ```bash
> npm run describe:assets -- --dir=videos/<brand>/assets
> ```
> Commit both the image and the updated catalogue.

---

## The model

**FLUX.2 [dev]** (`runware:400@1`) — **~$0.016/image** at social size
(1088×1920), **$0.009/image** at square (1024×1024). Verified 2026-08-03.
Pricing scales with resolution (serverless = GPU-seconds).

This is the default for ALL image generation — carousels, stories, character
bases, thumbnails, hero stills.

Escalate to **FLUX.2 [pro]** (`bfl:5@1`, $0.030/image at square, scales with
resolution) only for hero work where the extra detail is visible. For social
content, dev is indistinguishable.

Full model details, pricing, and the verified dates: `docs/runware-models.md`
§ Image-gen.

---

## The command

```bash
npm run gen:image -- --prompt="<text>" --out=<path> [options]
```

| Option | Default | What it does |
|---|---|---|
| `--prompt=<text>` | (required) | The positive prompt. Or use `--prompt-file=<path>` for long prompts. |
| `--out=<path>` | (required) | Output PNG path. |
| `--model=<id>` | `runware:400@1` | Override the model (e.g. `bfl:5@1` for pro). |
| `--width=<n>` | 1080 | Image width. **FLUX requires multiples of 16** (128–2048); the script snaps silently. 1080→1088, 1920→1920. |
| `--height=<n>` | 1920 | Image height. Default is 9:16 vertical (social). Use `1024 1024` for square. |
| `--negative=<text>` | — | Things to avoid (e.g. "text, watermark, logo, distorted"). |
| `--seed=<n>` | (random) | Fixed seed — use the same seed across a set to keep the character consistent. |
| `--number=<n>` | 1 | Generate N variants from one call (linear cost). Output files get `-1`, `-2`, etc. |

The script prints the exact cost and today's total spend after each call.

---

## The full workflow (generate → describe → use)

This is the process for ANY new base image. Don't skip steps.

1. **Generate** the image:
   ```bash
   npm run gen:image -- --prompt="..." --out=videos/binsparkle/assets/<name>.png
   ```
2. **Check it** — open the PNG and confirm it's right. Regenerate with a
   tweaked prompt if not. Each attempt costs ~$0.009.
3. **Drop it** into `videos/<brand>/assets/` (it's already there if you used
   `--out` correctly). Use a descriptive filename.
4. **Refresh the catalogue:**
   ```bash
   npm run describe:assets -- --dir=videos/<brand>/assets
   ```
   This re-describes ALL images (old + new) and rewrites
   `asset-catalogue.{json,md}`. The new image is now discoverable by any
   session and any content prompt.
5. **Commit** the image + the updated catalogue together:
   ```bash
   git add videos/<brand>/assets/<name>.png videos/<brand>/assets/asset-catalogue.*
   git commit -m "Add <name> base image + refresh catalogue"
   ```

If a base image lands in `assets/` and the catalogue isn't refreshed, the
next session won't know it exists. **This is not optional.**

---

## Generating a character set (consistency across multiple images)

For a character like "Happy Bin / Sad Bin" — the same bin, different emotions —
the challenge is keeping the bin recognisable across 7 images. Two levers:

### 1. Same seed
Pass `--seed=<n>` on every call. The seed controls the starting noise pattern,
so the bin's shape, colour, and proportions stay closer between generations.
Pick a seed from your first good image (the script prints it) and reuse it.

```bash
# Image 1 — happy bin (note the seed it returns)
npm run gen:image -- --prompt="..." --out=...happy.png --seed=2007507547
# Image 2 — sad bin (same seed)
npm run gen:image -- --prompt="..." --out=...sad.png --seed=2007507547
```

### 2. Detailed, consistent prompt skeleton
Keep the bin's description IDENTICAL across all prompts — only change the
emotion, lighting, and grime level. Example skeleton:

```
A photorealistic New Zealand wheelie bin, dark forest-green body (#1f6840)
with a coloured lid, standing on a suburban curb. The bin has simple,
expressive eyes that are part of its surface (not a sticker). [EMOTION
DESCRIPTION]. [LIGHTING]. Vertical 9:16, 1080×1920. No text, no logos,
no watermarks, no council branding.
```

Then per image, only swap the bracketed parts:
- Happy: "eyes curved up in a cheerful arc, lid open and upright, gleaming
  clean, water beading on the surface. Bright warm morning light."
- Sad: "eyes drooping, lid sagging half-closed, surface grimy and stained.
  Grey, overcast, muted light."
- Rock bottom: "eyes squeezed shut in distress, lid hanging open, thick
  grime and residue visible inside. Dark, harsh light."
- Triumphant: "eyes bright and wide, lid open tall, spotless and gleaming.
  Golden-hour sunlight."

### Image-to-image (not yet wired)
The ideal for character consistency is feeding image 1 back as a reference
for images 2–7 (the same pattern the video ad anchors use in
`IMAGE-PROMPTS.md`). The Runware `imageInference` task type supports this
but the client (`scripts/lib/runware-image.mjs`) doesn't pass the reference
image param yet. **Pending:** probe the exact API field name and add
`--ref=<path>` support to the CLI. Until then, same-seed + detailed prompt
is the fallback.

---

## Prompt rules for BinSparkle (from IMAGE-PROMPTS.md)

These rules were written for the video ad image set but apply to ALL
BinSparkle images. Follow them or every future asset inherits a wrong detail.

1. **No baked text.** The composition / slide / story overlays text via HTML.
   An image with its own words collides with the overlay and looks broken.
2. **9:16 vertical, 1080×1920.** Ask for it explicitly every time — the
   default is square.
3. **Leave the top third and bottom quarter quiet.** Headline sits high, CTA
   sits low. Busy detail there gets covered by text overlays.
4. **Bin colours:** dark forest-green body, coloured lid. Match Hamilton City
   Council kerbside colours.
5. **No logos, no watermarks, no council branding.** BinSparkle's mark is
   added by the composition.

---

## Cost guard

Every image-gen call passes through the shared `RUNWARE_DAILY_CAP` (default
$2/day). The cap covers ALL Runware spend — image-gen, vision judging, TTS,
music. Check today's spend:

```bash
npm run runware:usage
```

A 7-image character set at social size (1088×1920) on FLUX.2 dev costs ~$0.11.
Even with several regeneration rounds, you won't approach the cap for a single
brand's content.

---

## Where things live

| What | Where |
|---|---|
| Image-gen client (the `imageInference()` function) | `scripts/lib/runware-image.mjs` |
| CLI script | `scripts/gen-image.mjs` |
| Model catalogue (pricing, verified dates) | `docs/runware-models.md` § Image-gen |
| Model chooser (the `pickModel("image-gen")` code) | `scripts/lib/runware-models.mjs` |
| Brand-specific image prompts (the video ad set) | `videos/binsparkle/IMAGE-PROMPTS.md` |
| Asset catalogue (vision-described, per brand) | `videos/<brand>/assets/asset-catalogue.{json,md}` |
| Cost tracker | `.runware-usage.json` (gitignored) |

---

## Quick reference — common tasks

```bash
# One social image (9:16)
npm run gen:image -- --prompt="..." --out=videos/binsparkle/assets/new-image.png

# A square thumbnail (1:1)
npm run gen:image -- --prompt="..." --out=videos/binsparkle/assets/thumb.png --width=1024 --height=1024

# A character set (same seed for consistency)
SEED=2007507547
npm run gen:image -- --prompt="...happy..." --out=...happy.png --seed=$SEED
npm run gen:image -- --prompt="...sad..." --out=...sad.png --seed=$SEED

# Refresh the catalogue after adding images
npm run describe:assets -- --dir=videos/binsparkle/assets

# Check today's spend
npm run runware:usage
```
