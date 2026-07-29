# Getting timing and intonation out of Edge TTS

**Found 2026-07-29 while building the Bin Sparkle customer ad.**

## The finding: inline SSML does not work

`scripts/fetch-tts-edge.mjs` escapes its input, so SSML tags are **spoken out
loud as words**. Probed directly:

```
input:  <prosody pitch="+20Hz">Test one two.</prosody><break time="500ms"/>Three.
spoken: "prosody pitch = + 20Hz Test one two prosody break time = 500ms / Three"
```

So `<break>`, `<prosody>` and `<emphasis>` are all unavailable through this
wrapper. The `--rate` and `--pitch` flags apply to the **whole file**, which
is why a straight read sounds flat — every line gets identical treatment.

## The workaround: perform it beat by beat

Generate **one file per phrase**, each with its own `--rate` and `--pitch`,
then concatenate with real silence between them. That buys three things a
single-file read cannot have:

1. **Question intonation** — put the question on its own file at a higher
   pitch (`+18Hz` worked). A neural voice lifts a "?" a little on its own;
   raising the whole phrase makes it unmistakable.
2. **Timing** — real silences between beats, sized per beat. A long gap after
   a question is what makes the answer land.
3. **Dynamics** — speed up through the explanation, slow down for the brand
   and the URL. That contrast is most of what "sounds descriptive" means.

Build script pattern (kept in the scratchpad, reproduced here because it is
the useful part):

```bash
# phrase | rate | pitch | silence-after
"When did you last clean your wheelie bin?|+5%|+18Hz|0.50"   # question: pitch up, long gap
"Yeah.|-15%|-12Hz|0.35"                                      # the answer: slow, pitch DOWN
"Nobody does, eh.|+0%|+2Hz|0.40"
...
"Binsparkle dot en zed.|-8%|+2Hz|0.0"                        # slow the URL so it's heard
```

Then per phrase: generate → decode to wav → append a silence wav → `ffmpeg
-f concat`.

**Two Windows traps that cost time:**

- ffmpeg mangles Git-Bash `/c/...` paths in a concat list — it prepends `C:`
  and fails. Use **bare filenames** in `list.txt` and `cd` into the work
  directory before running the concat.
- Concatenate **wav, not mp3**. Stitching mp3s directly gives gaps and clicks.

## What it costs

Pauses add real time. The first performed build came out **longer** than the
flat read (43s vs 41s) because ~4.6s of silence went in. Push the per-beat
rates up to pay for the silence — the relative dynamics between beats survive
a global boost, so add the boost to every beat rather than re-tuning each one.

Measured on the Bin Sparkle customer script, `en-NZ-MollyNeural`:

| Version | Length |
|---|---|
| Flat read, default rate | 41s |
| Flat read, `+12%` | 35s |
| Performed, `+18%` boost, gaps ×0.85 | **37s** |
| Performed, `+30%` boost, gaps ×0.80, 6 words trimmed | **33s** |

**Always measure.** The word-count estimate for this script said 30 seconds.
Nothing came in under 33.
