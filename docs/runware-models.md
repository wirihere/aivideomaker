# Runware Model Catalogue

> **Goal:** given a task, surface the suitable models with their prices and
> tradeoffs so the right level can be picked — then default to the best quality,
> because for short ad work the absolute cost is tiny.
>
> A typical 30-second ad script is ~450 characters. Even at premium TTS rates
> ($0.05/1k chars) that's **$0.023 per read**; ten iterations cost 23 cents.
> The level ladder matters only at volume — hundreds of vision-judge calls per
> render, multi-language bulk runs, long-form narration. For those, drop to
> budget. For one-off ads, default to premium.
>
> Verified entries have a `verified` date — the AIR id resolved on the account
> and the params match the docs at that date. Unverified entries are candidates
> pending a live probe; treat them as leads, not facts.

This catalogue backs the chooser in `scripts/lib/runware-models.mjs` —
`modelsFor(modality)` returns the candidates with prices and tradeoffs surfaced;
`pickModel(modality)` defaults to **premium** (drop to budget only for high-volume
loops). The reporter CLI `npm run runware:models` prints the live table.

## How to call any Runware model

- **Endpoint:** `https://api.runware.ai/v1` · `Authorization: Bearer $RUNWARE_API_KEY` · body = array of task objects.
- **Model id = AIR `creator:family@version`** (e.g. `openai:gpt@5-mini`, `xai:tts@0`). NOT the dashed doc slug.
- **Task types:**
  - `textInference` — LLMs + vision (multimodal: text + image_url content blocks)
  - `audioInference` — TTS, music, voice conversion, scene audio
  - `imageInference` — text-to-image, image-to-image
  - `videoInference` — text-to-video, image-to-video
  - `modelSearch` — free catalogue lookup (community models only — does NOT index the hosted commercial AIR ids)
- **Cost guard:** every paid call passes through the shared `RUNWARE_DAILY_CAP` (default $2). Spend tracked in `.runware-usage.json` (gitignored). Reporter: `npm run runware:usage`.
- **Failed requests are not charged.** Add `includeCost: true` to any task to get the exact USD `cost` back.

## Per-modality picks

### Vision (image-to-text, video-to-text)

| AIR id | Name | Price | Best for | Avoid for | Verified |
|---|---|---|---|---|---|
| `openai:gpt@5-mini` | GPT-5 Mini | ~$0.0004 / simple look; ~$0.002–0.005 / rubric judge | Cheap default for every vision-judge call. | Fine detail in crowded frames. | 2026-08-02 |

Stronger options when borderline (not yet price-probed on this account): `google:gemini@3-flash`, `anthropic:claude@sonnet-4-6`. Wire through `scripts/lib/runware-vision.mjs` → `judge({ model })`.

### Text (text-to-text)

| AIR id | Name | Price | Best for | Avoid for | Verified |
|---|---|---|---|---|---|
| `anthropic:claude@opus-4.8` | Claude Opus 4.8 | $0.016 / script | **Recommended top tier** for copywriting (8s latency). Tightest CTAs, strong brand-voice lifting. | Bulk iteration loops (drop to Sonnet 4.6). | 2026-08-02 |
| `anthropic:claude@sonnet-4.6` | Claude Sonnet 4.6 | $0.007 / script | Value pick — near-top quality at half Opus's price. | The absolute tightest final polish. | 2026-08-02 |
| `openai:gpt@5.4` | GPT-5.4 | $0.007 / script | Fast iteration (4s latency — fastest of the text models). | Hero/CTA lines — Claude is meaningfully better. | 2026-08-02 |

Anthropic dominates the top of the field for copywriting. **Opus 4.8 is the
smart default** — Fable 5 ($0.13/script) tested slightly better but at 8×
the cost for a marginal gain; reserve Fable 5 for one-off hero work where
cost doesn't matter. OpenAI's `gpt@5.5` and both Google flagships were
tested and underwhelmed (GPT-5.5 missed an explicit constraint; Gemini
3.5 Flash produced generic hooks; Gemini 3.1 Pro is 8× the cost of
equivalent-quality Claude options). Full per-model breakdown, ranked
outputs, and the reusable prompt template: `docs/playbooks/script-and-copy.md`.

### Image-gen (text-to-image, image-to-image)

| AIR id | Name | Price | Best for | Avoid for | Verified |
|---|---|---|---|---|---|
| `runware:400@1` | FLUX.2 [dev] | $0.009 / image (1024²) · $0.016 / image (1088×1920 social) | **Default** for all social content — carousels, stories, thumbnails, base character images. Serverless (GPU-billed). | Hero shots where maximum detail and prompt adherence matter (use Pro). | 2026-08-03 |
| `bfl:5@1` | FLUX.2 [pro] | $0.030 / image (1024²) · $0.045 (1792×1024) · scales with resolution | Top-quality generation. Better prompt adherence and fine detail than dev. | Routine social content (dev is 3× cheaper at square and fine for carousels/stories). **Photo-real people** — see the note below. | 2026-08-08 |
| `bfl:7@1` | FLUX.2 [max] | $0.100 / image (1792×1024) | Nothing yet. Tested head-to-head 2026-08-08 and it looked *worse* than pro at 2× the price. | Everything, until someone finds a case it wins. | 2026-08-08 |
| `google:4@2` | Nano Banana Pro | $0.138 / image (2752×1536) | **Photo-real people and scenes.** Clearly the most convincing of the five — real skin texture, worn clothing, no invented logos, believable light. Use for anything a customer will read as a real photograph. | Bulk social content (10× the price of FLUX dev). | 2026-08-08 |
| `bytedance:seedream@4.5` | Seedream 4.5 | $0.040 / image (2688×1536) | Photo-real scenes and animals at a quarter of Nano Banana Pro's price. Second-best realism of the five. | Nothing found yet. | 2026-08-08 |

**Realism ranking (identical prompt, 2026-08-08, NZ suburban scene with a person
and a dog):** Nano Banana Pro ≫ Seedream 4.5 > FLUX.2 max > FLUX.2 pro. The FLUX
family has a house style — orange golden-hour cast, smooth waxy skin, and it
invents lettering and logos on clothing. It reads as AI at a glance. **Do not
reach for FLUX when the image has to pass as a real photo of real people.**

**Pricing scales with resolution** (serverless = GPU-seconds). Social-sized
9:16 images (1088×1920, the nearest valid FLUX size to 1080×1920) cost ~$0.016
on dev. **Default is dev.** Escalate to pro only for hero work. 7
character-base images at social size on dev ≈ $0.11. Full playbook:
`docs/playbooks/image-generation.md`.

### TTS (text-to-audio)

| AIR id | Name | Price | Best for | Avoid for | Verified |
|---|---|---|---|---|---|
| `xai:tts@0` | xAI TTS | $0.015 / 1k chars (verified: $0.00024 for 16 chars) | Baseline narration. 27 voices, inline speech tags, 20+ languages. Good default when the script is straightforward. | Voice cloning (use qwen3-tts-1.7b-base); multi-speaker dialogue (use gemini-3.1-flash-tts or fish-audio). No speed/temperature knob. | 2026-08-02 |
| `inworld:tts@1.5-mini` | Inworld TTS-1.5 Mini | $0.025 / 1k chars | When the read needs more expression than xAI gives. 76 voices, temperature control. | Routine narration where xAI is indistinguishable to the ear. | 2026-08-02 (docs-verified) |
| `inworld:tts@1.5-max` | Inworld TTS-1.5 Max | $0.05 / 1k chars | Top-fidelity narration where the voice carries the brand. Same param surface as 1.5-mini, richer prosody. | Bulk narration (costs ~3× mini). Reserve for hero/CTA voice work. | 2026-08-02 (docs-verified) |

The right level depends on how much the voice carries the brand AND how often
you'll regenerate. For short ads (rare, low-volume), **default to premium
(`inworld:tts@1.5-max`)** — a 30s script costs ~$0.02/read. Drop to budget
(`xai:tts@0`) for bulk: multi-language runs, auditioning many takes, or
long-form narration where the per-character cost compounds. Generate one phrase
at the level you think you need, listen, then commit. Full TTS comparison and
worked examples: `automation-template/runware.md`.

**Absolute cost for a typical 30s ad script (~450 chars):**
- baseline (`xai:tts@0`): $0.0068/read
- mid (`inworld:tts@1.5-mini`): $0.011/read
- premium (`inworld:tts@1.5-max`): $0.023/read

### Music (text-to-audio beds/songs)

| AIR id | Name | Price | Best for | Avoid for | Verified |
|---|---|---|---|---|---|
| `runware:ace-step@v1.5-turbo` | ACE-Step v1.5 Turbo | $0.0001 / sec (verified: $0.0009 for 30s bed) | Cheapest music. Real `bpm`/`keyScale`/`timeSignature` params. 30–300s. Instrumental via `vocalLanguage: "unknown"`. | Max quality or negative-prompt control. | 2026-08-02 |
| `runware:ace-step@v1.5-base` | ACE-Step v1.5 Base | $0.00015 / sec | Higher-quality beds; `negativePrompt` + `CFGScale` + 1–300 steps. | Fast/cheap loops (Turbo is ~3× cheaper). | 2026-08-02 (docs-verified) |

Other music models (not yet probed): `minimax:music@2.6` ($0.15/song, full vocal songs), `minimax:music@cover` (audio-to-audio restyle), `bytedance:seed-audio@1.0` ($0.158/min, scene-level audio).

### Video (text-to-video, image-to-video)

| AIR id | Name | Price | Best for | Avoid for | Verified |
|---|---|---|---|---|---|
| — | — | — | Pending live probe. Candidates (cheapest in each family per docs): `lightricks:ltx-2-fast`, `google:veo@3.1-fast`, `bytedance:seedance@2.0-fast`, `alibaba:wan@2.6-flash`. | — | pending |

## Traps (verified)

0. **Image-gen size limits differ per family, and `scripts/gen-image.mjs` hides
   it.** That CLI clamps width/height to **2048** (a FLUX limit) before sending.
   Seedream needs **≥ 3,686,400 pixels**, so every call through the CLI fails
   with `invalidPixels`; Nano Banana Pro accepts only a **fixed list** of sizes,
   most of the wide ones above 2048, so it fails with `unsupportedDimensions`.
   Both errors look like the model is broken. It isn't — the CLI shrank the
   request. Bypass by calling `imageInference()` from `lib/runware-image.mjs`
   directly. Verified 2026-08-08. **`gen-image.mjs` should learn per-model
   limits; until it does, don't trust it for non-FLUX models.**
0a. **`bfl:5@1` (FLUX.2 pro) rejects `negativePrompt` outright** —
   `invalidParameter`. FLUX dev accepts it. Put the "avoid this" wording into
   the positive prompt instead. Verified 2026-08-08.
0b. **A shared prompt suffix will attach itself to whatever is in frame.** A
   twelve-image set shared the line "the polo shirt is completely plain with no
   logo". In the one shot with no human in it, the model dressed the **dog** in
   a polo shirt. Keep wardrobe instructions out of the shared suffix, or strip
   them for people-free frames. Verified 2026-08-08.

| AIR id | Modality | Trap | Verified |
|---|---|---|---|
| `google:nano-banana@*` | vision | Only does the legacy `caption` task — rejects `textInference` / vision-QA. Use `openai:gpt@5-mini` instead. | 2026-08-02 |
| `alibaba-qwen2-5-vl-*` | vision | Listed in docs but NOT live on this account at probe time. Probe before trusting. | 2026-08-02 |

## Common audio parameters (every audioInference model)

| Param | Values | Notes |
|---|---|---|
| `outputType` | `URL` (default) / `base64Data` / `dataURI` | URL is cheapest — Runware hosts the file, you download it. |
| `outputFormat` | `MP3` (default) / `WAV` / `FLAC` / `OGG` | WAV/FLAC are lossless and FORBID `audioSettings`. |
| `audioSettings` | `{ bitrate, sampleRate, channels }` | MP3/OGG only. |
| `deliveryMethod` | `sync` (default for short) / `async` | Use async + webhook for long music generations. |
| `includeCost` | `true` | Always set — returns the exact USD `cost` for that task. |
| `numberResults` | 1–4 | Multiple takes from one call (linear cost). |

## Pricing model

Two structures (per `https://runware.ai/docs/platform/pricing`):

1. **Serverless (Optimised Compute)** — for `runware:*` AIRs. Billed by GPU seconds; cost drops as Runware optimises inference. No idle/cold-start charges.
2. **Fixed Price** — for partner models (xAI, MiniMax, Inworld, Google, Alibaba, Fish Audio, ByteDance). Per-request, set by the provider.

Per-modality cheapest documented (aggregated 2026-08-02, for budgeting only — not a recommendation):

- **TTS:** from $0.015 / 1,000 chars (`xai:tts@0`) up to $0.10 / 1,000 chars (`minimax:speech@2.8` HD) — a ~7× range. Mid-tier `inworld:tts@1.5-mini` ($0.025) and `inworld:tts@1.5-max` ($0.05) sit between.
- **Music:** from $0.0001 / sec (`runware:ace-step@v1.5-turbo`) up to ~$0.05 / min (`minimax:music@2.6`) — ~8× per-minute range.
- **Vision:** from ~$0.0004 / look (`openai:gpt@5-mini`, verified) — stronger options scale up.

## Adding to this catalogue

1. Probe the model live with a minimal call (`includeCost: true`).
2. If it resolves, add an entry to the modality table above with `verified: <ISO date>`.
3. Mirror the entry in `scripts/lib/runware-models.mjs` → `RECOMMENDED[<modality>]`.
4. For traps, add to the TRAPS array (both the lib and the table above).
5. Re-run `npm run runware:models` to confirm the chooser returns the new pick.

## Reference docs

- All models: `https://runware.ai/docs/models` (filter by Capability in the sidebar).
- Model Search API: `https://runware.ai/docs/platform/model-search`.
- Pricing overview: `https://runware.ai/docs/platform/pricing`.
- Audio playbook (TTS + music deep dive): `automation-template/runware.md`.
