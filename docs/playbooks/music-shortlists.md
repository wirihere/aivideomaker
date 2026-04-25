# Playbook — Music Shortlists per Stack

Each stack has a curated shortlist of 3-4 pre-vetted tracks. When running a Website-to-Video for a new brand, we don't open Pixabay and search — we present the matching stack's shortlist to the website owner and let them pick before we lock the score.

Why shortlists not search: search results change daily, the user has taste they want to exercise (see [music.md](music.md)'s "ask user first" rule), and a curated shortlist is a faster, more confident choice than "go listen to 50 tracks on Pixabay".

---

## How to use a shortlist

1. Identify the stack (see [stacks.md](stacks.md))
2. Open this playbook, find the matching stack section
3. Send the shortlist to the website owner — copy-paste the audition table for that stack
4. Owner picks (or asks for more variations — fall through to a custom search)
5. Update [DESIGN.md](../../DESIGN.md) with the chosen track filename
6. Wire it into the composition with the stack's default volume

Format to send to owner:

> Hey — for your video we'd recommend our [STACK NAME] stack. It feels [paragraph from stacks.md]. Here are 3-4 music tracks we've tested that fit this stack. Have a listen and let us know which one you'd like — or if none feel right, tell us what's missing and we'll find more.
>
> 1. [Track 01 name] — [character + mood] — [audition link]
> 2. [Track 02 name] — [character + mood] — [audition link]
> ...

Audition links: paste the Pixabay source URL from the manifest below.

---

## Stack 1 — Warm Community

Pure-stack vibe: cream-and-natural, hand-knit, neighbourhood. Acoustic instruments only. No heavy percussion. No vocal samples. Mid-tempo (80-100 BPM). Tracks should *welcome* not *energise*.

### Track 01 — Acoustic Community (DEFAULT)

| Field | Value |
|---|---|
| File | `assets/music/kindred-bed.mp3` |
| Pixabay | https://cdn.pixabay.com/audio/2026/03/11/audio_ec7df85a4e.mp3 |
| Search | `gentle acoustic guitar community warm` |
| Duration | 213s (use first 29.5s) |
| Character | Gentle acoustic guitar fingerstyle, soft pad underneath, mid-tempo |
| Best for | Any Warm Community comp; default when in doubt |
| First proven on | Kindred 2026-04-25 |

### Track 02 — *(fetching...)*

| Field | Value |
|---|---|
| File | `assets/music/warm-02-folk.mp3` |
| Search | `warm acoustic folk inspirational` |

### Track 03 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/warm-03-piano.mp3` |
| Search | `hopeful acoustic piano reflective` |

### Track 04 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/warm-04-fingerstyle.mp3` |
| Search | `gentle fingerstyle guitar uplifting` |

---

## Stack 2 — Kinetic Pop

Pure-stack vibe: scroll-stopping. Synth-driven, drum-heavy, 110-130 BPM. The kick should land on every transition. Vocals OK if non-committal (no clear lyrics). Tracks should *grab* not *welcome*.

### Track 01 — *(fetching...)*

| Field | Value |
|---|---|
| File | `assets/music/kinetic-01-motivational.mp3` |
| Search | `upbeat electronic motivational energetic` |

### Track 02 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/kinetic-02-trending.mp3` |
| Search | `tiktok trending energetic beat` |

### Track 03 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/kinetic-03-build.mp3` |
| Search | `epic build drop pop dance` |

---

## Stack 3 — Documentary Considered

Pure-stack vibe: serious, evidence-based. Cinematic strings, piano, restrained percussion. 60-80 BPM. No drums-on-beat — instrumental drama only. Tracks should *anchor* not *push*.

### Track 01 — *(fetching...)*

| Field | Value |
|---|---|
| File | `assets/music/documentary-01-strings.mp3` |
| Search | `cinematic piano strings documentary` |

### Track 02 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/documentary-02-slow-build.mp3` |
| Search | `emotional piano slow build cinematic` |

### Track 03 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/documentary-03-orchestral.mp3` |
| Search | `reflective orchestral inspirational documentary` |

---

## Stack 4 — Quiet Premium

Pure-stack vibe: hushed. Ambient pad, sparse piano, occasional bell or felt-piano. 50-70 BPM, often beatless. No vocals at all. Volume default `0.12` — barely there. Tracks should *frame silence* not *fill it*.

### Track 01 — *(fetching...)*

| Field | Value |
|---|---|
| File | `assets/music/premium-01-ambient.mp3` |
| Search | `ambient piano minimal atmospheric` |

### Track 02 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/premium-02-sparse.mp3` |
| Search | `cinematic sparse quiet emotional` |

### Track 03 — *(to fetch)*

| Field | Value |
|---|---|
| File | `assets/music/premium-03-meditation.mp3` |
| Search | `meditation minimal calm atmospheric` |

---

## Adding a new track to a shortlist

When a new track lands and earns its keep on a real render:

1. Audition by playing the first 30s.
2. If it fits the stack's vibe (use the "Pure-stack vibe" paragraph as the test), promote it into the shortlist.
3. Fill in the table — file path, Pixabay URL, search term, duration, character, best-for.
4. Run a render with it as the bed; if the render reads as cohesive, mark "First proven on: [project]".
5. If a track DOESN'T fit, don't keep it in the assets folder. Delete and try a different search term.

Don't bloat the shortlist beyond 4-5 tracks per stack — the website owner shouldn't have to sift. Curation is the value.

---

## Custom searches

If the website owner doesn't pick from the shortlist:

1. Ask what's missing ("too sad" / "too upbeat" / "want piano not guitar")
2. Translate to Pixabay search keywords (see [music.md](music.md) for keyword vocabulary)
3. Fetch 2-3 alternatives via `node scripts/fetch-pixabay-music.mjs "<query>" <name>.mp3`
4. Audition + present
5. If a winner emerges and fits a stack, promote into THIS shortlist for next time

The shortlists grow over time. Every brand we ship leaves the shortlist a little better curated.
