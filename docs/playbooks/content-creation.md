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

## Rule 2 — Default to 2.5s holds per slide

**Minimum 2.5 seconds per slide.** Shorter and the viewer can't read the text.

Vary the rhythm so it doesn't feel mechanical:
- Short text (1-2 words): 2.0–2.5s
- Medium text (one line): 2.5–3.0s
- Long text (2+ lines, profile info): 3.0–3.5s
- CTA / ending: 3.5s+

Match the hold time to the reading time. A viewer reading at normal speed
should finish the text with about half a second to spare before the transition.

Never make the user tell you "it's too fast." Start slow, they'll say "speed
it up" if needed.

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
| **Instagram** | 15–20 | Energetic, emoji-heavy | Longer (5-8 lines) |
| **Threads** | 0–1 | Conversational, authentic | Short (1-3 lines) |
| **Local Client Finder** | 2–3 | Direct, recruitment-focused | Short |

The caption does as much work as the visual. Spend time on it. Use the
`post` command's config file to specify different captions per channel.

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
