# Claim Mate v2 — Sound Design

**Reads:** plans/claim-mate-v2/script.md, shotlist.md, assets/voiceover/claim-mate-v2.vtt
**Audio philosophy:** documentary calm; single continuous music bed at fixed quiet level; narration always foreground; no SFX; music carries the two silent holds

---

## Music bed decision

### Audit of existing tracks

| File | Duration | Bitrate | Tags / metadata |
|---|---|---|---|
| `assets/music/track.mp3` | 122.0s | 256kbps stereo | None — no ID3 title, artist, or BPM tags |
| `assets/music/track-faded.mp3` | 30.0s | 128kbps stereo | Encoder: Lavc62.28 (ffmpeg re-encode only) |

`track-faded.mp3` is a 30-second ffmpeg-derived clip of `track.mp3` with a pre-baked fade-out — same source, shorter. It is not an independent track.

`track.mp3` has no metadata. Cross-referencing with the increment log: it was sourced during the AI Video Maker promo build (2026-04-24), which used a corporate-energetic register. The brief explicitly notes "it was originally sourced for a different mood" and the music-library.md lists "corporate upbeat" as the likely candidate for that session's needs.

**Verdict: neither existing track can be confirmed to match "documentary-serious or hopeful-acoustic." Using an unidentified corporate-upbeat track under a calm documentary-grief-and-relief script would undercut the entire emotional register. A new track is required.**

This is the documented escalation path. The producer pre-authorised a single Pixabay fetch if both existing tracks are confirmed unsuitable (brief §Risk 1). That condition is met.

---

## New track brief (for music-supervisor)

**Mood:** hopeful-acoustic — begins quiet and slightly uncertain, resolves to steady warmth. Not triumphant. Not motivational. The feeling of a competent ally sitting down beside you.
**Tempo:** 60–80 BPM. Slow enough to feel deliberate, not slow enough to feel mournful.
**Instrumentation:** Solo piano or piano plus light strings. No percussion until the last third of the track if at all — a single soft kick or brush snare on a resolve note is fine, but the opening 15s must be percussion-free. No synth pads competing with mid-range. No electric guitar.
**Build curve:** Flat-to-gentle rise. Opens at ~75% of its own final level, sustains through the middle, lifts slightly at the 20s mark (coinciding with the $0 card and CTA). No dramatic drop or breakdown.
**Target duration:** 60s minimum (for headroom; we use only the first ~27s). A 90–120s track is fine — we trim.
**Tail:** The track must have a clean natural-decay tail or a fade that works at any point after 25s — the editor will apply a 2s programmatic fade-out from approximately 25s to 27s.

**Pixabay search query:** `hopeful acoustic piano`
**Alternate queries if first returns nothing usable:** `documentary piano calm`, `cinematic piano emotional slow`, `ambient piano gentle`

**Fetch command:**
```
node scripts/fetch-pixabay-music.mjs "hopeful acoustic piano" claim-mate-v2-bed.mp3
```

**File destination:** `assets/music/claim-mate-v2-bed.mp3`

**Disqualify a track if:**
- It has an energetic percussion hit in the first 8s
- It has a recognisable melody that competes with spoken word
- It is drone/ambient without tonal movement (too flat to carry the two silent holds at 17.5–19.5s and 25.6–27s)
- It is labelled "corporate" or "upbeat" anywhere in the Pixabay tags

---

## Music timing

| Event | Timecode | Treatment |
|---|---|---|
| Music bed in | 00:00.0 | Cold start at full bed level — no fade-in needed if track opens quietly; if track opens at full volume, apply a 0.5s fade-in |
| Narration begins | 00:00.108 | Music sits at fixed level — no ducking event |
| Beat 6 silent hold (Step 04 card) | 17.5–19.5s | Music bed carries 2s of silence — the track's sustained tone is what holds the viewer here |
| Narration ends ("today") | 25.672s | Music continues at bed level |
| Final hold | 25.672–27.0s | Music sustains under the wordmark hold |
| Fade-out begins | 25.0s | 2s linear fade-out: music at bed level → silence by 27.0s |
| Composition end | 27.0s | Music at 0 |

The fade-out begins slightly before "today" finishes. This is intentional — the narration's final word lands as the music is already retreating, which gives the wordmark hold its silence without requiring a hard cut.

---

## Volume

**Music bed level:** `volume="0.32"` on the `<audio>` element (32% — sits at the low end of the 30–35% target; documentary tracks with piano often feel louder than their level because of the mid-range prominence, so 32% is the safe starting point; bump to 0.35 if it disappears on laptop speakers).

**Narration (TTS):** `volume="1.0"` — 100%, always the loudest element.

**In dB terms (approximate):**
- Narration: 0 dBFS reference (loudest layer)
- Music bed: approximately -10dB relative to narration at 32% volume (0.32 × perceived level). Sits well under voice; piano and strings occupy the low-mid and mid registers, which will not mask the upper-mid frequencies of the en-NZ-MollyNeural voice.

---

## Ducking decision

**No side-chain ducking. Fixed quiet level throughout.**

Rationale: The documentary feel the brief requires depends on the music sitting like a constant presence — not something that ducks and rises in reaction to the voice. Side-chain ducking on a 27s video with dense narration would produce constant pumping that sounds produced, not calm. At 32% the voice is already dominant without ducking. The two silent holds (Beat 6 and the final wordmark) are exactly the moments where the music bed is most audible — which is what the script intends.

---

## SFX decision

**No SFX. None recommended, including the scene 1→2 transition stinger.**

The brief says "no SFX" and the script is built around the music-and-voice-only architecture. A transition stinger at Beat 2 (reframe) would compete with the most emotionally loaded silence in the video — the 1.2s hold after "no." That silence is doing heavy lifting and must not be broken.

The two structural beats that might warrant a stinger in a different kind of video (the DECLINED stamp at ~1.4s, and the wordmark arrival at ~22.3s) both have camera moves doing the punctuation work (wipe-reveal on DECLINED; pull-back on the wordmark). Audio punctuation on top of visual punctuation is redundant and undermines the documentary-calm register.

**Confirmed: no SFX.**

---

## Mix levels (final)

| Layer | Level | Notes |
|---|---|---|
| Narration (TTS) | `volume="1.0"` / 0 dBFS | Always the loudest; never masked |
| Music bed | `volume="0.32"` / approx -10dB relative | Fixed; no ducking |
| SFX | None | — |
| Final peak | -3dB peak target | HyperFrames renders to browser audio — ensure the TTS file is not clipping before composition assembly |
| Integrated loudness | -16 LUFS target | Match broadcast-adjacent norms; Edge TTS output is typically well-controlled, music bed at 32% keeps the sum within range |

---

## Audio cuts the editor should anchor to

These are the narration silence windows the editor can use as cut points. The music bed has no structural hits — it is a continuous hold — so editor cuts are driven by the VTT pauses, not music events.

| Timecode | VTT gap | Duration | Editor action |
|---|---|---|---|
| 1.438s | After "no" | ~1.3s silence | Cut SHOT 1.2 → SHOT 2.1 here — the most important cut in the video |
| 4.371s | After "end" | ~1.2s silence | Hold SHOT 2.2 into this gap; beat pivot felt, not told |
| 6.666s | After "letter" | ~1.2s silence | Hold SHOT 3.1 or cut to SHOT 3.2 phone confirmation |
| 8.625s | After "minutes" | ~1.3s silence | Step transition — cut to SHOT 4.1 |
| 11.023s | After "case" | ~1.3s silence | Hold on check-circle (SHOT 4.2); cut to SHOT 5.1 |
| 15.657s | After "days" | ~1.3s silence | LODGED card (SHOT 5.2) exits; SHOT 6.1 silent card fades in |
| 17.923s | After "nothing" | ~1.2s silence | This is the gap between the two cost lines — hold SHOT 7.1 in this breath |
| 20.964s | After "fee" | ~1.3s silence | Cut from cost card to SHOT 8.1 wordmark |
| 22.982s | After "Mate" | ~1.2s silence | Hold on wordmark before CTA text arrives |
| 25.672s | After "today" | ~1.3s to end | Wordmark hold. Music fade-out active. Hold to 27.0s. |

---

## Constraints

- Music runs from 00:00.0 to 27.0s with a 2s fade-out starting at 25.0s — no gaps
- Narration remains clearly audible at 1.0 volume; music at 0.32 does not approach masking threshold
- No SFX at any point
- No ducking — fixed level throughout
- Final ~1.3s after last VO word is a held-quiet close: music fading, wordmark static, no narration

---

## Mix mental model

This should sound like a careful person sitting across from you at a desk, explaining something important in a quiet room. The piano bed is ambient heat — you feel it before you notice it. It does not lift the viewer's spirits with a rising melody; it settles the room. The en-NZ voice of Molly is the only foreground — unhurried, factual, a fraction warmer than a government announcement but no warmer than a trusted GP. The two silences — the one after "no" and the one under the Step 04 card — are where the music does its most important work: holding space. When the wordmark arrives at 22s, the music should feel like it has always been there, not like a cue that entered. The final 1.3s after "today" is the video resolving into stillness. The fade is already underway. The last frame is a printed card in a quiet room. That is the sound.

---

## ESCALATE TO PRODUCER

The existing `assets/music/track.mp3` and `assets/music/track-faded.mp3` cannot be confirmed as documentary-calm in mood (no metadata; sourced for a prior corporate-register project). A new Pixabay track is required. This is within the pre-authorised scope in the brief (§Risk 1). Music-supervisor should run the fetch command above. No other escalation needed.
