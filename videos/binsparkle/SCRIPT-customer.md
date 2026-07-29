# SCRIPT — Bin Sparkle customer ad (Facebook, 1080×1920)

**v10, 2026-07-29.** Six scenes, **28s (Molly) / 27s (Natasha) measured**.
Voice: `en-NZ-MollyNeural`, performed beat by beat (see
[`voiceover/README-performed-read.md`](voiceover/README-performed-read.md)).
Music: the recruit bed (`voiceover/binsparkle-recruit-music.mp3`).

Audio: `assets/voiceover/bs-molly-v10.mp3` / `bs-natasha-v10.mp3` · TTS text:
[`voiceover/customer-script.txt`](voiceover/customer-script.txt)

---

## The three jobs this script has to do

1. **Stop the scroll in two seconds.** Beat 1 is the whole ad's rent.
2. **Work with the sound off.** Facebook autoplays muted. The on-screen text
   has to carry the message on its own.
3. **Only claim things that are true.** See "Claims" below.

---

## The beat sheet

| # | Voiceover | On-screen text | What's on screen |
|---|---|---|---|
| **1** | "Do you know the last time you cleaned your bin?" | **LAST CLEANED:<br>NEVER** | Looking down into a grimy, stained bin. Harsh sun. |
| **2** | "Nobody ever does. And on a warm day, you can smell it from the letterbox." | **YOU CAN<br>SMELL IT** | Someone at the kerb turning their face away from the open lid. |
| **3** | "That's what **Bin Sparkle**'s for. Book in two minutes. Someone comes out." | **BIN SPARKLE**<br>books in 2 minutes | Hand on a phone at a kitchen bench, morning light. |
| **4** | "They scrub it out, inside and out. Then deodorise it, so it's left smelling fresh." | **SCRUBBED AND<br>DEODORISED** | Pressure-washing the inside of the bin, spray catching the light. |
| **5** | "You'll see photos, before and after. So you know it's sorted." | **PHOTOS<br>BEFORE + AFTER** | The same bin from beat 1, now spotless at the kerb. |
| **6** | "That's **Bin Sparkle**. Twenty-five bucks for one bin. **Bin Sparkle** dot N Z." | **BIN SPARKLE**<br>$25 a bin<br>binsparkle.nz | Brand end card. |

**No town is named.** The script has to be reusable in any area without a
re-record. Facebook's targeting does the geography, and the booking form only
lists covered suburbs — so anyone outside the area lands on the "tell me when
you're here" waitlist rather than a dead end. The end card is where to add a
town if one ad ever needs it.

**Brand name lands three times:** beat 3, then twice in beat 6. Deliberately
**not** in beat 1 — a brand name in the hook reads as an ad and gets scrolled
past. Beat 3, about eight seconds in, is the first moment the name means
anything. Also put a small wordmark in the corner of all six scenes; most
people watch three seconds and leave, and that's the only way they see it.

---

## ⏳ Still open

- **How the web address should be said.** Candidates generated as
  `assets/voiceover/nz-v1…v6.mp3`: "dot N Z" (in v7 now), "dot N.Z.",
  "dot en zed", "dot NZ", "dot N, Z.", and **"Just search Bin Sparkle."**
  That last one is worth serious thought — nobody types a web address they
  heard in a video, and it stops asking the voice to say a domain at all.

---

## Version history

| v | Change | Why |
|---|---|---|
| v1 | First draft | — |
| v2 | Cut the stormwater line; cut "a cleaner from your own suburb" | The suburb claim **was false** — the rule controls which jobs a cleaner may take, not where they live. |
| v3 | Brand name added three times | It only appeared in the URL. |
| v4 | Kiwi-isms: letterbox, sorted, "eh" | Local nouns over slang. |
| v5 | "Yeah. Nobody does, eh." → **"Nobody ever does."**; URL as one word; slower but tighter gaps | The three fragments fought each other and didn't flow. |
| v6 | **Deodorising added** to beat 4; "It's not a quick hose down" dropped | The ad opens on smell and now closes on smell. |
| v7 | **Hamilton removed**; opening pitch swing halved and the gap closed | Reusable anywhere; the question→answer jump sounded unnatural. |
| v8 | Opening line → **"Do you know the last time you cleaned your bin?"**; every gap pulled in another 30% | Wiri: it makes more sense as a question, and the beats still sat too far apart. |
| v9 | **Terminal pitch rise** on the question | Wiri: make the tone go up at the end. Edge TTS's `--pitch` lifts a whole phrase evenly, which reads as a different speaker — a question rises at the END. Done by bending the tail with `rubberband` after generation. |
| v10 | **Trailing silence stripped from every clip**; rise strength raised to +800 cents; designed pauses reopened 50% | Wiri: "they all sound pretty much the same". They were identical — the ramp was being measured from the end of the FILE, and every clip carries ~0.8s of baked-in silence, so it bent nothing. See below. |

**⚠️ The v10 find, worth more than the fix it came from.** Edge TTS bakes
roughly **0.8 seconds of silence onto the end of every clip** — 9.6 seconds
across this 12-beat read. Two things followed from that:

1. Every designed pause was really *pause + 0.8s*. That is why the read kept
   sounding gappy through v5, v7 and v8 no matter how far the gaps were pulled
   in, and why nothing would go under 33 seconds.
2. The pitch ramp was positioned from the end of the FILE, so it landed
   entirely in that silence and bent nothing. Three "strengths" produced
   byte-identical audio. **The user heard it before the measurements showed
   it** — "they all sound pretty much the same" was a bug report.

Strip it first, and the same script runs **28 seconds with MORE space between
beats**, not less. `scratchpad/trim.sh` does it; the build calls it before
adding any designed pause. Anything built on this pipeline should trim first.

**On the v7 delivery fix:** beat 1 → beat 2 was `+18Hz` then `−8Hz` — a 26Hz
drop — with 0.45s of silence between, and the answer slowed to −10%. It read as
two different people. Now `+12Hz` → `−2Hz`, 0.25s gap, answer at normal speed.
The question still lifts; it just no longer falls off a cliff.

---

## Why this shape

- **Beat 1 is a question.** People answer it in their head before deciding
  whether to scroll. The answer is "never" — a small, private, slightly
  embarrassing admission, which is what keeps them watching.
- **Smell opens it and smell closes it.** Beat 2 is the problem you can smell
  from the letterbox; beat 4 is the bin left smelling fresh. Same sense, both
  ends — that's what makes it hang together rather than being a list.
- **Beats 1 and 5 are the same bin, same angle.** The transformation is the
  product. Everything else is explanation.
- **Beat 5 answers the objection nobody says out loud:** *how do I know they
  turned up and did it properly?*
- **The price goes last, and whole.** $25 is low enough that naming it closes
  rather than blocks.
- **"They", not "we", once a cleaner is doing the work.** The brand books it;
  a self-employed contractor does it. Not a line worth blurring.

---

## Sounding Kiwi

**The voice is the bigger lever; the words are the smaller one.** This is
`en-NZ-MollyNeural` — an actual New Zealand voice — which does more than any
word choice and removes the risk of an Australian voice sounding like it's
doing an impression.

In the script: **wheelie bin**, **letterbox**, **sorted**, **bucks**.
Local nouns, not slang — every one is a word a person here uses without
thinking, and none of them trips the voice.

**"Eh" was tried in v4 and cut in v5.** Not because the voice fumbled it — it
said it as a proper word — but because the line around it ("Yeah. Nobody does,
eh.") was three fragments fighting each other.

**No Māori words.** That's the pipeline's own hard rule: Edge TTS mispronounces
them, and a butchered word does the opposite of what it was put there to do.

---

## How it was made conversational

1. **Contractions everywhere** — "it's", "you'll", "that's".
2. **Short bursts, not sentences.** Full stops are how you buy a breath.
3. **Every line under 15 words**, most under 10.
4. **Lines end on one-syllable words** — bin, out, fresh, sorted, bin.
5. **No corporate verbs** and **no idioms** — TTS reads idioms literally.
6. **"Bucks", not "dollars"** — the one deliberately loose word. Easy to swap.

---

## Claims — every factual line, and where it comes from

| Line | True? | Source |
|---|---|---|
| "book in two minutes" | ✅ | Booking form is location → details → plan/date. |
| "they scrub it out, inside and out" | ✅ | Contractors clean to standard, inside and out. |
| "then deodorise it, so it's left smelling fresh" | ✅ | Required by the contractor agreement ("smelling fresh / sanitised"), on the `/standards` kit list, confirmed by the cleaner at wrap-up, and already asked of the customer on the rating page ("Did it smell fresh / deodorised?"). The cleaner picks the product; the standard is the result. |
| "you'll see photos, before and after" | ✅ | Both required before a job can be marked done. Since 2026-07-29 they are embedded in the done email as well as on the rating page. |
| "twenty-five bucks for one bin" | ✅ | One-off, 1 bin = $25 incl GST. |
| ~~"here in Hamilton"~~ | — | **Cut in v7.** No town is named now, so the ad runs anywhere without a re-record. |
| ~~"a cleaner from your own suburb"~~ | ❌ | **Cut in v2 — it was not true.** |

**Deliberately NOT claimed:** no "cancel anytime", no "satisfaction
guaranteed", no "same day", no cleaner-count or customer-count. None of those
are established, and an ad is a bad place to find out.

---

## Alternative opening, if beat 1 tests soft

> "There's one thing at your house nobody's ever cleaned."

Slower burn, more curiosity, better for a colder audience. Rest stays the same.
