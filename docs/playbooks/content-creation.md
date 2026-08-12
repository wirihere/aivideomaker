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

**Total video length: aim ~27s (the 25-30s band).** Short-form platforms
(TikTok, Reels, Shorts) reward *completion* — the viewer watching to the
end — and the high-completion sweet spot is roughly 21-34s. Long enough to
land the gag, short enough that most viewers finish it. Four beats at
readable holds land here naturally (≈6-8s a beat). Under ~20s cuts the joke
short; over ~35s and completion drops, which the algorithm punishes harder
than the extra seconds help. **Don't pad with dead holds to hit the number**
— if a concept is done in 22s, ship 22s. Confirmed by the user 2026-08-07
after the first character batch shipped at 18s and read a touch short.

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

### Emoji rule — emojis approved for BinSparkle

**Emojis are approved for BinSparkle.** Reversed 2026-08-04 by the user.
The brand voice is warm and character-driven, and emojis fit the playful,
bin-as-a-character posts (the bin's "Tinder profile", "if your bin could
talk"). The earlier default — "no emojis because the site has none" — was
too strict for social and fought the tone; it's retired. Use them where
they earn the spot: one or two well-placed beats a wall of them. Brand
voice still leads; the generic platform template still doesn't.

### How to actually write a caption — use the copy expert

**Do not hand-write captions into the post config.** Run them through
[`script-and-copy.md`](script-and-copy.md) — it has the model ladder
(Claude Opus 4.8 is the daily pick, ~$0.016), the tested prompt template,
and the craft rubric. The process:

1. Fill the prompt template with brand context **verbatim** (real taglines
   scraped from binsparkle.nz, real product facts, the emojis-approved rule from Rule 7).
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

## Rule 10 — Fill the frame (no dead zones)

A vertical social frame is 1080×1920, and only the middle band (y≈220–1500)
is safe for must-read text. Large empty bands read as "unfinished." Before
calling a composition done, scan a rendered still top-to-bottom:

- **No dead band wider than ~250px** inside the safe area between elements.
  Content ending at mid-frame with an empty bottom third is a fail.
- **Fixes, in order:** (1) make the hero bigger — the subject should
  dominate the frame; (2) push text blocks into the lower safe area;
  (3) add a permanent branded footer (URL strip, reward line, rule + small
  caps) to anchor the bottom.
- **The hook frame matters most** — the first thing a viewer sees should
  fill the frame, not a small photo floating in whitespace.
- **But don't spill OVER the frame border.** The flip side of "fill": no
  element should bleed past the canvas edge or over a decorative border
  (the wanted-poster has an inset double-line frame at 46px). Rotated or
  translated elements (stamps, badges, pills) are the usual culprits —
  check their bounding box *after* the transform, not just their CSS
  position. The wanted-video (2026-08-04) had an element crossing the
  border in the rendered video; flagged by the user, deliberately NOT
  fixed yet.

This is separate from the platform safe-zone rule (Rule 7 / judge R4): safe
zones say where text must NOT go (the UI overlay); this says where content
SHOULD go (fill the canvas). The wanted-poster (2026-08-04) was the trigger
— a top-heavy layout left ~600px empty at the bottom; fixed with a bigger
mugshot hero, text pushed into the lower third, and a permanent footer.

---

## Rule 11 — Ship from a `final/` folder

Every concept's renders land in `renders/<brand>/<concept>/` automatically
(stills + video variants). The raw and `-graded` (yuv444p) MP4s are
intermediates — **only the `-graded-yuv420.mp4` plays in normal players**.
Three MP4 variants with similar names is confusing, and opening the wrong
one looks like "the video doesn't work."

So before calling a concept done, assemble a **`final/`** subfolder holding
only the deliverables, clearly named:

    renders/<brand>/<concept>/final/
      ├─ slide-1-<beat>.png, slide-2-<beat>.png, …   (the carousel stills)
      └─ <concept>-video.mp4                          (the yuv420, renamed)

The video in `final/` is the one that plays everywhere — hand that file out,
not the `-graded.mp4`. Currently this is a manual copy/rename step after
`render:still` + `to-yuv420`; a wrapper to automate it is open.

---

## Rule 12 — After every video/carousel, run the improvements sweep (non-optional)

A creation task is **not done** when the render lands. It is done when the
lessons from that creation have been written back into the docs. This is the
discipline that stops the same bug shipping twice (the 2026-08-08 comeback
video shipped with no on-screen text because nothing enforced a "did the text
actually render?" check, and nothing captured the parent-opacity bug until the
user caught it).

**Run this checklist at the end of every video or carousel creation, every
time, before reporting "done":**

1. **Verify it actually rendered.** Extract a mid-scene frame (`ffmpeg -ss <t> -i <mp4> -frames:v 1 frame.jpg`) and run `node scripts/look.mjs frame.jpg "list EVERY piece of text visible, read each exactly"`. Confirm the headlines/CTA/SVG effects are actually painting. Do **not** trust `judge:still`/`judge:video` for this — they score safe-zone criteria and will pass an empty frame. (See `LEARNINGS.md §4` — the headline parent-opacity bug.)

2. **Log the work in `LEARNINGS.md §6`** (increment log, newest at top). One entry: what shipped, what worked, what cost time, the one next-time line. Use the template at the top of §6.

3. **Promote anything that bit you into `LEARNINGS.md §4`** (pitfalls). If a bug, a quirk, or a wrong assumption cost more than 5 minutes, it goes in §4 with the symptom, cause, fix, and how to detect it — not just in the §6 entry. §4 is what the next session reads first; §6 is the chronological record.

4. **Update the brand `MANIFEST.md`.** New composition → row in the compositions table. New render → row in the renders section. New brand-copy rule or trap → the relevant section. If a service claim was corrected (e.g. "washed", not "pressure-washed"), it goes at the top with the other brand facts.

5. **Update the "How to make new content" section (`MANIFEST.md §7`) if the method moved.** Did you use a new render flag, a new SVG technique, a different voice, a no-VO pattern, a one-composition carousel technique? If the playbook steps would now be written differently, edit them in place so the next session inherits the improvement instead of rediscovering it.

6. **Root-fix tooling, don't just work around it.** If a script needed a special flag or a tool behaved oddly (e.g. Runware music rejecting its own default `steps`), fix the script if it's a one-liner rather than documenting "always pass --steps." Only fall back to a documented workaround when the root fix is out of scope. If you keep the workaround, say so explicitly in the doc.

**The test:** a brand-new session, opening this repo cold, should be able to
reproduce this creation without hitting any problem you hit. If they would hit
one, the sweep isn't finished.

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
