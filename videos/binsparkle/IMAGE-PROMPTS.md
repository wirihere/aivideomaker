# Bin Sparkle — image prompts (customer Facebook ad)

**Written 2026-07-29.** For ChatGPT image generation, feeding
`compositions/binsparkle-*.html` at **1080×1920 (9:16), six scenes**.
Voice + music: reuse the existing Australian TTS and the recruit music bed.

> **The script leads this document.** Read
> [`SCRIPT-customer.md`](SCRIPT-customer.md) first — it sets the six beats,
> the voiceover and the on-screen text. Every image below exists to serve a
> beat in it. If the script changes, change these before generating anything.
>
> Scene numbers here map 1:1 to the beat numbers there.

---

## Read this before generating anything

1. **Do not bake text into scenes 1–6.** The video composition renders every
   headline itself as live HTML (`#s1-h`, `#s2-h`…). An image with its own
   words will collide with that text and look like a mistake. The **end card
   (E1) is the only place** words belong in the image.
2. **Everything is 9:16 vertical, 1080×1920.** Ask for it explicitly every
   time — the default is square and a square crop kills the composition.
3. **Leave the top third and bottom quarter quiet.** Headline sits high, CTA
   sits low. Busy detail there gets covered.
4. **Bin colours — check before you commit.** These prompts say "dark green
   body, coloured lid". Match the actual Hamilton City Council kerbside
   colours before locking the brand set, or every future ad inherits a wrong
   detail that locals will spot instantly.
5. **No logos, no watermarks, no council branding.** Bin Sparkle's own mark is
   added by the composition.

---

## Part A — the brand set (image-to-image anchors)

Generate these **once**, at high quality, and keep them. Every future video
starts by feeding the relevant anchor back in as an image-to-image reference,
so the bin, the cleaner and the van are recognisably the *same* ones every
time. That repetition is the brand.

### A1 — The hero bin *(the most reused image in the whole system)*

> A single New Zealand kerbside wheelie bin, photographed as a clean product
> hero shot. Dark forest-green body with a coloured lid, standing upright and
> perfectly centred, three-quarter angle so one side and the front are both
> visible. Spotless, freshly washed, faint water beading on the plastic. Soft
> even studio lighting from the upper left, gentle contact shadow beneath.
> Background is a flat pale sage-green backdrop, no texture, no props, no
> people. Colour palette: deep green #1f6840, pale green-grey #eef5ee, near
> black-green #0d2218. Photorealistic, sharp, shallow depth of field.
> Vertical 9:16, 1080×1920. No text, no logos, no watermarks.

**Use as reference for:** every bin in every scene, forever.

### A2 — The cleaner *(same person in every ad)*

> A friendly New Zealand contractor in their thirties standing beside a wheelie
> bin on a suburban footpath, mid-morning. Wearing a plain dark forest-green
> polo shirt and work trousers, sturdy boots, no branding on the clothing.
> Relaxed, capable, mid-action — one hand resting on the bin lid, looking
> slightly off camera, natural half-smile, not posed for the lens. Real skin
> texture, real work clothes, slightly worn. Warm natural daylight, soft
> shadows. Background is a softly blurred New Zealand suburban street.
> Photorealistic documentary style, 50mm look. Vertical 9:16, 1080×1920.
> No text, no logos, no watermarks.

**Use as reference for:** scenes 3, 4 and 5. Feed this in every time so the
face doesn't change between shots — the single biggest tell of AI-made ads.

### A3 — The van and kit

> A small white work van parked at the kerb of a New Zealand suburban street,
> side door open showing a compact pressure-washing setup inside — a water
> tank, coiled hose, tidy equipment, everything clean and organised. Side of
> the van is deliberately blank, unbranded. Mid-morning light, soft shadows.
> Photorealistic. Vertical 9:16, 1080×1920. No text, no logos, no watermarks.

**Use as reference for:** the arrival beat, and any future "we come to you"
video. Blank panel is deliberate — the composition can overlay the brand mark.

### A4 — The street

> A quiet New Zealand suburban residential street on collection morning.
> Single-storey weatherboard houses, low front fences, established trees,
> wheelie bins standing at intervals along the kerb. Soft overcast morning
> light, damp footpath, calm and ordinary. Photorealistic, wide depth of
> field, no people, no cars moving. Vertical 9:16, 1080×1920. No text, no
> logos, no watermarks.

**Use as reference for:** establishing shots and backgrounds. Keeps every ad
in the same town.

### A5 — The sparkle texture

> Extreme macro of clean water sheeting down smooth dark green plastic, tiny
> droplets catching light, a few soft bright highlights. Abstract, no
> recognisable object. Deep green and pale green-white palette. Vertical 9:16,
> 1080×1920. No text, no logos, no watermarks.

**Use as reference for:** transitions and overlays. Cheap way to make cuts
feel like one film rather than six stock photos.

---

## Part B — the six scenes (this ad only)

Fresh each video. These are the "whatever goes with the video" half.

### S1 — The problem *(hook, first 2 seconds)*

> Close-up looking down into an open wheelie bin on a suburban driveway. The
> inside is grimy and stained with dried residue, dark streaks down the walls,
> the lid propped open. Grim but not gross — no insects, no rotting food, no
> visible rubbish. Harsh late-morning sun, hard shadows, slightly desaturated
> and unflattering. Photorealistic. Vertical 9:16, 1080×1920. Leave the top
> third simple and uncluttered. No text, no logos, no watermarks.

*Why: the scroll-stopper. Everyone with a bin recognises this instantly.*

### S2 — The smell *(the feeling, not the fact)*

> A person standing at their kerb turning their face away from an open wheelie
> bin, one hand half-raised, eyes closed, recoiling slightly. Ordinary New
> Zealand suburban front yard, casual weekend clothes. Candid and natural, a
> touch of humour, not exaggerated or cartoonish. Warm daylight.
> Photorealistic. Vertical 9:16, 1080×1920. No text, no logos, no watermarks.

### S3 — The easy bit *(booking)*

> Close-up over the shoulder of a hand holding a phone on a kitchen bench,
> morning light through a window, blurred New Zealand kitchen behind. The
> phone screen is a plain soft green-white glow with no readable interface.
> Warm, calm, unhurried. Photorealistic, shallow depth of field. Vertical 9:16,
> 1080×1920. No text, no logos, no watermarks.

*The blank screen is deliberate — the composition draws the booking UI on top
in real brand colours, which always looks better than an AI's idea of an app.*

### S4 — The clean *(the money shot)*

> A contractor pressure-washing the inside of a wheelie bin on a suburban
> driveway, bright spray and mist catching the sunlight, water sheeting off
> the plastic, visible dirt lifting away. Dynamic mid-action, droplets frozen
> in the air, slight motion in the spray. Warm morning backlight through the
> mist. Photorealistic, energetic. Vertical 9:16, 1080×1920. No text, no
> logos, no watermarks.

*Feed A2 in as reference so it's the same cleaner as S3 and S5.*

### S5 — The result *(the payoff)*

> A spotless wheelie bin standing at the kerb of a tidy New Zealand suburban
> home, lid closed, plastic clean and gleaming with a few water droplets
> still on it. Bright clear morning light, crisp shadows, saturated and
> cheerful — the visual opposite of the first shot. Photorealistic, calm and
> satisfying. Vertical 9:16, 1080×1920. Leave the lower quarter clear. No
> text, no logos, no watermarks.

*Generate this one with S1 as an image-to-image reference: same bin, same
driveway, same angle. The match is what sells the before-and-after.*

### S6 — End card *(the only image allowed to contain words)*

> A clean flat brand end card. Deep forest-green background #1f6840. Centred
> in crisp modern sans-serif white lettering: the words "BIN SPARKLE" large,
> and beneath in smaller lettering "binsparkle.nz". Generous empty space
> around the type, a single subtle water droplet motif, nothing else. Flat
> graphic design, not photographic. Vertical 9:16, 1080×1920.

*Check the spelling character by character before using it. Even good models
misspell a made-up brand name, and this is the one frame where it shows.*

---

## Where image-to-image goes, in one line

**Anchors (A1–A5) are generated once and reused as references forever — that's
the brand.** Scenes (S1–S6) are generated fresh per video, but always *with*
the relevant anchor fed in, so the bin, the cleaner and the street stay the
same across every ad Bin Sparkle ever runs.

The pair that matters most: **A1 → S1 → S5.** One bin, filthy then spotless,
same angle. That is the whole ad.
