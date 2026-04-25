# Playbook — Music for Compositions

The user has taste on music and wants to exercise it. Don't treat music as a pure search task — ask first, search second.

---

## Default flow

1. **Ask the user first** — "Do you have a music track in mind? If so, drop the URL." Do this before kicking off any music search.
2. **If yes** — use direct-URL mode (see below). One-shot, deterministic.
3. **If no** — fall through to a search via [scripts/fetch-pixabay-music.mjs](../../scripts/fetch-pixabay-music.mjs) with mood keywords.

Verified on Claim Mate v5 (2026-04-24): user handed over `https://pixabay.com/music/adventure-inspirational-513432/` directly. Right immediately, zero iteration.

---

## Direct-URL mode

Both `fetch-pixabay-music.mjs` and `fetch-pixabay-video.mjs` accept a Pixabay URL in place of a search term. When detected, the script jumps straight to that page, skipping the search entirely.

```bash
node scripts/fetch-pixabay-music.mjs "https://pixabay.com/music/adventure-inspirational-513432/" v5-bed
```

Detection regexes:
- Music: `/^https?:\/\/(?:www\.)?pixabay\.com\/music\//i`
- Video: `/^https?:\/\/(?:www\.)?pixabay\.com\/videos\/[^\/]+-\d+\/?/i` (slug-with-id)

Output filename auto-derived from the URL slug. Output lands at `assets/music/<name>.mp3` (or `assets/videos/<name>.mp4`).

Use this when you've pre-screened an asset on the Pixabay site — deterministic, no result-index guessing.

---

## Search-mode fallback

If the user has no track in mind:

```bash
node scripts/fetch-pixabay-music.mjs "calm acoustic guitar inspirational" v5-bed
```

Search keywords that work for our briefs:
- Documentary cinematic: `documentary acoustic piano`, `cinematic emotional reflective`
- Inspirational/uplifting: `inspirational acoustic guitar`, `adventure folk`
- Calm/community: `gentle warm acoustic`, `community folk piano`
- Tech/explainer: `corporate inspirational uplifting`, `motivational ambient`

Always preview the result before placing in the composition — Pixabay search ordering changes day-to-day.

---

## Music + narration mix levels

Standard mix for narrated promos:
- Narration: `data-volume="1"` (full)
- Music bed: `data-volume="0.18"` to `0.25` under narration; `0.45` to `0.6` in narration-free moments

For ducking under narration, the simplest approach is fixed levels (e.g. constant `0.22` throughout). Dynamic ducking via GSAP works but adds complexity.

If the music has a strong intro hit, consider letting the bed start at `0.45` for the first 1–2 seconds, then dropping to `0.22` when narration kicks in:

```html
<audio id="music" src="assets/music/v5-bed.mp3"
       data-start="0" data-duration="29" data-track-index="9" data-volume="0.45"></audio>
```

```js
tl.to("#music", { volume: 0.22, duration: 0.6 }, 1.4); // duck for narration
tl.to("#music", { volume: 0.45, duration: 1.2 }, 26);  // swell on CTA
```

(`volume` IS animatable on `<audio>` via GSAP — no framework conflict.)

---

## Music hits as cut anchors

If the music has a clear beat or musical hit (kick at 0:08, swell at 0:16, drop at 0:24), use them as scene-cut anchors in addition to narration boundaries. Two clocks:

1. **Narration VTT** — primary clock for content-driven cuts
2. **Music timeline** — secondary clock for emotional/rhythmic cuts

When they align (cut on a narration sentence boundary that ALSO lands on a music hit), the cut feels twice as decisive. Listen to the music bed once before locking scene timings — note the hits, see if any narration cuts can shift ±0.2s to land on one.

---

## Quotas

Pixabay scrape: 1000/day, 200/hr, 20/min — tracked via [scripts/lib/usage.mjs](../../scripts/lib/usage.mjs). Run `node scripts/lib/usage.mjs report` to check current usage.
