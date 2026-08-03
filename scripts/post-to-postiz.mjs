// Post files (images or videos) to Postiz channels in one command.
//
// Reads a JSON config, SCPs files to the VPS, uploads via Postiz API,
// and creates the post. The whole pipeline in one command.
//
// Usage:
//   npm run post -- --config=<config.json>
//
// Config format:
// {
//   "schedule": "2026-08-04T06:00:00.000Z",   // ISO UTC, or "now"
//   "files": ["renders/binsparkle/video.mp4"],
//   "channels": ["fb", "ig", "threads"],
//   "fb_caption": "caption with emojis 🧹",
//   "ig_caption": "longer with #hashtags",
//   "threads_caption": "short version",
//   "threads_file": 0                          // file index for Threads (single). Default 0
// }

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import os from "os";

const CHANNELS = {
  fb:      { id: "cms8vj1610001qf6t4h4j9k43", settings: { __type: "facebook" } },
  ig:      { id: "cms8widbo0003qf6t241bd4t4", settings: { __type: "instagram", post_type: "post" } },
  threads: { id: "cms92cb2w0001lj65n9oikmn7", settings: { __type: "threads" } },
  lcf:     { id: "cmsazp0rq0003lj65eao4e1mh", settings: { __type: "facebook" } },
};

const SSH_KEY = path.join(os.homedir(), ".ssh", "hostinger_vps");
const VPS = "root@72.61.208.103";
const REMOTE = "/tmp/postiz-upload";

// --- Parse args ---
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

if (!flags.config) {
  console.error(`post-to-postiz — post to Postiz channels in one command

Usage:
  npm run post -- --config=<config.json>

Config:
  schedule     ISO UTC or "now"
  files        local paths to upload
  channels     "fb", "ig", "threads", "lcf" (or array of these)
  fb_caption   caption for Facebook
  ig_caption   caption for Instagram (optional, falls back to fb_caption)
  threads_caption  caption for Threads (optional, falls back to fb_caption)
  threads_file index into files[] for Threads single post (default 0)`);
  process.exit(2);
}

const config = JSON.parse(fs.readFileSync(path.resolve(flags.config), "utf8"));
const schedule = config.schedule || "now";
const type = schedule === "now" ? "now" : "schedule";
const date = schedule === "now" ? new Date().toISOString() : schedule;
const channels = Array.isArray(config.channels) ? config.channels : [config.channels];
const files = config.files || [];
const threadsFile = config.threads_file ?? 0;

if (!files.length) { console.error("✗ no files"); process.exit(2); }

// --- Build post template (captions inline, images as placeholders) ---
const template = {
  type, date, shortLink: false, tags: [],
  posts: channels.map(ch => {
    const c = CHANNELS[ch];
    if (!c) throw new Error(`Unknown channel: ${ch}`);
    const caption = config[`${ch}_caption`] || config.fb_caption || "";
    const settings = config.ig_post_type && ch === "ig"
      ? { ...c.settings, post_type: config.ig_post_type }
      : c.settings;
    return {
      integration: { id: c.id },
      value: [{ content: caption, image: ch === "threads" ? "__ONE__" : "__ALL__" }],
      settings,
    };
  }),
};

console.log(`▶ post: ${files.length} file(s) → ${channels.join(", ")} (${type})`);

// --- SCP files to VPS ---
const ssh = (cmd) => execFileSync("ssh", ["-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VPS, cmd], { encoding: "utf8", timeout: 30000 });
const scp = (local, remote) => execFileSync("scp", ["-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", local, `${VPS}:${remote}`], { encoding: "utf8", timeout: 60000 });

ssh(`mkdir -p ${REMOTE}`);
const fileNames = files.map(f => {
  const abs = path.resolve(f);
  const name = path.basename(abs);
  console.log(`  → ${name}`);
  scp(abs, `${REMOTE}/${name}`);
  return name;
});

// --- Write template + bash script to VPS ---
const tmpDir = path.join(os.tmpdir(), "postiz");
fs.mkdirSync(tmpDir, { recursive: true });

// Template JSON
fs.writeFileSync(path.join(tmpDir, "template.json"), JSON.stringify(template, null, 2));
scp(path.join(tmpDir, "template.json"), `${REMOTE}/template.json`);

// Bash script (upload + inject + post)
const script = `#!/bin/bash
set -e
KEY=$(echo 'select "apiKey" from "Organization";' | docker exec -i postiz-postgres psql -U postiz-user -d postiz-db-local -t -A)
BASE=$(docker inspect postiz --format '{{range $k, $v := .NetworkSettings.Networks}}{{if eq $k "root_default"}}http://{{$v.IPAddress}}:3000/public/v1{{end}}{{end}}')
DIR="${REMOTE}"

echo "Base: $BASE"

${fileNames.map((name, i) => `
echo "  Uploading ${name}..."
R=$(curl -s -X POST "$BASE/upload" -H "Authorization: $KEY" -F "file=@$DIR/${name}")
O=$(echo "$R" | jq '{id, path}')
if [ -z "$O" ] || [ "$O" = "null" ]; then echo "FAILED: $R"; exit 1; fi
echo "  ${name} OK"
OBJ_${i}="$O"`).join("")}

# Build image arrays
ALL_IMG=$(printf '${fileNames.map(() => '%s\\n').join('')}' ${fileNames.map((_, i) => `"$OBJ_${i}"`).join(" ")} | jq -s '.')
ONE_IMG=$(echo "$OBJ_${threadsFile}" | jq '[.]')

# Inject into template
jq --argjson all "$ALL_IMG" --argjson one "$ONE_IMG" \\
  '(.posts[].value[].image |= if . == "__ALL__" then $all elif . == "__ONE__" then $one else . end)' \\
  "$DIR/template.json" > "$DIR/final.json"

echo "=== Creating post ==="
curl -s -X POST "$BASE/posts" -H "Authorization: $KEY" -H "Content-Type: application/json" -d @"$DIR/final.json" | jq -r '.[] | "\\(.postId) → \\(.integration)"'
echo "=== Done ==="
`;

fs.writeFileSync(path.join(tmpDir, "run.sh"), script);
scp(path.join(tmpDir, "run.sh"), `${REMOTE}/run.sh`);

// --- Run ---
console.log("  posting...");
try {
  const out = ssh(`sed -i 's/\\r$//' ${REMOTE}/run.sh && bash ${REMOTE}/run.sh`);
  console.log(out);
} catch (e) {
  console.error("✗", e.stderr || e.message);
  process.exitCode = 1;
}
