# TikTok dev app — review submission text

> Saved 2026-08-04. For the TikTok app-review submission (the step that unlocks
> PUBLIC posting). Do NOT submit until the integration is connected + a test post
> done — the demo video is also required and must show the real flow.

## App details (fill in the dev portal)
- **Ownership:** Individual
- **App name:** Bin Sparkle
- **App icon (1024×1024):** `videos/binsparkle/assets/brand/app-icon-1024.png`
- **Category:** Productivity (or closest to Apps & Software)
- **Description (≤120 chars):** `Bin Sparkle publishes our bin-cleaning tips, before-and-afters and booking info from binsparkle.nz to TikTok.`
- **Terms of Service URL:** `https://binsparkle.nz/terms`
- **Privacy Policy URL:** `https://binsparkle.nz/privacy`
- **Platforms:** Web

## Products
- **Login Kit** — redirect URI: `https://postiz.binsparkle.nz/integrations/social/tiktok` (after the postiz.binsparkle.nz migration)
- **Content Posting API** — enable **Direct Post** (not just Upload/draft)

## Scopes
Postiz's TikTok authorize request sends **all six** (verified from the actual
authorize URL this session) — keep ALL of them on the app:
- `user.info.basic`, `user.info.profile`, `video.upload`, `video.publish`,
  `video.list`, `user.info.stats`

**CORRECTION (2026-08-05):** an earlier version of this note said to drop
`video.list` + `user.info.stats`. That was wrong — Postiz requires them.
Dropping them breaks the OAuth. They're added + saved.

**Catch:** `video.list` + `user.info.stats` are rejected (`unauthorized_client`)
until the app passes TikTok review — even though they're added. See
`docs/tiktok-oauth-blocker-2026-08-05.md` for the workaround (custom Postiz
image that drops those two from the *request* so the OAuth works pre-review,
then revert after approval).

`video.create` (mentioned in old Postiz docs) is NOT addable in the current
dashboard and Postiz doesn't request it — ignore it.

## "Explain how each product and scope works" (≤1000 chars)
```
Bin Sparkle is a NZ bin-cleaning business. We use a self-hosted scheduler (Postiz) to publish our own first-party brand videos — cleaning tips, before/after results and service info — to our TikTok account @binsparkle. Only our team uses this; it is not a multi-user platform.

• Login Kit — lets our owner connect @binsparkle to Postiz via OAuth so it can post on our behalf.
• Content Posting API (Direct Post) — publishes our scheduled brand videos to @binsparkle.
• user.info.basic / user.info.profile — reads our connected account's name and avatar for display.
• video.upload — uploads our brand video files.
• video.create — creates the video post with our caption.
• video.publish — publishes it at the scheduled time.

All content is original marketing we create for Bin Sparkle. We don't collect, display, or redistribute other users' content, and we don't share TikTok data with anyone.
```

## Domain verification
- Method: **Domain (DNS record)** — enter `binsparkle.nz` (root). TikTok gives a TXT → add in Cloudflare DNS on binsparkle.nz → Verify. Covers `postiz.binsparkle.nz` automatically.
- Why: TikTok uses pull_by_url (pulls media from a URL) so the serving domain must be verified. Postiz serves media from `postiz.binsparkle.nz` (under verified binsparkle.nz).

## Demo video (record AFTER connecting + test post)
Show, end-to-end: Add Channel → TikTok (Login Kit OAuth) → compose a post in Postiz with a video → publish (Content Posting API: video.upload → video.create → video.publish) → the result on @binsparkle. Every product + scope must be visibly demonstrated. The domain shown must match the website URL (postiz.binsparkle.nz).
