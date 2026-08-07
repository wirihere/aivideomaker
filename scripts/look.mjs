// Look at a screenshot via Runware vision — the "eyes" for headed-browser driving
// when the running LLM has no image input. Thin CLI over scripts/lib/runware-vision.mjs judge().
//
// Usage:
//   node scripts/look.mjs <imagePath> <prompt...>
// Example:
//   node scripts/look.mjs C:/tmp/binsparkle-03-dash.png "Where is the Add location button? Give a CSS selector."
import { judge } from "./lib/runware-vision.mjs";
import path from "path";

const [img, ...rest] = process.argv.slice(2);
if (!img || !rest.length) {
  console.error("Usage: node scripts/look.mjs <imagePath> <prompt...>");
  console.error('Example: node scripts/look.mjs C:/tmp/x.png "Describe the Add button, give a CSS selector"');
  process.exit(2);
}
const r = await judge({ imagePath: path.resolve(img), prompt: rest.join(" "), model: "openai:gpt@5-mini" });
process.stdout.write((r.text || "(empty response)").trim() + "\n");
if (r.cost != null) {
  process.stderr.write(`[$${r.cost.toFixed(5)}; today $${r.today.spend.toFixed(4)}/$${r.today.cap} cap]\n`);
}
