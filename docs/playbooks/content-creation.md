# Content creation playbook

> **The rules below are not suggestions.** They were learned the hard way —
> each one cost real time or a re-render. Follow them every time. If you
> find yourself about to break one, stop and re-read it.

---

## Rule 1 — Read the playbook before building

Before creating ANY content (video, carousel, story, post):
1. Check the **tool map** in `CLAUDE.md` — use the tools that exist
2. Read the **relevant playbook** (`transitions.md`, `composition-assembly.md`, etc.)
3. Check the **asset catalogue** for existing images you can reuse

Never reinvent with external tools (ffmpeg, manual editing, hand-rolled API
calls) when a command or playbook already does it. If you're about to write
code that feels like it should already exist, STOP and look harder.

---

## Rule 2 — Set hold time from the word count, then add a second

**Hold time is not a flat guess — derive it from how much text is on the slide.**
A viewer needs to *finish reading* before the cut, with a beat to spare. The
formula:

> **hold ≈ (word count ÷ 3) + 1 second, minimum 4s.**

Reading rate is ~3 words/sec for social video. That's slower than it sounds —
people skimming a feed read at this pace, not print pace. The +1s is the buffer
so the slide doesn't feel cut off.

**Calibration (learned the hard way, across three rounds of viewing):**
- ÷5 + 1s → "still very fast reading"
- ÷4 + 1s → still slightly fast
- **÷3 + 1s → landed.** This is the rate.

If the user ever says a slide is too fast, the reading rate (the divisor) is the
thing to drop, not just the buffer.

Worked examples from real slides:

| Slide text | Words | Reading (÷3) | + buffer | Hold |
|---|---:|---:|---:|---:|
| A hook line ("you're a bin.") | 3 | 1s | +1 | **4s** (min) |
| A chat message (one line) | 12 | 4s | +1 | **5s** |
| A review title + body (~24 words) | 24 | 8s | +1 | **9s** |
| A long review body (~30 words) | 30 | 10s | +1 | **11s** |
| CTA / final slide | — | — | — | **5s+** (let it sit) |

**Count the words, do the sum, set the hold.** Don't default every slide to the
same number — a 30-word review held for 5s is too fast, and a 4-word hook held
for 8s is too slow. Vary it with the content.

This applies to **video** slide holds. Carousels are swipe-paced (the viewer
controls the hold), so it doesn't apply to `render:still` slides — but the
reading-time logic still tells you whether a slide has too much text to scan
at a glance.

**Write short for video.** Because hold time scales with word count, long copy
makes a slow video — a 30-word slide held correctly is ~11s, and seven of those
is a 75-second reel nobody finishes. Aim for **≤12 words per slide** on video
(holds stay under ~5s). If a concept needs long copy to land (reviews, invoices,
chat), it's often better as a **carousel** (swipe-paced) than a video. The
verbal concepts (texts, reviews, invoice) all ran long as video — lean visual
and low-word-count for video, save the wordy ones for carousels.

Never make the user tell you "it's too fast." Start at the formula's number;
they'll say "speed it up" or "hold it longer" if the rate is off.

---

## Rule 3 — Check every lint warning before rendering

Run `npx hyperframes lint` after every composition edit. Fix or consciously
dismiss EVERY warning before rendering. Known traps that waste full re-renders:

- **`media_missing_id`** — `<audio>` without an `id` attribute is SILENT in
  the render. The linter warns; if you ignore it, the video has no sound.
  Always add `id="something"` to every audio element.
- **`overlapping_clips_same_track`** — clips on the same track that overlap
  cause rendering conflicts. Put overlapping clips on different
  `data-track-index` values.
- **`root_composition_missing_data_start`** — the root element needs
  `data-start="0"` and `data-duration="<total seconds>"`.

---

## Rule 4 — Document traps the moment you hit them

When you discover a networking issue, a wrong API path, a quoting trap, or
anything that cost you more than 5 minutes to figure out:

1. Write it into the relevant playbook IMMEDIATELY (same session)
2. Include the symptom, the cause, and the fix
3. Commit the playbook update with the fix

Do NOT rely on memory. By the next session you will have forgotten, and you
will waste the same 30 minutes rediscovering it.

---

## Rule 5 — Characters need mouths + environment from the start

When generating character images:

1. **Always include a mouth.** Eyes alone don't convey enough emotion. The
   mouth (smile, frown, gasp, grimace) is what makes the expression readable
   in a 2-second glance.
2. **The environment reflects the emotion.** Happy bin = sunny, butterflies,
   flowers. Sad bin = rain, grey, dead leaves. The background IS the emotion,
   not just a backdrop.
3. **Lean into expressiveness immediately.** Don't start subtle and "add
   personality later." The first round should be fully expressive.

Prompt skeleton (see `image-generation.md` for the full version):
```
[bin description] + [ANGLE] + [FACE: eyes + mouth] + [EMOTION] +
[ENVIRONMENT that matches the emotion] + [LIGHTING]
```

---

## Rule 6 — Generate cut-out sources on white backgrounds

When generating images you plan to cut out (character art, objects):

1. **Use a pure white studio background** in the prompt. rembg works
   dramatically better on uniform backgrounds.
2. **Use square (1024×1024) resolution.** It's cheaper ($0.009 vs $0.016
   for social-size) and the aspect ratio doesn't matter for cut-outs.
3. **Use the same seed across a character set** so proportions and colours
   stay consistent.
4. **Run `npm run describe:assets` after generating** so the catalogue
   stays current.

---

## Rule 7 — Write different captions per platform

| Platform | Hashtags | Tone | Length |
|---|---|---|---|
| **Facebook** | 3–5 | Social, warm | Medium (3-5 lines) |
| **Instagram** | 15–20 | Energetic, plain-spoken | Longer (5-8 lines) |
| **Threads** | 0–1 | Conversational, authentic | Short (1-3 lines) |
| **Local Client Finder** | 2–3 | Direct, recruitment-focused | Short |

The caption does as much work as the visual. Spend time on it. Use the
`post` command's config file to specify different captions per channel.

### Emoji rule — defer to the brand voice, not the platform template

**BinSparkle's site has no emojis.** That was verified during the
`script-and-copy.md` copy probe, and the default for this brand is **no
emojis** (or at most one, only where a playful character-driven post
genuinely warrants it). The "emoji-heavy" Instagram default that lived in
this table earlier is a generic platform template — it does **not** apply
here. Brand voice wins over platform convention every time. If you're
tempted to scatter emojis through a caption, re-read
`script-and-copy.md` → "Image-post specific notes" first.

### How to actually write a caption — use the copy expert

**Do not hand-write captions into the post config.** Run them through
[`script-and-copy.md`](script-and-copy.md) — it has the model ladder
(Claude Opus 4.8 is the daily pick, ~$0.016), the tested prompt template,
and the craft rubric. The process:

1. Fill the prompt template with brand context **verbatim** (real taglines
   scraped from binsparkle.nz, real product facts, the no-emoji constraint).
2. Generate via `textInference` at the chosen tier.
3. Score against the 8-question rubric; revise surgically on any "no".
4. For hero posts, run the generate-critique-with-different-model loop.

The reference bar is `videos/binsparkle/SCRIPT-fullcare.md`. A caption that
doesn't clear that bar isn't finished.

---

## Rule 8 — Always run `to-yuv420` after rendering

The render pipeline outputs `yuv444p` (only VLC plays it). Run:
```bash
npm run to-yuv420 -- <graded-mp4-path>
```
The `-yuv420` variant plays everywhere (phones, browsers, social platforms).
This is not optional — the raw graded output will fail on most players.

---

## Rule 9 — Use the post command, not manual scripting

```bash
npm run post -- --config=<config.json>
```

The config specifies files, channels, captions, and schedule. The command
handles SCP, upload, and post creation in one step. Do not hand-write
bash scripts for posting — the `post` command already solves the quoting,
networking, and API issues.

Config format:
```json
{
  "schedule": "2026-08-04T06:00:00.000Z",
  "files": ["renders/binsparkle/video.mp4"],
  "channels": ["fb", "ig", "threads"],
  "fb_caption": "...",
  "ig_caption": "...",
  "threads_caption": "..."
}
```

---

## Known gaps (fix when encountered)

- **Catalogue refresh is slow** — 53+ images × 12s each = 10+ minutes. Needs
  parallel calls or skip-unchanged logic. Not fixed yet.
- **Limited SFX library** — only whoosh + ding. A "pop" (speech bubbles),
  "swoosh" (swipes), "chime" (matches), "thud" (impacts) would add polish.
  Fetchable via `node scripts/fetch-pixabay-sfx.mjs`.
- **No Instagram Reel-specific settings** — the post command uses
  `post_type: "post"` for IG video. For dedicated Reels with audio, the
  Instagram settings need `is_trial_reel` or audio fields (see Postiz API docs).
