# Bin Sparkle (binsparkle)

Two-sided bin-cleaning marketplace, Hamilton NZ. Brand site: https://binsparkle.nz
Warm, plain-spoken register; friendly-local tone, never corporate.

## Current state — 2026-07-29

**Shipped:** `renders/binsparkle/binsparkle-customer-v3.mp4` — customer
Facebook ad, 1080×1920, 22s. Animated logo intro (2.2s) → seven photo beats →
animated outro (3.2s). Voice is Wiri's supplied `voiceover/customer-vo-nova.mp3`;
music is the Acoustic Community bed from `assets/music/kindred-bed.mp3`.

**Composition:** `compositions/binsparkle-customer.html` (lints clean).

## ⚠️ Traps — these cost real time

1. **`voiceover/binsparkle-recruit-music.mp3` IS NOT MUSIC.** Despite the name
   it is a spoken voiceover. Mixing it under a new voiceover puts two people
   talking over each other — which is exactly what happened on 2026-07-29.
   Real music beds live in `assets/music/`. Test any file you assume is music:
   ```bash
   ffmpeg -i FILE -t 30 -af "silencedetect=noise=-35dB:d=0.25" -f null - 2>&1 | grep -c silence_start
   # ~0-1 = music bed · 5+ = someone talking
   ```
2. **`assets/music/kindred-bed.mp3` is near-silent for its first 2 seconds** and
   builds for a minute. Start at 0 and the music is inaudible; start at 48s and
   you land in the sung section. Start around **2s**.
3. **Edge TTS ignores inline SSML — it reads the tags aloud as words.**
   `<break>`, `<prosody>` and `<emphasis>` all fail. The beat-by-beat
   workaround for timing and question intonation is in
   [`voiceover/README-performed-read.md`](voiceover/README-performed-read.md).
4. **Edge TTS bakes ~0.8s of silence onto the end of every clip** — 9.6s across
   a 12-beat read. Trim before adding designed pauses, or the read drags no
   matter how far the gaps are pulled in. Same doc.
5. **Run `npx hyperframes lint` after every composition edit.** A composition
   missing `data-composition-id` still renders — it just stacks every scene and
   shows the last one for the whole video. The lint catches it instantly; the
   render log will not.
6. **The linter reads HTML comments too.** A quoted attribute example inside a
   comment parses as a real declaration.
7. **`index.html` at the repo root is the render entry point.** Copying a
   composition over it and restoring from a backup you made mid-session can
   restore the *wrong* file — on 2026-07-29 this left another brand's
   composition overwritten. Restore with `git checkout -- index.html`.
8. **ffmpeg on Windows mangles Git-Bash `/c/...` paths in a concat list.** Use
   bare filenames and `cd` into the working directory first. Concatenate WAV,
   not MP3 — stitched MP3s click.

## Transcribe a supplied voiceover before trusting what it says

`faster_whisper` and `openai-whisper` are both installed locally. Word-level
timings are how the pictures get cut to the words:

```python
from faster_whisper import WhisperModel
m = WhisperModel("base", device="cpu", compute_type="int8")
segs, _ = m.transcribe("file.mp3", word_timestamps=True, vad_filter=False)
```

Saved output for the current ad: `voiceover/customer-vo-nova.words.json`.

**On 2026-07-29 the supplied MP3 was described as the script we had been
writing. It was an older, different one**, and two rounds of image alignment
were wasted before anyone transcribed it.

## Project files

- [`SCRIPT-customer.md`](SCRIPT-customer.md) — the written v10 script, beat
  sheet, claim-by-claim sourcing, version history. **This is NOT what the
  shipped v3 video says** — that uses the older supplied recording.
- [`IMAGE-PROMPTS.md`](IMAGE-PROMPTS.md) — image-to-image brand anchors plus
  per-scene prompts.
- [`voiceover/README-performed-read.md`](voiceover/README-performed-read.md) —
  timing and intonation out of Edge TTS.
- `assets/01_dirty … 07_end.png` — the seven ad stills (supplied). Filenames
  match their content; checked by eye 2026-07-29.
- `compositions/binsparkle-recruit.html` — the earlier cleaner-recruitment ad.

## Open

- The shipped ad uses the older recording, which says **"Hamilton"** and
  **"book online in 60 seconds"**. Wiri asked for no town (so the ad travels)
  and the verified booking claim is about two minutes. Recording
  `SCRIPT-customer.md` in the same voice fixes both.
- **Never settled:** which voice (NZ Molly vs AU Natasha), how the web address
  should be pronounced, and how strong the question rise should be. Auditions
  were made; no decision.
- `06_photos.png` shows two bins that look identical — it is meant to prove a
  before/after and doesn't. `01_dirty` and `05_fresh` are different bins in
  different places, so the transformation never matches. The strongest version
  of this ad is one bin, same angle, filthy then gleaming.
