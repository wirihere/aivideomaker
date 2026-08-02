// Runware image generation client (text-to-image, image-to-image).
//
// All Runware image models (FLUX.2 family, Nano Banana, Seedream, Recraft,
// Ideogram, etc.) are reached through ONE task type: `imageInference`. The
// model (AIR id) selects the architecture; params are the standard diffusion
// set (positivePrompt, negativePrompt, width, height, steps, CFG, scheduler,
// seed, numberResults).
//
// Cost guard: shares the same .runware-usage.json tracker + RUNWARE_DAILY_CAP
// as runware-vision.mjs and runware-audio.mjs — every call is bounded.
//
// Auth + key resolution: shared with runware-vision.mjs (single source).

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { loadRunwareKey, assertWithinCap, recordSpend, todaySummary } from "./runware-vision.mjs";

const ENDPOINT = "https://api.runware.ai/v1";

// Run an imageInference task. Returns { imageURL, seed, cost, today }.
//
// `model` is the AIR id (e.g. "runware:400@1" for FLUX.2 [dev]). Required.
// `params`: { positivePrompt, negativePrompt?, width?, height?, steps?, CFG?,
//             scheduler?, seed?, numberResults? }
// `opts`:   { outputType: "URL"|"base64Data"|"dataURI" (default URL) }
export async function imageInference({ model, params = {}, opts = {} }) {
  const key = loadRunwareKey();
  if (!key) throw new Error("RUNWARE_API_KEY not found — set it, or put it in automation-template/.env");
  if (!model) throw new Error("imageInference requires a `model` AIR id (e.g. \"runware:400@1\").");
  if (!params.positivePrompt) throw new Error("imageInference requires `params.positivePrompt`.");
  assertWithinCap();

  const outputType = opts.outputType || "URL";
  const task = {
    taskType: "imageInference",
    taskUUID: randomUUID(),
    model,
    outputType,
    deliveryMethod: "sync",
    includeCost: true,
    positivePrompt: params.positivePrompt,
    width:  params.width  ?? 1024,
    height: params.height ?? 1024,
    numberResults: params.numberResults ?? 1,
    ...(params.negativePrompt ? { negativePrompt: params.negativePrompt } : {}),
    ...(params.steps    != null ? { steps:    params.steps    } : {}),
    ...(params.CFG      != null ? { CFG:      params.CFG      } : {}),
    ...(params.scheduler ? { scheduler: params.scheduler } : {}),
    ...(params.seed     != null ? { seed:     params.seed     } : {}),
  };

  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  const json = await r.json();
  if (!r.ok || json.errors) {
    const msg = json.errors ? json.errors.map(e => `${e.code}: ${e.message}`).join("; ") : `HTTP ${r.status}`;
    throw new Error(`Runware imageInference error: ${msg}`);
  }
  // imageInference returns an array of `data` items (one per numberResults).
  const results = (json.data || []).map(d => ({
    imageURL: d.imageURL || null,
    imageBase64: d.imageBase64 || null,
    imageDataURI: d.imageDataURI || null,
    seed: d.seed,
    cost: typeof d.cost === "number" ? d.cost : null,
  }));
  const totalCost = results.reduce((s, r) => s + (r.cost ?? 0), 0);
  if (totalCost > 0) recordSpend(totalCost);
  return { results, cost: totalCost, today: todaySummary() };
}

// Download a remote imageURL to a local path.
export async function downloadImage(imageURL, outPath) {
  const r = await fetch(imageURL);
  if (!r.ok) throw new Error(`Download failed: HTTP ${r.status} for ${imageURL}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  return { bytes: buf.length, path: outPath };
}
