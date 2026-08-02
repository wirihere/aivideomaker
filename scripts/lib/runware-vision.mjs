// Minimal Runware vision client — the `caption` task type (image + prompt → text).
// No SDK dependency: raw fetch (Node 22+ has global fetch). Auth via Bearer key.
//
// Key resolution: process.env.RUNWARE_API_KEY first, then the shared secrets file
// at automation-template/.env (the user's canonical secrets home).
//
// Images are downscaled to a max long edge (default 1280) and re-encoded as JPEG
// before sending — vision models analyse at limited resolution anyway, and this
// keeps payloads small, fast, and cheap. Uses the project's bundled ffmpeg.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { getFfmpegPath } from "./ffmpeg-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/lib/ → aivideomaker root
const projectRoot = path.resolve(__dirname, "..", "..");

export function loadRunwareKey() {
  if (process.env.RUNWARE_API_KEY) return process.env.RUNWARE_API_KEY;
  const candidates = [
    path.join(projectRoot, ".env"),
    path.join(process.env.USERPROFILE || "", "repos", "automation-template", ".env"),
  ];
  for (const f of candidates) {
    try {
      if (!fs.existsSync(f)) continue;
      const m = fs.readFileSync(f, "utf8").match(/^RUNWARE_API_KEY=(.+)$/m);
      if (m) {
        const v = m[1].trim().replace(/^["']|["']$/g, "");
        if (v) return v;
      }
    } catch {}
  }
  return null;
}

// Downscale to a max long edge, re-encode JPEG → data URI. Returns {dataUri, bytes, w, h}.
export async function imageToDataUri(imgPath, maxEdge = 1280) {
  const abs = path.resolve(imgPath);
  const tmp = `${abs}.judge-${process.pid}.jpg`;
  const ff = await getFfmpegPath();
  const vf = `scale='min(${maxEdge},iw)':'min(${maxEdge},ih)':force_original_aspect_ratio=decrease`;
  await new Promise((res, rej) => {
    const p = spawn(ff, ["-y", "-loglevel", "error", "-i", abs, "-vf", vf, "-frames:v", "1", "-q:v", "3", tmp], { cwd: path.dirname(abs) });
    p.on("close", c => (c === 0 ? res() : rej(new Error(`ffmpeg downscale exited ${c}`))));
    p.on("error", rej);
  });
  const buf = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  return { dataUri: `data:image/jpeg;base64,${buf.toString("base64")}`, bytes: buf.length };
}

// --- daily cost guard -----------------------------------------------------
// Keeps every judge call cheap-and-bounded: a per-day spend cap tracked in
// .runware-usage.json. judge() refuses to run once today's spend hits the cap.
// Cap via RUNWARE_DAILY_CAP env (default $2). Report: `npm run runware:usage`.
const USAGE_FILE = path.join(projectRoot, ".runware-usage.json");

export function dailyCap() {
  return Math.max(0, parseFloat(process.env.RUNWARE_DAILY_CAP ?? "2"));
}
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function readUsage() {
  try { return fs.existsSync(USAGE_FILE) ? JSON.parse(fs.readFileSync(USAGE_FILE, "utf8")) : {}; } catch { return {}; }
}
export function todaySummary() {
  const t = readUsage()[todayKey()] || { total: 0, calls: 0 };
  const cap = dailyCap();
  return { spend: t.total, calls: t.calls, cap, remaining: Math.max(0, cap - t.total) };
}
function assertWithinCap() {
  const { spend, calls, cap } = todaySummary();
  if (spend >= cap) {
    throw new Error(`Runware daily cap reached: $${spend.toFixed(4)} spent on ${calls} call(s) today (cap $${cap.toFixed(2)}). Set RUNWARE_DAILY_CAP to raise it, or wait for UTC rollover.`);
  }
}
function recordSpend(cost) {
  if (!cost || cost <= 0) return;
  const all = readUsage();
  const k = todayKey();
  const t = all[k] || { total: 0, calls: 0 };
  t.total += cost; t.calls += 1;
  all[k] = t;
  try { fs.writeFileSync(USAGE_FILE, JSON.stringify(all, null, 2)); } catch {}
}

// Exported for any Runware call site (vision, audio, …) so the daily-cap guard
// covers ALL spend, not just vision. Additive — vision judge() still uses these
// internally; other modules import them rather than reimplementing.
export { assertWithinCap, recordSpend };

// CLI: `node scripts/lib/runware-vision.mjs usage` — print today's spend vs cap.
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/lib/runware-vision.mjs") && process.argv[2] === "usage") {
  const { spend, calls, cap, remaining } = todaySummary();
  console.log(`Runware spend today (UTC): $${spend.toFixed(4)} across ${calls} call(s) — cap $${cap.toFixed(2)} ($${remaining.toFixed(2)} remaining)`);
  const all = readUsage();
  const days = Object.keys(all).sort().slice(-7);
  if (days.length) {
    console.log("Last 7 days:");
    for (const d of days) console.log(`  ${d}: $${(all[d].total || 0).toFixed(4)} (${all[d].calls} calls)`);
  }
  process.exit(0);
}

// Run a vision judge task via textInference (multimodal: rubric text + image).
// Runware's `caption` task is a limited legacy utility that most vision models
// reject; the vision-capable chat models (GPT-5, Claude, Gemini Flash, etc.) are
// reached through `textInference` with OpenAI-style multimodal content.
//
// model defaults to the cheap tier — `openai:gpt@5-mini` (~$0.0004/look, proven).
// Graduate up by passing a stronger id, e.g. `openai:gpt@5`, `anthropic:claude@sonnet-4-6`,
// `google:gemini@3-flash`. (Model ids are Runware AIR ids `creator:family@version`
// from modelSearch — NOT the dashed doc slug.)
export async function judge({ imagePath, prompt, model = "openai:gpt@5-mini", maxEdge = 1280 }) {
  const key = loadRunwareKey();
  if (!key) throw new Error("RUNWARE_API_KEY not found — set it, or put it in automation-template/.env");
  assertWithinCap(); // refuse if today's spend has hit the daily cap
  const { dataUri, bytes } = await imageToDataUri(imagePath, maxEdge);

  const body = [{
    taskType: "textInference",
    taskUUID: randomUUID(),
    model,
    deliveryMethod: "sync",
    includeCost: true,
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: dataUri } },
      ],
    }],
  }];

  const r = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (!r.ok || json.errors) {
    const msg = json.errors ? json.errors.map(e => `${e.code}: ${e.message}`).join("; ") : `HTTP ${r.status}`;
    throw new Error(`Runware API error: ${msg}`);
  }
  const d = (json.data && json.data[0]) || {};
  const cost = typeof d.cost === "number" ? d.cost : null;
  if (cost != null) recordSpend(cost);
  return { text: d.text || "", cost, imageBytes: bytes, today: todaySummary() };
}
