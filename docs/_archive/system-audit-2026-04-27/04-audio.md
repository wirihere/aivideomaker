> **SUPERSEDED — see [docs/skills/how-a-video-gets-made.md](../../skills/how-a-video-gets-made.md) for the current process.**
> Archived 2026-04-28. The doc below is preserved for historical reference; do not use as a current source.

---

# 04 — Audio pipeline audit (2026-04-27)

Sources: `assets/music-shortlists/*.json`, `scripts/{pick-music,fetch-pixabay-music,fetch-tts-edge,preview-voices,audio-duck,video}.mjs`, all `compositions/**/*.html`, `assets/voiceover/`, `assets/music/`, `LEARNINGS.md` §2/§3, `docs/render-learnings/LEDGER.md`.

## 1. Per-shortlist coverage

| Shortlist | Tracks | BPM (curated) | Default vol | `proven_on` | Local files |
|---|---:|---|---:|---|---|
| warm-community | 5 | 84-92 (80-100) | 0.18 | kindred-bed | 2/5 |
| kinetic-pop | 5 | 118-128 (110-130) | 0.30 | none | 2/5 |
| documentary | 4 | 68-76 (60-80) | 0.22 | none | 1/4 |
| quiet-premium | 6 | 54-64 (50-70) | 0.12 | none | 2/6 |
| sacred-cosmic | 3 | 55-62 (50-70) | 0.18 | sacred-cosmic-1 | 3/3 |

- **Only 2 of 23 tracks are battle-tested** (`kindred-bed`, `sacred-cosmic-1`). The other 21 are speculative.
- Gap between 92-110 BPM — no "uplifting documentary" middle ground (cinematic strings at 100 BPM).
- **No hard-tech / industrial / motorsport register** (memory rule `project_music_shortlist_gap`). Biker/manufacturing brands force-fit onto kinetic-pop, which is wrong.
- **No epic-cinematic launch register** for B2B/SaaS hero scenes — kinetic-pop is too DTC-tropical, documentary too restrained.
- All shortlists are Pixabay-only — single-source, no fallback CDN.

## 2. Picker — selection algorithm (`scripts/pick-music.mjs`)

| Signal | Score |
|---|---:|
| `local_file` exists on disk | +1000 |
| URL is `cdn.pixabay.com/audio/...` | +500 |
| URL is direct music page `pixabay.com/music/<slug>-<id>/` | +250 |
| URL is search page `pixabay.com/music/search/...` | +50 |
| Curator-order tiebreak | +(20 - idx) |

Then `--seconds=N` filters tracks to `duration >= N + 5` (selection buffer only — see §6, no actual fade applied).

Edge cases handled: curated shortlist beats auto-built catalog; tone aliases (`contemplative`, `sacred-oracle`) → `sacred-cosmic`; `--download` skips network if local exists.

Edge cases NOT handled: no BPM-fit fallback (if brief calls 90 BPM but tone=energetic, all kinetic-pop tracks are 110+); 5s buffer is selection-time only.

## 3. Sourcing — `scripts/fetch-pixabay-music.mjs` resilience

Playwright headless → cookies → first play button (4 selector strategies) → intercept `.mp3` from network → download via `ctx.request.get`.

Failure modes:
- **Rate limit:** throws `HTTP <status>` and exits non-zero. No exponential backoff retry. Cold first-run on a fresh clone is fully exposed.
- **Track removed from Pixabay:** `mp3Urls.size === 0` triggers `throw new Error("No mp3 URLs found")`. If `local_file` was deleted from disk too, we're stuck.
- **DOM regression:** all 4 play-button strategies are CSS/aria-based. A Pixabay redesign breaks all four at once.
- **No checksum / etag pinning** for local files — silent replacement (a `git pull` overwrites `assets/music/...`) goes undetected.

## 4. TTS — voice canon + sanitization

LEARNINGS §2 canonical picks: `en-NZ-MollyNeural` (-10%), `en-AU-NatashaNeural` (-10% +2Hz), `en-AU-WilliamNeural` (-12% baritone). These were chosen pre-voice-library — empirically validated on Claim Mate v3-v5, never side-by-side audited against the new library.

Voice library status (`assets/voice-library/2026-04-25/`): one dated folder, only 2 en-NZ voices in the INDEX (Molly + Mitchell). The Apr-25 run was filtered. **Canonical en-AU picks have never appeared in the library.**

Edge TTS ceiling: `edge-tts-universal` Read Aloud allows ONE `<voice>` + ONE `<prosody>`. Levers are `--rate`, `--pitch`, `--volume` only. No `<break>`, `<emphasis>`, `<say-as>`, no Azure styles. Pitch shifts across emphasis words require segment-and-concatenate — currently not done.

### Sanitization (`scripts/video.mjs:1997-2024`)

Currently 18 patterns, all te-reo Māori → English. Memory rule `feedback_tts_no_maori` enforced.

**Other gotchas NOT covered:**
- **No acronym handling.** LEARNINGS §2 says "write `A.C.C.` not `ACC`" — sanitizer doesn't auto-insert dots. `ACC`, `B2B`, `SaaS`, `NZBN`, `EFTPOS`, `IRD` ship as words.
- **No URL handling.** `oraculuminstitutum.org` reads as one mangled word. Singularity Convergence narration script wisely omitted the URL inline; no rule prevents the next author from including one.
- **No number sanitization.** `2026` → "twenty twenty-six", `30%` → "thirty percent" — author discipline only.
- **No Pasifika loanwords.** Talofa, malo, fa'a Samoa, ofa atu — the same pronunciation issue that motivated the te-reo block applies; currently silent.
- **No European diacritics.** Edge TTS handles café/naïve via Unicode normalization, but CMS copy may pass `caf&eacute;` HTML-entity-encoded.

### Voice library curator (`scripts/preview-voices.mjs`)

Last run: 2026-04-25 (one folder, 2 mp3s). Supports `--all-locales` and chunked-5 concurrency. **Has not been re-run since 2026-04-25.** Microsoft updates Edge TTS voices intermittently (LEARNINGS notes Dec 2025 added a User-Agent requirement). Library is staler than the service.

## 5. Mixing — track-index ladder

LEARNINGS §4 line 828 reservation:
- 0-7: scene clips · **8: music** · **9: narration / VO** · 10: header · 13: film grain · 20+: SFX

Volumes: music 0.18 (warm/sacred), 0.22 (documentary), 0.30 (kinetic-pop), 0.12 (quiet-premium); VO 0.95.

Real templates:
- `compositions/templates/sacred-oracle/sacred-hook-15s.html:218-228` — music t8 vol 0.18, VO t9 vol 0.95.
- `compositions/kindred-production-30s.html:357-452` — 13 SFX clips on tracks 20-32, vols 0.16-0.46. Only template that exercises the SFX ladder.

Issues:
- **The ladder isn't documented** outside §4. New templates copy by osmosis. No `docs/audio-mixing.md`.
- **Spectral ducking exists but isn't wired.** `scripts/audio-duck.mjs` has frequency-aware sidechain compression with podcast/cinematic/tiktok presets — orphaned CLI. `video.mjs` uses static `data-volume` only.
- **No master limiter / loudness normalisation.** No `loudnorm` filter. Pixabay tracks vary in mastered loudness; output peaks vary per render.
- **No VTT-driven sidechain.** We have free word-level VTT timing from Edge — never used to duck music a few dB during spoken words.

## 6. Audio fade-out — confirmed gap

Searched all 30+ compositions for fade-out tweens (`tl.to(...music...{volume:0})`, `gsap.to(...musicVolume...)`). **Zero matches.**

Concrete consequence:
- `sacred-cosmic-1.mp3` is 136s. `sacred-hook-15s.html` plays it for `data-duration="15"` then cuts mid-phrase — the track has no built-in fade tail.
- `pick-music.mjs`'s 5s `--seconds=N` buffer is **selection** only, not **mix**. Nothing fades during those 5s.
- LEDGER: `audio gap` appears 9× across recent renders (kindred-recut, kindred-nz, baseline-stripe, singularity-convergence). Verifier already detects it; no template fixes it.

## 7. File format

| File | Codec | Bitrate | Sample rate | Channels |
|---|---|---:|---:|---|
| sacred-cosmic-1.mp3 | mp3 | 256 kbps | 44.1 kHz | stereo |
| kindred-bed.mp3 | mp3 | 256 kbps | 48 kHz | stereo |
| singularity-convergence.mp3 (VO) | mp3 | 48 kbps | 24 kHz | mono |
| kindred-nz.mp3 (VO) | mp3 | 48 kbps | 24 kHz | mono |

Music at 256 kbps stereo is fine. **Edge TTS returns 48 kbps mono 24 kHz** — transparent on phone speakers, thin on headphones under music. We're already lossy-twice (Edge mp3 → AAC re-encode in MP4). FLAC for VO isn't an option (Edge emits mp3 only). Music lossless isn't realistic either (Pixabay ships mp3 only).

Opportunity is at the mix stage: control AAC bitrate in final MP4. Currently unverified — HyperFrames `render` emits whatever default. Force ≥192 kbps stereo at 48 kHz for the final mix.

## Top issues (ranked by leverage)

| # | Issue | Evidence | Leverage |
|---|---|---|---|
| 1 | No music fade-out in any template | All sacred-oracle + community templates use static `data-duration`; sacred-cosmic-1 cuts mid-phrase | Massive — global |
| 2 | Sanitization is te-reo only | `sanitizeForTts` 18 patterns. No acronyms / URLs / numbers / Pasifika / diacritics | High — every non-NZ brand |
| 3 | Voice library stale + filtered | One dated folder, 2 voices, canonical en-AU picks never auditioned | Medium |
| 4 | `audio gap` flagged 9× in LEDGER | Verifier already detects, no template fix | High |
| 5 | `audio-duck.mjs` orphaned | Spectral ducking exists, never wired into render path | Medium |

## Top fixes (ranked by leverage)

1. **Default audio fade-out for all templates (CONFIRMED gap).** Every template gets `tl.to("#music", { volume: 0, duration: 1.5, ease: "power2.in" }, COMP_DURATION - 1.5)`. Add a lint rule: "music audio with no fade tween in last 2s = warning". Add to template-locking checklist as a hard gate. Two lines per template, fix once globally. **Highest leverage.**
2. **Extend `sanitizeForTts` to a `pronunciation.json` table.** Auto-insert dots in 2-5-letter ALL-CAPS acronyms (`ACC` → `A.C.C.`), spell numbers below 100, expand bare URLs to "[domain] dot org", add Pasifika loanwords. Test against current VTTs as regression fixtures.
3. **Re-run `preview-voices.mjs --all-locales` weekly via scheduled task.** Commit dated INDEX.md. Compare canonical picks (Natasha/William) against fresh library at the same sample text. Either confirm canon or upgrade.
4. **Wire `audio-duck.mjs` into `video.mjs` as optional final-mix stage.** Add `--duck=podcast|cinematic|tiktok|none` flag (default `podcast`). After VO + music finalized, write ducked mix to `assets/voiceover/<slug>-mixed.mp3`, swap into `#music` src.
5. **Add `docs/audio-mixing.md` documenting the track-index ladder.** Tracks 0-7 / 8 / 9 / 10 / 13 / 20+, per-tone volumes, fade-out rule. Ship as lint check.

## Recommendation: default audio fade-out for all templates

Pattern, applied at the bottom of every template's GSAP timeline:

```js
// Fade music out in last 1.5s — required: track 8 must not cut hard at scene boundary
const COMP_DURATION = 15; // or 30, 45, 60 — match root scene data-duration
tl.to("#music", { volume: 0, duration: 1.5, ease: "power2.in" }, COMP_DURATION - 1.5);
```

Apply to: all 8 sacred-oracle templates, kindred-production-30s, kindred-showcase, every community-app template, singularity-convergence, plus any template not yet in `template-models.md`. Add to `docs/template-models.md` as a hard gate: **no template marks `locked-vN` without a music fade-out tween in the last ≤2s.** Add a lint rule scanning for `<audio id="music">` elements lacking a corresponding GSAP volume-to-zero tween in the final 2s of comp duration.
