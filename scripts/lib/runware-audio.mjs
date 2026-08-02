// Runware audio client (TTS + music + voice conversion).
//
// All Runware audio models — TTS, music generation, voice conversion, scene audio —
// are reached through ONE task type: `audioInference`. The model (AIR id) selects
// the modality; the request shape varies per model (params nest under `speech`,
// `inputs`, `settings`, `positivePrompt`, etc.). See docs/runware-models.md for the
// per-model param map.
//
// Cost guard: shares the same .runware-usage.json tracker + RUNWARE_DAILY_CAP as
// runware-vision.mjs — every call is bounded by the global daily cap.
//
// Auth + key resolution: shared with runware-vision.mjs (single source of truth).
//
// Output handling: `outputType` chooses URL (default, cheap — Runware hosts the
// file and you fetch it) vs base64Data/dataURI (inlined in the response). `outputFormat`
// picks the container (MP3 default). WAV/FLAC are lossless and FORBID `audioSettings`;
// MP3/OGG allow it. See docs/runware-models.md "Common parameters".

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { loadRunwareKey, assertWithinCap, recordSpend, todaySummary } from "./runware-vision.mjs";

const ENDPOINT = "https://api.runware.ai/v1";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

// Run an audioInference task. Returns { audioURL, audioBase64, audioDataURI, seed, cost, today }.
//
// `model` is the AIR id (e.g. "xai:tts@0", "runware:ace-step@v1.5-turbo"). Required.
// `params` is the model-specific request body (speech/inputs/settings/positivePrompt/etc.).
// `opts`:  { outputType: "URL"|"base64Data"|"dataURI" (default URL),
//            outputFormat: "MP3"|"WAV"|"FLAC"|"OGG" (default MP3),
//            audioSettings: { bitrate, sampleRate, channels } (MP3/OGG only),
//            numberResults: 1–4 (default 1) }
export async function audioInference({ model, params = {}, opts = {} }) {
  const key = loadRunwareKey();
  if (!key) throw new Error("RUNWARE_API_KEY not found — set it, or put it in automation-template/.env");
  if (!model) throw new Error("audioInference requires a `model` AIR id (e.g. \"xai:tts@0\").");
  assertWithinCap();

  const outputType = opts.outputType || "URL";
  const outputFormat = opts.outputFormat || "MP3";
  if (outputFormat === "WAV" || outputFormat === "FLAC") {
    if (opts.audioSettings) throw new Error(`${outputFormat} output forbids audioSettings (lossless). Drop opts.audioSettings or switch to MP3/OGG.`);
  }

  const task = {
    taskType: "audioInference",
    taskUUID: randomUUID(),
    model,
    outputType,
    outputFormat,
    deliveryMethod: "sync",
    includeCost: true,
    ...params,                         // model-specific speech/inputs/settings/positivePrompt
    ...(opts.audioSettings ? { audioSettings: opts.audioSettings } : {}),
    ...(opts.numberResults ? { numberResults: opts.numberResults } : {}),
  };

  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  const json = await r.json();
  if (!r.ok || json.errors) {
    const msg = json.errors ? json.errors.map(e => `${e.code}: ${e.message}`).join("; ") : `HTTP ${r.status}`;
    throw new Error(`Runware audioInference error: ${msg}`);
  }
  const d = (json.data && json.data[0]) || {};
  const cost = typeof d.cost === "number" ? d.cost : null;
  if (cost != null) recordSpend(cost);
  return {
    audioURL: d.audioURL || null,
    audioBase64: d.audioBase64 || null,
    audioDataURI: d.audioDataURI || null,
    seed: d.seed,
    cost,
    today: todaySummary(),
  };
}

// Download a remote audioURL to a local path. Use after audioInference with the
// default `outputType: "URL"` — cheaper than base64-inlining for long clips.
export async function downloadAudio(audioURL, outPath) {
  const r = await fetch(audioURL);
  if (!r.ok) throw new Error(`Download failed: HTTP ${r.status} for ${audioURL}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  return { bytes: buf.length, path: outPath };
}

// Resolve a project-relative or absolute output path under the repo.
export function resolveOut(p) {
  return path.isAbsolute(p) ? p : path.resolve(projectRoot, p);
}
