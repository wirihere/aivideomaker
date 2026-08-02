# BinSparkle — posts ledger

> One row per live post. Update whenever something goes live. **Ask the user
> before any post actually goes public** — it's a public action.
>
> Posting mechanism: documented in `automation-template/postiz.md` (Public
> API recipe, run live on the VPS). Do not post from memory — re-check the
> playbook.
>
> **Source of truth for past posts:** the Postiz Postgres DB on the VPS
> (`postiz.srv1178347.hstgr.cloud`). Query it (do not trust this file alone
> — it can drift):
> ```powershell
> "select p.""createdAt"", i.name, json_array_length(p.image::json) as imgs, left(p.content,80), p.""releaseURL"" from ""Post"" p left join ""Integration"" i on p.""integrationId""=i.id where p.state='PUBLISHED' and p.""deletedAt"" is null order by p.""createdAt"" desc;" | ssh -i "$env:USERPROFILE\.ssh\hostinger_vps" root@72.61.208.103 'docker exec -i postiz-postgres psql -U postiz-user -d postiz-db-local'
> ```

## Published posts

Times shown in NZST (UTC+12). Verified against Postiz Postgres 2026-08-03.

| date (NZ) | platform | channel | format | imgs | copy summary | URL | ref slug |
|---|---|---|---|---|---|---|---|
| 2026-08-02 11:37 | Facebook | Local Client Finder | text | 0 | "Test post — please disregard." | facebook.com/1307860934890935/posts/1307860914890937 | — |
| 2026-08-02 22:42 | Facebook | Local Client Finder | carousel | 5 | **Recruit** — "looking for a side hustle? Bin Sparkle needs bin cleaners. 75% of every job is yours… Apply: binsparkle.nz/contractor/apply" | facebook.com/1307860934890935/posts/1308244698185892 | `?ref=lcf` |
| 2026-08-02 23:50 | Facebook | Local Client Finder | carousel | 5 | **How-it-works** — "here's how Bin Sparkle works, end to end: a customer books, you claim the job, you keep 75%… Apply: binsparkle.nz/contractor/apply" | facebook.com/1307860934890935/posts/1308286148181747 | `?ref=lcf` |
| 2026-08-03 00:18 | Facebook | Local Client Finder | carousel | 5 | **Customer** — "if your bin is the one the neighbours dread on bin day, we will sort it. We pressure-wash and deodorise it at your place. Book a clean: binsparkle.nz" | facebook.com/1307860934890935/posts/1308332808177081 | `?ref=lcf` |
| 2026-08-03 00:52 | Facebook | Bin Sparkle (page `1011356651724878`) | carousel | 5 | **Customer** — "if opening your bin makes you gag, we will sort it. We scrub every wall and the base — smell gone, bin clean. Book a clean: binsparkle.nz" | facebook.com/1011356651724878/posts/1011356638391546 | — |

### Notes

- **Carousel images** are hosted on the Postiz VPS under
  `https://postiz.srv1178347.hstgr.cloud/uploads/2026/08/02/*.png`. They are
  NOT in this repo. To pull them down for reuse or inspection, query the
  `image` column for the full JSON array of paths, then download each.
- **Text-size feedback (2026-08-03):** the user says the carousel text could
  be a little bigger for mobile readability. Applies to the slide template
  across all 4 carousels. Open thread.
- **The recruit + how-it-works posts** both point at `binsparkle.nz/contractor/apply?ref=lcf`
  — the `ref=lcf` slug lets the apply form attribute signups to the Local
  Client Finder channel.
- **One error post** (`cmsb04smq0004lj65tju4mqgq`, 2026-08-01 23:27 UTC) was
  deleted; it failed before publishing. Likely the Facebook identity-checkpoint
  (code 368) documented in `automation-template/postiz.md`.

## How to add a row

Fill every column. If you don't know a value, write `unknown` and flag it —
don't leave a cell blank, a blank cell looks like "not applicable" rather
than "not known."

- **date (NZ):** the day it went live in New Zealand time.
- **platform:** Facebook / Instagram / Threads / LinkedIn / TikTok.
- **channel:** the page or account name + its numeric id if known.
- **format:** text / single image / carousel / album / video / story / reel.
- **imgs:** image count (0 for text-only).
- **copy summary:** a short paraphrase — full copy lives in Postiz, not here.
- **URL:** the `releaseURL` from Postiz (the public post URL).
- **ref slug:** the `?ref=` parameter on any link in the post, if used.

## Pre-post checklist

1. **Ask the user first** — every post is a public action.
2. Re-read `automation-template/postiz.md` for the current posting recipe.
3. Confirm the channel id against the playbook (don't post from memory).
4. After the post confirms, capture the `releaseURL` **immediately** — add the row before doing anything else.
5. Re-query Postiz (command above) to verify `state=PUBLISHED` and grab the real URL.
