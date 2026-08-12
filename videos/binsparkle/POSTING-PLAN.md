# Bin Sparkle — posting plan

> Verified against the **live** Postiz database + a Zernio key check on
> **2026-08-08 ~11:37 NZST**. This is the real state, not the local ledger
> (which can drift). Re-query before acting — see the commands at the bottom.

---

## 1. What's scheduled right now (live Postiz)

- **36 posts PUBLISHED** Aug 2–7 across FB (Bin Sparkle page), IG (zypri),
  Threads (binsparklenz). Cadence has been ~2 concepts/day at 09:00 + 18:00 NZST.
- **3 posts still QUEUED** — the "Reviews" batch, due **today (Aug 8) 18:00 NZST**,
  one per channel. These are the next to publish.
- **Nothing scheduled after that.** The queue is empty from **Aug 9** onward →
  that's the content gap the comeback fills.

The local file `posts.md` and the live DB agree on shape; the DB is the truth.

---

## 2. Platforms — what's ready, what's blocked

| Platform | Tool | Channel | Status |
|---|---|---|---|
| Facebook | Postiz | Bin Sparkle page | ✅ healthy (many recent PUBLISHED) |
| Instagram | Postiz | zypri | ✅ healthy |
| Threads | Postiz | binsparklenz | ✅ healthy (token expires 2026-09-27) |
| TikTok | Zernio | @binsparkle (`6a75223c…`) | ✅ ready — key in `automation-template/.env`, `canPost: true` (verified 2026-08-08). Token refreshes today; watch for a 401 on first post. |
| LinkedIn | Zernio | Bin Sparkle page (`6a757a4b…`) | ✅ ready — same key, token valid to 2026-10-06. Purpose-built professional slide ready: `final/linkedin-clean-4x5.png` |

**Postiz = ready now** for FB / IG / Threads. **Zernio = ready now** for TikTok + LinkedIn
(key was added to `automation-template/.env` on 2026-08-08; health check returned both
accounts `healthy`, `canPost: true`).

**Where the Zernio key lives:** `automation-template/.env` → `ZERNIO_API_KEY`
(`sk_` + 64 hex). The wrapper `scripts/post-to-zernio.mjs` reads it from there.
Documented in `automation-template/zernio.md` (Auth) and this repo's
`videos/binsparkle/MANIFEST.md` §10. If it ever goes missing, it's in Bitwarden.

---

## 3. The comeback — readiness

| Item | Ready? |
|---|---|
| Video (MP4, yuv420, 27s, 9:16) | ✅ `renders/binsparkle/comeback/final/comeback-video.mp4` |
| Carousel (6 vertical slides) | ✅ `final/slide-1..6-*.png` |
| Postiz channels connected | ✅ |
| Zernio key (TikTok + LinkedIn) | ✅ `automation-template/.env` (verified 2026-08-08, both accounts `canPost: true`) |
| Per-platform captions | ❌ not written yet |

---

## 4. The plan — slot the comeback as the next concept

**Proposed publish:** **Aug 9 (tomorrow)** in the established slots, so today's
Reviews batch goes first and the comeback opens the next day. Two slots:
09:00 and 18:00 NZST.

**Per-platform shape** (the established hybrid model — same gag, native format):

| Platform | Gets | Why |
|---|---|---|
| Facebook | the **6-slide carousel** | FB favours swipeable decks |
| Instagram | the **video** (27s) | IG favours video; 27s is well under the limit |
| Threads | **slide 6 only** ("Every bin deserves a comeback") + one line | Threads is single-image-friendly |
| TikTok | the **video** | 9:16 / 27s is ideal; the wrapper handles the `tiktokSettings` block |
| LinkedIn | the **purpose-built professional slide** (`final/linkedin-clean-4x5.png`, real photo of a contractor washing a bin) | LinkedIn wants credibility over cartoon whimsy — this slide rates 8/10 fit vs 3–6/10 for the comeback cartoon slides |

---

## 5. Steps to execute (when you say go)

1. **Captions** — I draft four (FB warm/medium, IG energetic + hashtags, Threads
   short/plain, TikTok energetic + hashtags) through the copy expert
   (`script-and-copy.md`), you approve. Bar = `SCRIPT-fullcare.md`.
2. **Config(s)** — build the Postiz JSON config(s) (`npm run post`) and, when the
   key's in, the Zernio config (`npm run post:zernio`).
3. **Post** — `npm run post -- --config=<postiz.json>` for FB/IG/Threads.
   `npm run post:zernio -- --config=<tiktok.json>` for TikTok (and LinkedIn if wanted).
4. **Verify** — re-query Postiz until the rows flip `QUEUE → PUBLISHED` with a
   `releaseURL`; poll Zernio `GET /v1/posts/<id>` until `status=published`.
   Capture each URL into `posts.md`.

---

## 6. Decisions I need from you

1. **Publish date** — Aug 9 (tomorrow) as proposed, or a different slot?
2. **Which platforms** — all four (FB + IG + Threads + TikTok), add LinkedIn too, or fewer?
3. **Captions** — want me to draft via the copy expert for your approval, or will
   you write them?

(The Zernio key question is resolved — it's in `automation-template/.env` and both
accounts are `canPost: true`.)

---

## Re-verify commands (run before posting — the DB is the truth)

```powershell
# What's in the queue right now (raw UTC publishDate is the truth — ignore to_char NZ conversion, it's off by the tz-type quirk):
$sql = @'
select p.state, p."publishDate", i.name, json_array_length(p.image::json) as imgs, left(p.content,80)
from "Post" p left join "Integration" i on p."integrationId"=i.id
where p."deletedAt" is null and p.state in ('PUBLISHED','QUEUE')
order by p."publishDate" desc limit 20;
'@
$sql | ssh -i "$env:USERPROFILE\.ssh\hostinger_vps" root@72.61.208.103 'docker exec -i postiz-postgres psql -U postiz-user -d postiz-db-local'
```
