# BinSparkle — posts ledger

> One row per live post. Update whenever something goes live. **Ask the user
> before any post actually goes public** — it's a public action.
>
> Posting mechanism: documented in `automation-template/postiz.md` (Public
> API recipe, run live on the VPS). Do not post from memory — re-check the
> playbook.

| date (NZ) | platform | channel / handle | format | assets used | copy / caption | post id or URL | result | notes |
|---|---|---|---|---|---|---|---|---|
| 2026-08-02 | Facebook | Local Client Finder (page `222932881901146`) | text | — | "Test post — please disregard" | id tail `…1307860914890937` | ✅ published | Test of the Postiz Public API pipeline. Confirmed end-to-end. Recorded in `automation-template/postiz.md`. |
| 2026-08-0? | Facebook | Local Client Finder | carousel (7 images) | `clean-01` … `clean-07` from `videos/binsparkle/assets/` | unknown | **unknown** | ⚠️ unverified | User reports it was posted via Postiz. No record in any repo, no post id captured. **If posted via the Postiz web UI**, the record lives only in the Postiz Postgres DB on the VPS — unreachable from a dev session. Get the URL or date from the user to confirm. |

## How to add a row

Fill every column. If you don't know a value, write `unknown` and flag it —
don't leave a cell blank, a blank cell looks like "not applicable" rather
than "not known."

- **date (NZ):** the day it went live in New Zealand time.
- **platform:** Facebook / Instagram / Threads / LinkedIn / TikTok.
- **channel / handle:** the page or account name + its numeric id if known.
- **format:** text / single image / carousel / album / video / story / reel.
- **assets used:** file paths in this repo, e.g. `videos/binsparkle/assets/clean-03-scrub.png`.
- **copy / caption:** the exact text that went out, or a path to the file holding it.
- **post id or URL:** the platform's identifier — capture it the moment the post confirms.
- **result:** ✅ published / ❌ failed (with the error) / ⏳ scheduled.
- **notes:** anything a future session needs to know — A/B variant, audience targeting, spend.

## Pre-post checklist

1. **Ask the user first** — every post is a public action.
2. Re-read `automation-template/postiz.md` for the current posting recipe.
3. Confirm the channel id against the playbook (don't post from memory).
4. After the post confirms, capture the post id / URL **immediately** — add the row before doing anything else.
