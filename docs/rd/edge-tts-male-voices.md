# R&D · Edge TTS Male Voices

**Question:** Which Edge TTS male voice best suits an authoritative-but-warm NZ documentary tone for a Claim Mate ACC promo?
**Date:** 2026-04-24
**TL;DR:** Use `en-AU-WilliamNeural` at `--rate=-12%` with no pitch adjustment. It reads as calm authority to NZ ears without the flatness of Mitchell or the foreigner-ness of a US voice.

---

## Current state of play in this project

`scripts/fetch-tts-edge.mjs` wraps `edge-tts-universal`. Current voices are `en-NZ-MollyNeural` and `en-AU-NatashaNeural`, both female, both tuned to `-10%` rate. User feedback: "drab". Need authoritative male voice for Claim Mate promo.

---

## Options considered

| Voice | Locale | License | Key | Est. pitch | Est. pace | Styles via SSML | Fit |
|---|---|---|---|---|---|---|---|
| [en-AU-WilliamNeural](https://json2video.com/ai-voices/azure/voices/en-au-williamneural/) | Australian | free/Azure | no | Mid-low baritone | 157 WPM | none (std Neural) | ★★★★★ |
| [en-NZ-MitchellNeural](https://gist.github.com/BettyJJ/17cbaa1de96235a7f5773b8690a20462) | NZ | free/Azure | no | Mid, lighter | ~160 WPM | none | ★★★☆☆ |
| [en-GB-RyanNeural](https://json2video.com/ai-voices/azure/voices/en-gb-ryanneural/) | British | free/Azure | no | Mid, slightly nasal | 161 WPM | chat, cheerful, sad, whispering | ★★★☆☆ |
| [en-US-RogerNeural](https://github.com/rany2/edge-tts/discussions/340) | US | free/Azure | no | Mid-low | ~155 WPM | none | ★★☆☆☆ |
| [en-US-DavisNeural](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support) | US | free/Azure | no | Mid-low, conversational | ~155 WPM | none (std Neural) | ★★☆☆☆ |
| [en-AU-DarrenNeural](https://json2video.com/ai-voices/azure/languages/english/) | Australian | free/Azure | no | Deeper baritone | ~155 WPM | none | ★★★★☆ |

Notes on each:

**en-AU-WilliamNeural** — The strongest all-rounder. Australian English is acoustically close enough to NZ that most NZ listeners hear "local" rather than "foreign." Mid-low baritone, measured 157 WPM (already documentary-paced without rate adjustment), clean prosody on declarative sentences. Community preference: recommended alongside Roger and Brian for naturalness.

**en-NZ-MitchellNeural** — Genuine NZ accent is a plus for local authenticity, but Mitchell skews younger and lighter. Community reports it sounds less authoritative than William; "a bit thin." Worth a quick test if accent authenticity overrides gravitas.

**en-GB-RyanNeural** — Has four documented styles (chat, cheerful, sad, whispering) that work via `edge-tts-universal`. Users note "least robotic" but also "unnatural emphasis on words." British accent reads as prestigious but foreign to NZ ears; risks feeling like an insurance ad from 2009.

**en-US-RogerNeural** — Top community vote for naturalness (rany2/edge-tts discussions). Mid-low, calm. US accent is a liability for an NZ consumer rights brief — will feel disconnected.

**en-US-DavisNeural** — Supports word-level emphasis (one of only three en-US voices confirmed to). Good for emphasis tuning but US accent is the same problem as Roger.

**en-AU-DarrenNeural** — Darker/deeper than William. Not listed in our `VOICES_POPULAR` map but is a live Azure voice. Worth testing if William sounds too light after auditioning; drop-in swap.

---

## Recommendation

Use **`en-AU-WilliamNeural`** at `--rate=-12% --pitch=+0Hz`.

Why: Australian English is the closest accent to NZ in the Edge TTS catalog that also reads as calm authority. The 157 WPM base rate is already slow for documentary; dropping it 12% lands around 138 WPM which matches a measured, trustworthy pace without sounding sluggish. No pitch adjustment needed — William's natural mid-low register is the asset; shifting pitch risks the mechanical quality that makes NatashaNeural sound "drab."

If William sounds too light after auditioning, try `en-AU-DarrenNeural` at the same settings as a direct swap.

---

## Adoption path

```bash
# One-off test
node scripts/fetch-tts-edge.mjs \
  "Your ACC claim was declined. You have the right to appeal." \
  test-william.mp3 \
  --voice=en-AU-WilliamNeural \
  --rate=-12%

# Full script from file
node scripts/fetch-tts-edge.mjs \
  --file=scripts/claim-mate-narration.txt \
  claim-mate-vo.mp3 \
  --voice=en-AU-WilliamNeural \
  --rate=-12%
```

Darren fallback (same command, swap voice ID):
```bash
--voice=en-AU-DarrenNeural --rate=-12%
```

---

## What would change in the repo

- `scripts/fetch-tts-edge.mjs` — no code change needed; voice and rate are CLI flags
- `VOICES_POPULAR` map in that file — add `en-AU-DarrenNeural` to the `en-AU` array so `--list` surfaces it
- `assets/voiceover/` — new .mp3 and .vtt files generated on next run

Drop-in: yes.

---

## SSML and tuning reference

### What edge-tts-universal actually supports

The service (Microsoft Read Aloud API) only allows a single `<voice>` wrapping a single `<prosody>` tag. No `<break>`, no `<emphasis>`, no `<say-as>` for arbitrary input. Custom SSML was removed from the Python reference implementation and the Node wrapper follows the same constraint. The library exposes this as CLI flags (`--rate`, `--pitch`, `--volume`) which map to prosody attributes.

Confirmed supported (via prosody):
- `rate`: string percentage, e.g. `-12%`. Documented range: `-100%` to `+200%`. Safe working range: `-30%` to `+30%` before artifacts. Beyond -40% produces robotic cadence.
- `pitch`: Hz offset, e.g. `+0Hz`. Documented range: `-100Hz` to `+100Hz`. Safe working range: `-20Hz` to `+20Hz`. Low-pitched voices can lose audibility below -15Hz.
- `volume`: percentage offset. Rarely needed — normalise in post instead.

Styles (`style="newscast"` etc.) are an Azure Speech SDK feature, not available via the free Read Aloud endpoint that `edge-tts-universal` calls. Ryan's documented styles (chat, cheerful, etc.) require the Azure SDK with a subscription key — they do not work through this library.

### Pause control without SSML

`<break>` is not available. Alternatives in plain text:

| Technique | Approx pause | Notes |
|---|---|---|
| Comma | ~180ms | Natural breath, good for lists |
| Period + new sentence | ~350ms | Standard sentence boundary |
| Em dash `—` | ~250ms | Inconsistent across voices; test first |
| Ellipsis `...` | minimal | Edge TTS mostly ignores ellipsis — confirmed in community issues |
| Double line break (paragraph) | ~500ms | Most reliable way to get a genuine pause |
| Duplicate period `..` | not recommended | Unpredictable |

For a genuine beat (e.g. before "Your claim was declined"), use a short sentence followed by a double line break, not an ellipsis.

---

## Copy-for-TTS best practices

**Acronyms:** Edge TTS reads letter sequences correctly when spaced or dotted — `A.C.C.` or `A C C` both produce letter-by-letter pronunciation. Plain `ACC` may be read as a word by some voices; test and use `A.C.C.` if it sounds wrong. Same for `NZ` — write `New Zealand` in narration copy; TTS may pronounce `N.Z.` as "en-zee" correctly but the written form is cleaner and avoids variance.

**Numbers:** Spell out for clarity. `two minutes` not `2 minutes`. `thirty percent` not `30%`. Neural voices handle digits fine most of the time but spelled-out text is zero-risk.

**Sentence length:** 12–18 words per sentence is the sweet spot. Longer sentences cause pacing to drift slightly in Neural voices. Short punchy sentences (6–8 words) work well for emphasis beats.

**Avoid:** Words ending in `-tion` after another `-tion` word (liaison, commission, decision — rapid stacking causes unnatural liaison). Read your script aloud yourself before generating audio; if you stumble, the TTS will too.

**Phonetic gotchas for this brief:**
- "Whaanui" / "Whanau" — do not use; Edge TTS mispronounces Maori words (confirmed project constraint). Use "your family" or "your whanau" only if you're comfortable with the mispronunciation.
- "ACC" — write `A.C.C.` or spell out "Accident Compensation Corporation" on first mention.
- "advocate" — Neural voices handle this fine; it is documentary-appropriate vocabulary.

---

## Risks / unknowns

1. **DarrenNeural availability**: Listed in the Azure catalog and confirmed via the json2video voice list, but not in our `VOICES_POPULAR` map or tested in this project. Verify it works via `--list` or a quick test call before relying on it.
2. **William pitch under extreme tuning**: The `-12%` rate setting is conservatively within safe range, but if the producer wants slower (e.g. `-25%`), test for cadence flattening. Below `-30%` on William sounds noticeably artificial.
3. **NZ vs AU authenticity**: Some NZ viewers will notice the Australian accent. If focus-group feedback flags this, Mitchell is the only native NZ male option in the free Edge catalog. Accept the trade-off of lighter timbre vs. perfect accent.
4. **No style tags**: Authoritative tone must come from copy and pacing, not voice style tags. This is a hard ceiling of the free endpoint.

---

## Sources

- [edge-tts-universal npm](https://www.npmjs.com/package/edge-tts-universal)
- [msedge-tts docs](https://migushthe2nd.github.io/MsEdgeTTS/)
- [rany2/edge-tts — best voice discussion #340](https://github.com/rany2/edge-tts/discussions/340)
- [rany2/edge-tts — pause control issue #111](https://github.com/rany2/edge-tts/issues/111)
- [Azure HD voices / Dragon HD Omni reference](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices)
- [Azure language & voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- [en-GB-RyanNeural profile](https://json2video.com/ai-voices/azure/voices/en-gb-ryanneural/)
- [en-AU-WilliamNeural profile](https://json2video.com/ai-voices/azure/voices/en-au-williamneural/)
- [Azure English voices list](https://json2video.com/ai-voices/azure/languages/english/)
- [Edge TTS voice list gist](https://gist.github.com/BettyJJ/17cbaa1de96235a7f5773b8690a20462)
- [VideoSDK Edge TTS developer guide](https://www.videosdk.live/developer-hub/ai/edge-tts)
- [TTS script writing best practices (Articulate)](https://community.articulate.com/articles/tips-text-to-speech-storyline)
