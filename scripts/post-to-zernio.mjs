// Post to a Zernio-connected social account (TikTok or LinkedIn) in one command.
// TikTok = direct video publish (Zernio's app is approved). LinkedIn = text or
// text + image (no special settings needed; the connected account posts as itself).
//
// Usage:
//   npm run post:zernio -- --config=<config.json>
//
// Config:
// {
//   "platform": "linkedin",                 // "tiktok" (default) | "linkedin"
//   "caption":  "post text",
//   "media":    "https://.../x.mp4",        // OPTIONAL for linkedin (text post if omitted);
//                                           //   URL or local path. TikTok requires it.
//   "schedule": "now",                      // "now", or local time "YYYY-MM-DDTHH:mm:ss"
//   "timezone": "Pacific/Auckland",         // IANA tz (default Pacific/Auckland)
//   "accountId": "6a75..."                  // optional, default = platform's Bin Sparkle account
// }

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, "..");
const REPOS = path.join(REPO, "..");

const ACCOUNTS = {
  tiktok: "6a75223cd0fe733d1ae1e045",   // @binsparkle on Zernio
  linkedin: "6a757a4bd0fe733d1aef10f0", // Bin Sparkle LinkedIn page on Zernio
};
const BASE = "https://zernio.com/api/v1";
const DEFAULT_TZ = "Pacific/Auckland";

function loadKey() {
  if (process.env.ZERNIO_API_KEY) return process.env.ZERNIO_API_KEY;
  const candidates = [
    path.join(REPOS, "automation-template", ".env"),
    path.join(REPOS, "zernio-docs", ".env"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const line = fs.readFileSync(p, "utf8").split("\n").find(l => l.startsWith("ZERNIO_API_KEY="));
    if (line) return line.replace(/^ZERNIO_API_KEY=/, "").trim();
  }
  throw new Error("ZERNIO_API_KEY not found (set env var, or add to automation-template/.env or zernio-docs/.env)");
}
const KEY = loadKey();

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

if (!flags.config) {
  console.error(`post-to-zernio — post to TikTok or LinkedIn via Zernio

Usage:
  npm run post:zernio -- --config=<config.json>

Config:
  platform   "tiktok" (default) | "linkedin"
  caption    post text
  media      public URL or local path (OPTIONAL for linkedin; required for tiktok)
  schedule   "now", or local time "YYYY-MM-DDTHH:mm:ss"
  timezone   IANA tz (default Pacific/Auckland)
  accountId  optional (default = @binsparkle for the chosen platform)`);
  process.exit(2);
}

const cfg = JSON.parse(fs.readFileSync(path.resolve(flags.config), "utf8"));
const platform = cfg.platform || "tiktok";
const accountId = cfg.accountId || ACCOUNTS[platform];
if (!accountId) throw new Error(`No default accountId for platform "${platform}"; set one in config`);
const timezone = cfg.timezone || DEFAULT_TZ;
const isNow = (cfg.schedule || "now") === "now";
const media = cfg.media || cfg.video; // video = legacy alias

async function resolveMedia(mediaPath) {
  if (/^https?:\/\//i.test(mediaPath)) {
    console.log(`▶ media: URL passthrough  ${mediaPath}`);
    return { type: mediaPath.match(/\.(mp4|mov|webm)$/i) ? "video" : "image", url: mediaPath };
  }
  const abs = path.resolve(mediaPath);
  if (!fs.existsSync(abs)) throw new Error(`file not found: ${abs}`);
  const filename = path.basename(abs);
  const isVideo = /\.(mp4|mov|webm)$/i.test(filename);
  const contentType = isVideo ? "video/mp4" : "image/jpeg";
  const size = fs.statSync(abs).size;
  console.log(`▶ media: uploading ${filename} (${(size / 1048576).toFixed(1)} MB) via presign…`);

  const presign = await fetch(`${BASE}/media/presign`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType, size }),
  });
  if (!presign.ok) throw new Error(`presign ${presign.status}: ${await presign.text()}`);
  const { uploadUrl, publicUrl } = await presign.json();

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: fs.readFileSync(abs),
  });
  if (!put.ok) throw new Error(`upload ${put.status}: ${await put.text()}`);
  console.log(`  uploaded → ${publicUrl}`);
  return { type: isVideo ? "video" : "image", url: publicUrl };
}

const body = {
  content: cfg.caption,
  platforms: [{ platform, accountId }],
};
if (media) {
  body.mediaItems = [await resolveMedia(media)];
} else if (platform === "tiktok") {
  throw new Error("TikTok posts require media (video). Add \"media\" to the config.");
}
if (platform === "tiktok") {
  body.tiktokSettings = {
    privacy_level: "PUBLIC_TO_EVERYONE",
    allow_comment: true,
    allow_duet: true,
    allow_stitch: true,
    content_preview_confirmed: true,
    express_consent_given: true,
  };
}
if (isNow) body.publishNow = true;
else { body.scheduledFor = cfg.schedule; body.timezone = timezone; }

console.log(`▶ ${platform} · ${isNow ? "publishing now" : `scheduling ${cfg.schedule} ${timezone}`}${media ? "" : " · text only"}`);
const res = await fetch(`${BASE}/posts`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const data = await res.json();
if (!res.ok) { console.error(`✗ Zernio ${res.status}:`, JSON.stringify(data, null, 2)); process.exit(1); }

const post = data.post || data;
console.log(`✓ Zernio post ${post._id}  status=${post.status}`);
