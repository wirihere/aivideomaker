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
  return { text: d.text || "", cost: typeof d.cost === "number" ? d.cost : null, imageBytes: bytes };
}
