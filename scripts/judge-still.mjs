// Judge a rendered still against a rubric using a Runware vision model.
//
// This closes the loop the factory was missing: the renderer produces a still,
// the judge LOOKS at it and scores it against an editable rubric, and every
// verdict is appended to a per-brand ledger. That ledger is the improvement
// loop — feedback becomes a rubric edit, the rubric is versioned by mtime, and
// you can watch the playbook get measurably better over time.
//
// Cheap-first by default (Nano Banana 2 Lite, ~cents/look). Graduate up by passing
// --model=<stronger id> (e.g. google:4@1 Nano Banana, openai:gpt@5-mini) when the
// cheap model isn't decisive enough.
//
// Usage:
//   node scripts/judge-still.mjs --image=<path>[,<path>...] [options]
//   npm run judge:still -- --image=renders/binsparkle/binsparkle-customer-t3.5.png
//
// Options:
//   --rubric=<path>   rubric file (default: videos/<brand>/judge-rubrics/still.md)
//   --model=<id>      Runware vision model id (default: alibaba-qwen2-5-vl-7b-instruct)
//   --max-edge=<n>    downscale long edge to N px before sending (default 1280)
//   --no-ledger       don't append to the ledger

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

const imagesRaw = typeof flags.image === "string" ? flags.image : null;
if (!imagesRaw) {
  console.error(`judge-still — score a still against a rubric via Runware vision

Usage:
  node scripts/judge-still.mjs --image=<path>[,<path>...]

Options:
  --rubric=<path>   default: videos/<brand>/judge-rubrics/still.md
  --model=<id>      default: openai:gpt@5-mini (cheap, ~$0.0004/look). Stronger: openai:gpt@5, anthropic:claude@sonnet-4-6, google:gemini@3-flash
  --max-edge=<n>    downscale long edge (default 1280)
  --no-ledger       skip the ledger append`);
  process.exit(2);
}
const images = imagesRaw.split(",").map(s => s.trim()).filter(Boolean);

const model = typeof flags.model === "string" ? flags.model : "openai:gpt@5-mini";
const maxEdge = parseInt(String(flags["max-edge"]), 10) || 1280;
const wantLedger = flags["no-ledger"] !== true;

function deriveBrand(imgPath) {
  const rel = path.relative(projectRoot, path.resolve(imgPath)).replace(/\\/g, "/");
  const m = rel.match(/^(?:renders|videos)\/([^/]+)\//);
  return m ? m[1] : "brand";
}

// Pull a JSON object out of the model's text response (lenient — small VLMs
// sometimes wrap JSON in prose or code fences).
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const src = fenced ? fenced[1] : text;
  const start = src.indexOf("{");
  const end = src.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  try { return JSON.parse(src.slice(start, end + 1)); } catch { return null; }
}

let totalCost = 0;
for (const img of images) {
  const abs = path.resolve(img);
  if (!fs.existsSync(abs)) { console.error(`✗ not found: ${img}`); continue; }
  const brand = deriveBrand(abs);
  const rubricPath = typeof flags.rubric === "string"
    ? path.resolve(flags.rubric)
    : path.join(projectRoot, "videos", brand, "judge-rubrics", "still.md");
  if (!fs.existsSync(rubricPath)) { console.error(`✗ rubric not found: ${path.relative(projectRoot, rubricPath)}`); process.exit(2); }
  const rubric = fs.readFileSync(rubricPath, "utf8");
  const rubricVersion = fs.statSync(rubricPath).mtime.toISOString().slice(0, 16).replace("T", " ");
  // Auto-prepend a sibling expert-knowledge.md (the brand + platform rules brief),
  // or --knowledge=<path>. This is what turns the judge into an expert.
  const knowledgePath = typeof flags.knowledge === "string"
    ? path.resolve(flags.knowledge)
    : path.join(path.dirname(rubricPath), "expert-knowledge.md");
  const knowledge = fs.existsSync(knowledgePath) ? fs.readFileSync(knowledgePath, "utf8") : "";
  const prompt = knowledge ? `${knowledge}\n\n---\n\n${rubric}` : rubric;

  console.log(`▶ judge: ${path.relative(projectRoot, abs)}  [model: ${model}]`);
  let result;
  try {
    result = await judge({ imagePath: abs, prompt, model, maxEdge });
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exitCode = 1;
    continue;
  }
  if (result.cost != null) totalCost += result.cost;

  const verdict = extractJson(result.text);
  const rel = path.relative(projectRoot, abs);
  if (verdict && Array.isArray(verdict.criteria)) {
    const mark = p => (p ? "✓" : "✗");
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
      fs.writeFileSync(ledgerPath, `# ${brand} — vision judge ledger\n\nEvery judge run appends a row. When you give feedback, edit the rubric\n(judge-rubrics/still.md) — its mtime is the \`rubric\` column, so you can see\nthe playbook improving over time.\n\n| date | image | model | rubric | overall | cost | summary |\n|---|---|---|---|---|---|---|\n`);
    }
    const date = new Date().toISOString().slice(0, 16).replace("T", " ");
    const overall = verdict?.overall ?? "(unparsed)";
    const summary = (verdict?.summary ?? result.text.slice(0, 80)).replace(/\|/g, "/").replace(/\n/g, " ").slice(0, 120);
    const shortModel = model.split(":").pop();
    fs.appendFileSync(ledgerPath, `| ${date} | ${path.basename(rel)} | ${shortModel} | ${rubricVersion} | ${overall} | ${result.cost != null ? "$" + result.cost.toFixed(5) : "—"} | ${summary} |\n`);
    console.log(`  ledger: ${path.relative(projectRoot, ledgerPath)}`);
  }
}

if (images.length > 1 && totalCost > 0) console.log(`\n✓ ${images.length} images judged, total cost $${totalCost.toFixed(6)}`);
