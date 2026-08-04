# TikTok OAuth blocker — diagnosis & fix plan

> Written 2026-08-05, end of session. The TikTok app is fully configured but the
> OAuth connection is blocked by a TikTok scope/approval gate. This doc is the
> full evidence + the concrete fix for the next session.

## What works (verified live 2026-08-05 ~08:45 UTC)

- **Postiz moved to `https://postiz.binsparkle.nz`** — DNS-only A record in
  Cloudflare (`postiz` → `72.61.208.103`), Traefik cert, returns 307. Old
  `postiz.srv1178347.hstgr.cloud` still routes too.
- **Domain `binsparkle.nz` verified on TikTok** via DNS TXT
  (`tiktok-developers-site-verification=mLQsqn2TOUCypqGO2w7Km3Q8nEB3HtQS` on the
  root). Covers the `postiz` subdomain. TikTok confirmed "Your property has been
  verified".
- **TikTok app "Bin Sparkle" configured:** App ID `7669999780248422407`,
  client_key `awh1d34mv4ewxvmm`. Products: Login Kit, Content Posting API
  (**Direct Post enabled**), Display API, Share Kit. All six scopes
  added + saved: `user.info.basic`, `user.info.profile`, `video.upload`,
  `video.publish`, `video.list`, `user.info.stats`.
- **Login Kit redirect URI** registered: `https://postiz.binsparkle.nz/integrations/social/tiktok`.
- **App details** filled + saved: icon (1024×1024, `videos/binsparkle/assets/brand/app-icon-1024.png`), category Productivity, description, TOS `https://binsparkle.nz/terms`, privacy `https://binsparkle.nz/privacy`, platform Web, Web/Desktop URL `https://postiz.binsparkle.nz`.
- **Postiz has the creds:** `TIKTOK_CLIENT_ID` + `TIKTOK_CLIENT_SECRET` added to
  `/root/postiz/docker-compose.yml` (after `THREADS_APP_SECRET`), container
  recreated, env confirmed via `docker exec postiz printenv`. Backup at
  `docker-compose.yml.bak-*`.
- **Placeholder demo video** uploaded (a stand-in BinSparkle MP4) so the app
  saves — replace before submitting for review.

## The blocker (root cause, proven)

Postiz's TikTok authorize request sends **six** scopes. TikTok rejects the
request with `error=unauthorized_client&error_type=client_key` — but the
`client_key` is **not** the problem (the error label is misleading).

**Evidence (direct authorize-URL tests, not logged into TikTok):**

| Authorize URL scopes | Result |
|---|---|
| `user.info.basic, user.info.profile, video.upload, video.publish` (4) | ✅ TikTok shows its normal **login page** (app recognised) |
| `video.list, user.info.basic, video.publish, video.upload, user.info.profile, user.info.stats` (6 — what Postiz sends) | ❌ `unauthorized_client` instantly |

So **`video.list` + `user.info.stats`** are the trigger. They are added to the
app + saved, but TikTok won't let them through the OAuth until the app is
**approved for them** (app review). Adding the **Display API** product did NOT
change this — those scopes still need review.

The other four scopes (Login Kit + Content Posting API) are usable pre-review.

## What did NOT work (don't repeat)

1. **Dropping `video.list` + `user.info.stats` from the app.** Earlier note
   (prior session) said Postiz doesn't use them — **wrong**. Postiz's request
   requires all six. Dropping them just makes the OAuth fail differently.
2. **Adding the Display API product** to authorize those scopes — no effect.
3. **Sandbox mode** — toggled the app to Sandbox; no tester-add UI surfaced,
   and the docs hint Sandbox doesn't support Content Posting API anyway.
4. **Patching Postiz in the running container** — the scope list is not
   findable. Greps for `video.list`, `user.info.stats`, `tiktok`,
   `auth/authorize` across `/app` (incl. node_modules with a timeout) all
   return nothing. The backend dir PM2 reports (`/app/apps/backend`) reads
   empty via `ls`. The running image gives no handle to edit the scope list.

## The fix: custom Postiz image that drops the two scopes

The clean unblock: build a Postiz image whose TikTok provider requests only the
four working scopes. Then OAuth succeeds → connect → record a real demo →
submit for review (which approves the scopes for production) → revert to stock
Postiz.

### Step 0 — first check if it's configurable (10 min)

Before building, check whether the scope list is env/DB-configurable (would
avoid a custom image):

- Clone `gitroomhq/postiz-app`, grep the **source** for `video.list` /
  `user.info.stats` / the TikTok provider (file likely under
  `apps/backend/src/integrations/social/tiktok*` or `libraries/providers`).
- If the scopes come from an env var or a DB table column, set/clear it and
  recreate — no image build needed.

### Step 1 — build the custom image

1. Clone the repo, find the TikTok provider's scope definition.
2. Remove `video.list` + `user.info.stats` from the scope list (keep
   `user.info.basic, user.info.profile, video.upload, video.publish`).
3. `docker build` the image (tag e.g. `postiz-app:tiktok-4scope`).
4. On the VPS, edit `/root/postiz/docker-compose.yml`: change the `postiz`
   service `image:` from `ghcr.io/gitroomhq/postiz-app:latest` to the custom
   tag (or build on the VPS / push to a registry). `docker compose up -d postiz`.
5. Keep `TIKTOK_CLIENT_ID`/`TIKTOK_CLIENT_SECRET` in the env.

### Step 2 — connect + test

1. Postiz → Add Channel → TikTok → authorise `@binsparkle`. The 4-scope OAuth
   should now complete and redirect back.
2. ONE test post. It will publish **private (SELF_ONLY)** until review, and the
   5-posts/24hr pre-audit cap applies — don't fire several.

### Step 3 — record the real demo video

- Use **ShareX** (installed) to screen-record. TikTok's review requires the
  **complete end-to-end flow**: Add Channel → TikTok OAuth → compose a post in
  Postiz with a video → publish → the result on `@binsparkle`. The website
  domain shown (`postiz.binsparkle.nz`) must match the app's website URL.
- **Do not fake a success.** Reviewers check; a staged publish can get the app
  banned.

### Step 4 — submit for review

1. Replace the placeholder demo video with the real recording.
2. Paste the 1000-char explanation (in `scratch/tiktok-app-review-text.md`).
3. Remove the unused **Share Kit** product first (unused products delay review).
4. **Submit for review.** Review takes days–weeks. When approved, `video.list`
   + `user.info.stats` become usable.

### Step 5 — post-review

Revert the compose to stock `ghcr.io/gitroomhq/postiz-app:latest` + recreate.
All six scopes now work; public posting unlocks (subject to TikTok's separate
content-visibility audit — posts stay private until that passes too).

## Credentials / IDs (for the next session)

- TikTok app "Bin Sparkle": App ID `7669999780248422407`, client_key
  `awh1d34mv4ewxvmm`, client_secret in the Postiz compose (VPS-only).
- TikTok developer portal: https://developers.tiktok.com/app/7669999780248422407/
- Postiz: `https://postiz.binsparkle.nz` (login: Bitwarden "Postiz"). Compose on
  VPS at `/root/postiz/docker-compose.yml`. DB: `postiz-postgres` /
  `postiz-db-local` (pipe SQL over stdin; camelCase mangles under `-c`).
- Cloudflare zone `binsparkle.nz` (`1968c8aede9a0354aae0ae76aa32cdf7`) — DNS
  edits need the global key from `automation-template/.env`.

## Browser-debug setup (CDP) — how the dashboard was driven

Launch real Chrome with a debug port + persistent profile (login persists):

```powershell
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList @(
  "--remote-debugging-port=9222",
  "--user-data-dir=C:\Users\wirih\.chrome-debug-profile-meta",
  "--no-first-run","--no-default-browser-check",
  "https://developers.tiktok.com/app/7669999780248422407/")
```

Drive via Playwright `connectOverCDP('http://localhost:9222')` (Playwright is in
`aivideomaker/node_modules`; set `NODE_PATH`). Scripts used this session live in
`C:\Users\wirih\AppData\Local\Temp\opencode\meta-dash\*.cjs` (ephemeral). Each
script ends with `process.exit(0)` to disconnect **without** closing Chrome.

**Trap:** after many attach/detach cycles `connectOverCDP` starts timing out
(stale WS clients). Fix = restart Chrome: kill the `.chrome-debug-profile-meta`
chrome processes, relaunch with the flags above.
