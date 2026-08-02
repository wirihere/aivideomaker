// Judge a rendered reel's MOTION + STRUCTURE via a frame contact sheet.
//
// Why frames, not the MP4: Runware's textInference vision path takes images, and
// its only "video" models are generators, not understanders. A contact sheet of
// frames sampled across the timeline lets a vision model judge the structural
// motion rules — hook (R1), beat structure (R10), pacing/variety (R2/R9), end
// card (R14), loop (R15) — which is what "professional" mostly is. Smoothness of
// transitions is explicitly out of reach and the rubric says so.
//
// Usage:
//   node scripts/judge-video.mjs --video=<mp4> [--frames=8] [--model=...] [--rubric=...]
//   npm run judge:video -- --video=renders/binsparkle/binsparkle-customer-v3.mp4

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";
import { judge } from "./lib/runware-vision.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const videoRaw = typeof flags.video === "string" ? flags.video : null;
if (!videoRaw) {
  console.error(`judge-video — critique motion + structure via a frame contact sheet

Usage:
  node scripts/judge-video.mjs --video=<mp4> [options]

Options:
  --frames=<n>     frames to sample (default 8)
  --rubric=<path>  default: videos/<brand>/judge-rubrics/video.md
  --knowledge=<path> default: sibling expert-knowledge.md
  --model=<id>     default: openai:gpt@5-mini (cheap). Stronger: openai:gpt@5, etc.
  --no-ledger      skip the ledger append`);
  process.exit(2);
}

const videoAbs = path.resolve(videoRaw);
if (!fs.existsSync(videoAbs)) { console.error(`✗ not found: ${videoRaw}`); process.exit(2); }
const frames = Math.max(2, parseInt(String(flags.frames), 10) || 8);
const model = typeof flags.model === "string" ? flags.model : "openai:gpt@5-mini";
const wantLedger = flags["no-ledger"] !== true;

const rel = path.relative(projectRoot, videoAbs).replace(/\\/g, "/");
const m = rel.match(/^(?:renders|videos)\/([^/]+)\//);
const brand = m ? m[1] : "brand";
const rubricPath = typeof flags.rubric === "string" ? path.resolve(flags.rubric) : path.join(projectRoot, "videos", brand, "judge-rubrics", "video.md");
if (!fs.existsSync(rubricPath)) { console.error(`✗ rubric not found: ${path.relative(projectRoot, rubricPath)}`); process.exit(2); }
const rubric = fs.readFileSync(rubricPath, "utf8");
const knowledgePath = typeof flags.knowledge === "string" ? path.resolve(flags.knowledge) : path.join(path.dirname(rubricPath), "expert-knowledge.md");
const knowledge = fs.existsSync(knowledgePath) ? fs.readFileSync(knowledgePath, "utf8") : "";
const prompt = knowledge ? `${knowledge}\n\n---\n\n${rubric}` : rubric;

// --- duration via ffmpeg stderr (no ffprobe dependency) --------------------
function durationOf(ff, file) {
  return new Promise((res, rej) => {
    const p = spawn(ff, ["-i", file], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", d => (err += d));
    p.on("close", () => {
      const mm = err.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!mm) return rej(new Error("could not parse duration from ffmpeg"));
      res(+mm[1] * 3600 + +mm[2] * 60 + +mm[3]);
    });
    p.on("error", rej);
  });
}

// --- contact sheet via ffmpeg tile filter ---------------------------------
function buildSheet(ff, file, durationSecs, n, outPath) {
  const cols = Math.min(n, 4);
  const rows = Math.ceil(n / cols);
  // fps slightly above n/duration guarantees ≥ n sampled frames so the tile fills.
  const fps = (n + 1) / durationSecs;
  return new Promise((res, rej) => {
    const vf = [`fps=${fps.toFixed(5)}`, "scale=360:-2", `tile=${cols}x${rows}`];
    const p = spawn(ff, ["-y", "-loglevel", "error", "-i", file, "-vf", vf.join(","), "-frames:v", "1", "-q:v", "3", outPath], { cwd: path.dirname(file), stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", d => (err += d));
    p.on("close", c => (c === 0 ? res({ cols, rows }) : rej(new Error(`ffmpeg tile exited ${c}: ${err.trim().slice(0, 300)}`))));
    p.on("error", rej);
  });
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const src = fenced ? fenced[1] : text;
  const s = src.indexOf("{"), e = src.lastIndexOf("}");
  if (s < 0 || e < 0 || e <= s) return null;
  try { return JSON.parse(src.slice(s, e + 1)); } catch { return null; }
}

const ff = await getFfmpegPath();
const duration = await durationOf(ff, videoAbs);
const sheet = path.join(path.dirname(videoAbs), `.judge-sheet-${process.pid}.png`);
console.log(`▶ judge-video: ${rel} (${duration.toFixed(1)}s, ${frames} frames)  [model: ${model}]`);
const { cols, rows } = await buildSheet(ff, videoAbs, duration, frames, sheet);

let result;
try {
  result = await judge({ imagePath: sheet, prompt, model, maxEdge: 1600 });
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exitCode = 1;
} finally {
  if (fs.existsSync(sheet)) fs.unlinkSync(sheet);
}
if (!result) process.exit();

const verdict = extractJson(result.text);
if (verdict && Array.isArray(verdict.criteria)) {
  const mark = p => (p ? "✓" : "✗");
  console.log(`  contact sheet: ${cols}×${rows}`);
  console.log(`  overall: ${verdict.overall ?? "?"}`);
  for (const c of verdict.criteria) console.log(`  ${mark(c.pass)} ${c.name}${c.note ? " — " + c.note : ""}`);
  if (verdict.summary) console.log(`  summary: ${verdict.summary}`);
  if (Array.isArray(verdict.recommendations) && verdict.recommendations.length) {
    console.log("  recommendations:");
    for (const r of verdict.recommendations) {
      const pri = r.priority ? `[${r.priority}] ` : "";
      const frame = r.frame ? ` (frame ${r.frame})` : "";
      console.log(`  • ${pri}${r.issue}${frame}`);
      if (r.rule || r.fix) console.log(`      ${[r.rule && ("rule " + r.rule), r.fix].filter(Boolean).join(" — ")}`);
    }
  }
} else {
  console.log("  ⚠ could not parse structured verdict. Raw response:");
  console.log(result.text.split("\n").map(l => "    " + l).join("\n"));
}
console.log(`  cost: ${result.cost != null ? "$" + result.cost.toFixed(6) : "n/a"}` + (result.today ? `   today: $${result.today.spend.toFixed(4)} / $${result.today.cap.toFixed(2)} cap` : ""));

if (wantLedger) {
  const ledgerPath = path.join(projectRoot, "videos", brand, "judge-ledger.md");
  if (!fs.existsSync(ledgerPath)) {
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    fs.writeFileSync(ledgerPath, `# ${brand} — vision judge ledger\n\n| date | image | model | rubric | overall | cost | summary |\n|---|---|---|---|---|---|---|\n`);
  }
  const date = new Date().toISOString().slice(0, 16).replace("T", " ");
  const overall = verdict?.overall ?? "(unparsed)";
  const summary = (verdict?.summary ?? result.text.slice(0, 80)).replace(/\|/g, "/").replace(/\n/g, " ").slice(0, 120);
  fs.appendFileSync(ledgerPath, `| ${date} | ${path.basename(rel)} (video ${frames}f) | ${model.split(":").pop()} | ${fs.statSync(rubricPath).mtime.toISOString().slice(0, 16).replace("T", " ")} | ${overall} | ${result.cost != null ? "$" + result.cost.toFixed(5) : "—"} | ${summary} |\n`);
  console.log(`  ledger: ${path.relative(projectRoot, ledgerPath)}`);
}
