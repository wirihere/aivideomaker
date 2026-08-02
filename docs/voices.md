# Voices — TTS model + voice selection

> **The question this playbook answers:** "How do I pick a voice that fits
> the brand without guessing?" Most Runware TTS voices have NO descriptions
> (Inworld, xAI — name only). The fix has three parts: use the models that
> DO have descriptions (MiniMax, Gemini), know which accents are available,
> and audition the shortlist by ear.

## The single most important rule

**For NZ brands, use Edge TTS.** Runware has zero `en-NZ` voices. The
project's existing path (`scripts/fetch-tts-edge.mjs`) is the only one with
actual New Zealand voices:

- `en-NZ-MollyNeural` (Female) — BinSparkle's current voice, locked per
  `videos/binsparkle/SCRIPT-customer.md`
- `en-NZ-MitchellNeural` (Male) — second NZ option, audition anytime via
  `node scripts/preview-voices.mjs --filter="^en-NZ"`

Edge TTS is unmetered (no per-call cost). For NZ work it's both the
cheapest AND the most authentic option. Don't overcomplicate.

**Runware TTS makes sense when:** you need voice cloning, multi-speaker
dialogue, expressive emotion control, or a voice outside the Edge library.
For typical short ads on NZ brands, it's the wrong tool.

## The five Runware TTS models compared

| Model | Voices | Descriptions? | Languages | Use when |
|---|---:|---|---|---|
| `minimax:speech@2.8` | 332 | **YES — descriptive names** (`English_FriendlyPerson`, `English_Aussie_Bloke`, `English_CalmWoman`) | 41 (languageBoost) | You want to pick by vibe from a written catalogue |
| `google:gemini@3.1-flash-tts` | 30 | **YES — gender + style tags** (`Sulafat Female/Warm`, `Achird Male/Friendly`) | 87 locales incl. **en-AU, en-GB** (no en-NZ) | You need en-AU/en-GB accent + warm delivery |
| `xai:tts@0` | 27 | No — name only | 20 | Cheapest ($0.015/1k). Inline speech tags. |
| `inworld:tts@1.5-max` | 73 | No — name only | English-only | Mid-tier fidelity. **Caution:** names hint but mislead — `Luna` is sultry/whispery, not "warm". |
| `inworld:tts@1.5-mini` | 73 | No — name only | English-only | Cheaper Inworld variant |
| `alibaba:qwen@3-tts-1.7b-voicedesign` | 1 | N/A — describe in natural language | 11 | You want a bespoke voice described from scratch |
| `alibaba:qwen@3-tts-1.7b-base` | 1 (clone) | N/A — clone from 3s sample | 11 | Clone an existing voice (e.g. Molly) for Runware-side use |
| `fishaudio:s2.1@pro` | 8 + clone | Partial — named presets (`Selene`, `Adrian`) + clone | Any | Multi-speaker dialogue, most configurable |

**Verified live 2026-08-02.** Inworld's 73 voices and xAI's 27 are
audition-by-ear only — there is no published mapping of voice id → tone.

## The NZ-adjacent ladder (when Edge TTS isn't an option)

If a job forces you off Edge TTS (e.g. the brand wants voice cloning, or
you're routing through Runware for cost reasons), here's the realistic
accent ladder — closest to furthest from NZ English:

1. **Edge TTS** `en-NZ-MollyNeural` / `en-NZ-MitchellNeural` — true NZ
2. **MiniMax** `English_Aussie_Bloke` — only explicitly-AU voice in the 332-voice library
3. **Gemini 3.1 Flash TTS** with `language: en-AU` — 30 voices with gender/style tags, AU accent
4. **Edge TTS** `en-AU-NatashaNeural` / `en-AU-WilliamMultilingualNeural` — Australian
5. **Gemini 3.1 Flash TTS** with `language: en-GB` — UK (more formal but familiar)
6. **Edge TTS** `en-GB-*` — UK
7. Everything else (US English, neutral English) — accent-mismatch territory

**For warm-community brands (BinSparkle, Kindred):** Female/Warm voices on
the AU rung. Top candidates by description:

- Gemini `Sulafat` (Female/Warm) + `language: en-AU` ← strongest on-paper fit
- Gemini `Aoede` (Female/Breezy) + `language: en-AU` ← backup
- Gemini `Achird` (Male/Friendly) + `language: en-AU` ← male option
- MiniMax `English_Aussie_Bloke` ← male, explicitly AU

**These were all auditioned 2026-08-02.** Samples in
`assets/runware-voice-library/2026-08-02/`. Listen before committing —
descriptions get you in the right ball-park, the ear makes the final call.

## The audition tools

Two parallel scripts, one per TTS provider:

```bash
# Edge TTS (NZ, AU, GB, US, ... — unmetered, the default for NZ brands)
node scripts/preview-voices.mjs                                 # all English locales
node scripts/preview-voices.mjs --filter="^en-NZ"               # NZ only
node scripts/preview-voices.mjs --filter="^en-(NZ|AU|GB)" --text="Your line."
node scripts/preview-voices.mjs --list                          # dry run

# Runware TTS (MiniMax, Gemini, Inworld, xAI — cost-guarded)
node scripts/preview-runware-voices.mjs                                 # warm-community preset
node scripts/preview-runware-voices.mjs --preset=nz-adjacent             # NZ-adjacent
node scripts/preview-runware-voices.mjs --list                          # dry run
node scripts/preview-runware-voices.mjs --voices="eve,luna" --model=xai:tts@0
```

Both write a dated folder + an `INDEX.md` with play links. Open the folder
in a file manager, click through the MP3s side-by-side, and write what you
heard next to each line in `INDEX.md` — that turns a one-off audition into
a permanent reference.

Curated presets live in `scripts/preview-runware-voices.mjs` → `PRESETS`.
Add new vibes/voices there as the catalogue grows.

## Per-vibe shortlists (curated 2026-08-02, listen to confirm)

These are STARTING POINTS — descriptions narrow the field; only the ear
picks the winner. Each entry is verified live on the account.

### Warm-community (BinSparkle, Kindred, local-trust brands)

- **Edge TTS `en-NZ-MollyNeural`** — the default for NZ warm-community
- Edge TTS `en-NZ-MitchellNeural` — male NZ alternative
- MiniMax `English_FriendlyPerson` — descriptive, friendly (neutral English)
- MiniMax `English_CalmWoman` — descriptive, calm (neutral English)
- MiniMax `English_Kind-heartedGirl` — descriptive, kind
- MiniMax `English_Aussie_Bloke` — descriptive, AU accent (male)
- Gemini `Sulafat` (Female/Warm) + `en-AU` — Runware warm+AU
- Gemini `Aoede` (Female/Breezy) + `en-AU` — Runware breezy+AU
- Gemini `Achird` (Male/Friendly) + `en-AU` — Runware friendly+AU (male)

### Contemplative (meditation, sacred-revelation brands)

- **Edge TTS `en-GB-RyanNeural`** at `-15%` rate — locked 2026-04-28 on
  singularity-convergence v5 ("the best voice I've heard so far. lock
  that in" — see `memory/feedback_voice_locked_contemplative.md`)
- MiniMax `English_SereneWoman` — by description, fits
- MiniMax `English_Graceful_Lady` — by description, fits
- Gemini `Achernar` (Female/Soft) — by description, fits

### Kinetic-pop (DTC, lifestyle, creator-tool launches)

- MiniMax `English_Upbeat_Woman` — by description, fits
- MiniMax `English_PlayfulGirl` — by description, fits
- MiniMax `English_ManWithDeepVoice` — for confident male reads
- Gemini `Autonoe` (Female/Bright) — by description, fits
- Gemini `Puck` (Male/Upbeat) — by description, fits

### Documentary (B2B, regulated industries, explainers)

- Edge TTS `en-GB-Ryan` or `en-US-Christopher` (per Stage 3 matrix)
- MiniMax `English_CaptivatingStoryteller`
- MiniMax `English_expressive_narrator`
- Gemini `Rasalgethi` (Male/Informative) + `en-GB`
- Gemini `Sadaltager` (Male/Knowledgeable) + `en-GB`

### Quiet-premium (luxury, hospitality, fashion)

- Edge TTS `en-GB-Sonia` or `en-US-Aria` (per Stage 3 matrix)
- MiniMax `English_Graceful_Lady`
- Gemini `Vindemiatrix` (Female/Gentle) + `en-GB`
- Gemini `Schedar` (Male/Even) + `en-GB`

The Stage 3 brand-tone × register matrix at
`docs/skills/how-a-video-gets-made.md` is the source of truth for
which register a brand needs; this voices playbook is the model+voice
picker that sits on top.

## When you've picked: lock it

Once the brand's voice is chosen, record it in two places so the next
session doesn't re-litigate:

1. **`videos/<brand>/DESIGN.md` → "Voice picks" section** — brand-specific lock.
2. **`MEMORY.md`** (if user-locked) — global lock that survives across sessions.

Example: `memory/feedback_voice_locked_contemplative.md` locks
`en-GB-RyanNeural -15%` for contemplative. Future BinSparkle work should
lock `en-NZ-MollyNeural` (or whatever the user picks after auditioning the
nz-adjacent shortlist).

## Pricing reference (verified 2026-08-02)

For a typical 30s ad script (~450 chars):

| Model | Per script | Notes |
|---|---:|---|
| Edge TTS (any voice) | **$0** | Unmetered. The default for NZ. |
| `xai:tts@0` | $0.007 | Cheapest Runware. 27 voices, no descriptions. |
| `inworld:tts@1.5-mini` | $0.011 | 73 voices, no descriptions. |
| `inworld:tts@1.5-max` | $0.023 | Same 73 voices, higher fidelity. |
| `google:gemini@3.1-flash-tts` | ~$0.02 | Token-priced. 30 voices WITH descriptions + 87 locales. |
| `minimax:speech@2.8` Turbo | $0.027 | 332 voices WITH descriptions. |
| `minimax:speech@2.8` HD | $0.045 | Same voices, higher fidelity. |

Cost shouldn't drive the pick for one-off ads — even premium is cents.
Accent + vibe fit drives the pick.

## Reference

- **Audition scripts:** `scripts/preview-voices.mjs` (Edge),
  `scripts/preview-runware-voices.mjs` (Runware).
- **Audition samples:** `assets/voice-library/<date>/` (Edge),
  `assets/runware-voice-library/<date>/` (Runware).
- **Per-model docs:** `https://runware.ai/docs/models/<slug>` — the voice
  enum on each page is the source of truth for what's available.
- **Stage 3 tone × register matrix:** `docs/skills/how-a-video-gets-made.md`.
- **Locked voices:** `memory/feedback_voice_locked_*.md`.
- **Audio playbook (TTS decision tree):** `automation-template/runware.md`.
