// Runware model catalogue client.
//
// Two jobs:
//   1. `modelSearch(...)`      — thin wrapper over the free modelSearch task.
//   2. `modelsFor(modality)`   — curated candidates per modality, each with its
//                                price + best-for + avoid-for surfaced. The right
//                                level to pay is a per-task judgement: this table
//                                shows the options so a human (or the agent, with
//                                the user told the price) can pick. It does NOT
//                                auto-default to the cheapest.
//
// modelSearch is a FREE catalogue lookup — no cost, no daily-cap guard. Auth and
// key resolution are shared with runware-vision.mjs (single source of truth).
//
// Model ids here are Runware AIR ids (`creator:family@version`), NOT the dashed
// doc slugs. See docs/runware-models.md for the full verified catalogue.

import { randomUUID } from "crypto";
import { loadRunwareKey } from "./runware-vision.mjs";

const ENDPOINT = "https://api.runware.ai/v1";

// --- modelSearch: free catalogue lookup -----------------------------------
// All params optional except `search`. Response shape: { results, total }.
// See https://runware.ai/docs/platform/model-search for the full spec.
export async function modelSearch({
  search,
  category,
  architecture,
  capabilities,
  source,
  visibility,
  limit = 20,
  offset = 0,
  sort,
} = {}) {
  const key = loadRunwareKey();
  if (!key) throw new Error("RUNWARE_API_KEY not found — set it, or put it in automation-template/.env");
  if (!search || typeof search !== "string") {
    throw new Error("modelSearch requires a `search` string (search by name, description, or AIR id).");
  }

  const task = { taskType: "modelSearch", taskUUID: randomUUID(), search, limit, offset };
  if (category) task.category = category;
  if (architecture) task.architecture = architecture;
  if (capabilities) task.capabilities = capabilities;
  if (source) task.source = source;
  if (visibility) task.visibility = visibility;
  if (sort) task.sort = sort;

  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify([task]),
  });
  const json = await r.json();
  if (!r.ok || json.errors) {
    const msg = json.errors ? json.errors.map(e => `${e.code}: ${e.message}`).join("; ") : `HTTP ${r.status}`;
    throw new Error(`Runware modelSearch error: ${msg}`);
  }
  const d = (json.data && json.data[0]) || {};
  return { results: d.results || [], total: d.totalResults || 0, taskUUID: d.taskUUID };
}

// --- RECOMMENDED: curated per-modality picks ------------------------------
// ONLY models whose AIR id + price + params have been live-verified belong here.
// Each entry: { id, name, pricePerCall, capabilities, bestFor, avoidFor, verified }
//   verified = ISO date of the last live check (model id resolves + params match docs).
// Unverified candidates live in docs/runware-models.md as "pending" until probed.
// `pricePerCall` is a typical-cost estimate from the model's docs page; treat as
// indicative — re-verify before any cost-sensitive loop.
export const RECOMMENDED = {
  vision: [
    { id: "openai:gpt@5-mini", name: "GPT-5 Mini", pricePerCall: 0.0004, capabilities: ["image-to-text", "text-to-text"], bestFor: "Cheap default for every vision-judge call.", avoidFor: "Fine detail in crowded frames.", verified: "2026-08-02" },
  ],
  text: [
    { id: "anthropic:claude@opus-4.8",   name: "Claude Opus 4.8",   pricePerCall: 0.016,  capabilities: ["text-to-text", "image-to-text"], bestFor: "Top recommended tier for copywriting (~$0.016/script, 8s latency). Tightest CTAs in the test, strong brand-voice lifting. The practical ceiling — Fable 5 tested slightly better but costs 8× more for the gain.", avoidFor: "Bulk iteration loops (drop to Sonnet 4.6 — same family, half the cost).", verified: "2026-08-02" },
    { id: "anthropic:claude@sonnet-4.6", name: "Claude Sonnet 4.6", pricePerCall: 0.007,  capabilities: ["text-to-text", "image-to-text"], bestFor: "Value pick for copywriting (~$0.007/script). Near-top quality at half Opus's price. 10s latency.", avoidFor: "When you need the absolute tightest final polish — graduate to Opus 4.8 for the last pass.", verified: "2026-08-02" },
    { id: "openai:gpt@5.4",              name: "GPT-5.4",           pricePerCall: 0.007,  capabilities: ["text-to-text", "image-to-text"], bestFor: "Fast iteration (~$0.007/script, 4s latency — fastest of the text models). Solid conventional copy; doesn't lift brand voice as cleverly as Claude but rarely breaks constraints.", avoidFor: "Hero/CTA lines where voice is the whole ballgame — Claude is meaningfully better.", verified: "2026-08-02" },
  ],
  "image-gen": [
    { id: "runware:400@1", name: "FLUX.2 [dev]", pricePerCall: 0.009, capabilities: ["text-to-image", "image-to-image"], bestFor: "Cheap default for social content — carousels, stories, thumbnails ($0.009/image, serverless). Use for everything unless the detail visibly isn't there.", avoidFor: "Hero-quality shots where maximum prompt adherence and fine detail matter (use FLUX.2 [pro]).", verified: "2026-08-03" },
    { id: "bfl:5@1", name: "FLUX.2 [pro]", pricePerCall: 0.030, capabilities: ["text-to-image", "image-to-image"], bestFor: "Top-quality generation ($0.030/image). Better prompt adherence and fine detail than dev.", avoidFor: "Routine social content (dev is 3× cheaper and fine for carousels/stories).", verified: "2026-08-03" },
  ],
  tts: [
    { id: "xai:tts@0", name: "xAI TTS", pricePerCall: 0.0004, capabilities: ["text-to-audio"], bestFor: "Baseline narration ($0.015/1k chars). 27 voices, inline speech tags, 20+ languages. Good default when the script is straightforward.", avoidFor: "Voice cloning (use qwen3-tts-1.7b-base) or multi-speaker dialogue (use fish-audio or gemini-3.1-flash-tts). No speed/temperature knob.", verified: "2026-08-02" },
    { id: "inworld:tts@1.5-mini", name: "Inworld TTS-1.5 Mini", pricePerCall: 0.0019, capabilities: ["text-to-audio"], bestFor: "When the read needs more expression than xAI gives ($0.025/1k chars). 76 voices, temperature control.", avoidFor: "Routine narration where xAI is indistinguishable to the ear — you'd pay 2.5× for nothing.", verified: "2026-08-02" },
    { id: "inworld:tts@1.5-max", name: "Inworld TTS-1.5 Max", pricePerCall: 0.0038, capabilities: ["text-to-audio"], bestFor: "Top-fidelity narration where the voice carries the brand ($0.05/1k chars). Same param surface as 1.5-mini, richer prosody.", avoidFor: "Bulk narration (costs ~3× mini). Reserve for hero/CTA voice work.", verified: "2026-08-02" },
  ],
  music: [
    { id: "runware:ace-step@v1.5-turbo", name: "ACE-Step v1.5 Turbo", pricePerCall: 0.003, capabilities: ["text-to-audio"], bestFor: "Cheapest music bed ($0.0001/sec; verified $0.0009/30s). Real bpm/key/time-signature params. 30–300s. Instrumental via vocalLanguage=unknown.", avoidFor: "Maximum quality or negative-prompt control (use ace-step@v1.5-base) — Turbo has fewer knobs and fewer steps.", verified: "2026-08-02" },
    { id: "runware:ace-step@v1.5-base", name: "ACE-Step v1.5 Base", pricePerCall: 0.0045, capabilities: ["text-to-audio"], bestFor: "Higher-quality beds when iteration cost matters less than fidelity; supports negativePrompt + CFG.", avoidFor: "Fast/cheap loops (Turbo is ~3× cheaper).", verified: "2026-08-02" },
  ],
  video:     [],
};

// --- TRAPS: documented pitfalls (don't repeat them) -----------------------
// Kept separate from RECOMMENDED so pickModel() never returns one of these.
export const TRAPS = [
  { id: "google:nano-banana@*", name: "Nano Banana (any)",  modality: "vision", trap: "Only does the legacy `caption` task — rejects textInference/vision-QA. Use openai:gpt@5-mini instead.", verified: "2026-08-02" },
  { id: "alibaba-qwen2-5-vl-*", name: "Qwen2.5-VL (any)",  modality: "vision", trap: "Listed in docs but NOT live on this account at probe time. Probe before trusting.", verified: "2026-08-02" },
  { id: "anthropic:claude@fable-5", name: "Claude Fable 5", modality: "text", trap: "Tested #1 on quality ($0.13/script) but 8× Opus 4.8's cost for a marginal gain. Use for one-off hero work where the absolute best matters; otherwise Opus 4.8 is the smart pick.", verified: "2026-08-02" },
  { id: "openai:gpt@5.5", name: "GPT-5.5", modality: "text", trap: "Flagship pricing ($0.027/script) but missed an explicit 'do NOT name Hamilton' constraint in the probe. A flagship that ignores instructions is a liability for brand-controlled copy.", verified: "2026-08-02" },
  { id: "runware:*tts*", name: "All Runware TTS models", modality: "tts", trap: "NONE have en-NZ voices. For NZ brands, use Edge TTS (en-NZ-MollyNeural / en-NZ-MitchellNeural) via scripts/fetch-tts-edge.mjs — unmetered AND authentic. Runware TTS only makes sense for non-NZ work, voice cloning, or multi-speaker. See docs/voices.md for the NZ-adjacent accent ladder.", verified: "2026-08-02" },
];

// --- modelsFor: list curated candidates for a modality --------------------
// modality: "vision" | "text" | "image-gen" | "tts" | "music" | "video"
// needs:    optional capability filter (string or array).
// Returns the RECOMMENDED[modality] entries whose capabilities include any of
// `needs` (or the whole list if `needs` is omitted). NOT ranked by price — the
// order is the curation order in RECOMMENDED, which goes baseline → premium.
// Caller (human or agent) reads the prices + bestFor/avoidFor and picks.
export function modelsFor(modality, { needs = [] } = {}) {
  const list = RECOMMENDED[modality];
  if (!list) throw new Error(`Unknown modality "${modality}". Known: ${Object.keys(RECOMMENDED).join(", ")}`);
  if (list.length === 0) {
    throw new Error(`No curated ${modality} models yet — research and add to RECOMMENDED + docs/runware-models.md before relying on this.`);
  }
  const need = Array.isArray(needs) ? needs : [needs];
  const candidates = need.length
    ? list.filter(m => m.capabilities.some(c => need.includes(c)))
    : list.slice();
  return candidates.length ? candidates : list.slice();
}

// --- pickModel: explicit-tier selector -------------------------------------
// tier values:
//   "premium"  (default) — best quality suitable. Use when each generation is
//               rare and the absolute cost is small (TTS for an ad, music bed,
//               one-off still). For a 30s ad script (~450 chars), even premium
//               TTS is ~$0.02/read — the level ladder matters only at volume.
//   "budget"   — lowest price suitable. Use for HIGH-VOLUME loops where the
//               per-call cost compounds: vision judging across many frames per
//               render, multi-language bulk runs, hundreds of takes.
//   "balanced" — middle candidate (needs ≥3 candidates).
//
// Default is premium because the typical job here is a short ad and the cost
// difference between tiers is cents. Drop to budget only when volume forces it.
export function pickModel(modality, { tier = "premium", needs = [] } = {}) {
  const pool = modelsFor(modality, { needs });
  if (pool.length === 1) return pool[0];
  if (tier === "balanced" && pool.length < 3) {
    throw new Error(`pickModel tier="balanced" needs ≥3 candidates; ${modality} has ${pool.length}. Use "budget" or "premium".`);
  }
  const sorted = pool.slice().sort((a, b) => a.pricePerCall - b.pricePerCall);
  if (tier === "budget") return sorted[0];
  if (tier === "premium") return sorted[sorted.length - 1];
  if (tier === "balanced") return sorted[Math.floor(sorted.length / 2)];
  throw new Error(`pickModel: unknown tier "${tier}". Use "budget", "balanced", or "premium".`);
}

// --- CLI -------------------------------------------------------------------
//   node scripts/lib/runware-models.mjs                       → print curated table
//   node scripts/lib/runware-models.mjs models <modality>     → list candidates w/ prices
//   node scripts/lib/runware-models.mjs pick <modality> budget|balanced|premium
//   node scripts/lib/runware-models.mjs search <query>        → live modelSearch
//   node scripts/lib/runware-models.mjs search "q" --json --limit=N
const isMain = (() => {
  try { return process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("scripts/lib/runware-models.mjs"); }
  catch { return false; }
})();

if (isMain) {
  const args = process.argv.slice(2);
  const flags = Object.fromEntries(
    args.filter(a => a.startsWith("--")).map(a => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    })
  );
  const positional = args.filter(a => !a.startsWith("--"));
  const cmd = positional[0];

  if (cmd === "search") {
    const q = positional.slice(1).join(" ");
    if (!q) { console.error("Usage: search <query> [--json] [--limit=N]"); process.exit(1); }
    const limit = parseInt(String(flags.limit ?? "20"), 10);
    modelSearch({ search: q, limit: Number.isFinite(limit) ? limit : 20 })
      .then(({ results, total }) => {
        if (flags.json) { console.log(JSON.stringify(results, null, 2)); return; }
        console.log(`modelSearch "${q}" — ${total} match(es), showing ${results.length}:\n`);
        for (const m of results) {
          console.log(`  ${m.air}`);
          console.log(`    ${m.name}${m.architecture ? ` · ${m.architecture}` : ""}${m.category ? ` · ${m.category}` : ""}`);
          if (m.shortDescription) console.log(`    ${m.shortDescription}`);
        }
      })
      .catch(e => { console.error(e.message); process.exit(1); });
  } else if (cmd === "models") {
    const modality = positional[1];
    try {
      const list = modelsFor(modality);
      console.log(`${modality} — ${list.length} candidate(s). Prices are indicative (per-call typical); re-verify with includeCost:true before any cost-sensitive loop.\n`);
      for (const m of list) {
        console.log(`  ${m.id}  ~$${m.pricePerCall.toFixed(4)}/call  ${m.name}  (verified ${m.verified})`);
        console.log(`    best-for:  ${m.bestFor}`);
        console.log(`    avoid-for: ${m.avoidFor}`);
        console.log("");
      }
      console.log(`Pick explicitly:  node scripts/lib/runware-models.mjs pick ${modality} budget|balanced|premium`);
    } catch (e) { console.error(e.message); process.exit(1); }
  } else if (cmd === "pick") {
    const modality = positional[1];
    const tier = positional[2] || flags.tier;
    try {
      const m = pickModel(modality, { tier });
      console.log(`${m.id}\t${m.name}\t~$${m.pricePerCall.toFixed(4)}/call\t(verified ${m.verified})`);
      console.log(`best-for: ${m.bestFor}`);
    } catch (e) { console.error(e.message); process.exit(1); }
  } else {    // default: print the recommended catalogue
    console.log("Runware recommended models (curated — see docs/runware-models.md):\n");
    for (const [mod, list] of Object.entries(RECOMMENDED)) {
      console.log(`[${mod}]`);
      if (!list.length) { console.log("  (not yet researched — see docs/runware-models.md)"); continue; }
      for (const m of list) {
        console.log(`  ${m.id.padEnd(34)} ~$${m.pricePerCall.toFixed(4)}/call  ${m.name}  (verified ${m.verified})`);
        console.log(`  ${" ".repeat(34)} best-for: ${m.bestFor}`);
      }
      console.log();
    }
    if (TRAPS.length) {
      console.log("[traps — do NOT use these for the named modality]");
      for (const t of TRAPS) console.log(`  ${t.id.padEnd(34)} ${t.modality}: ${t.trap}`);
      console.log();
    }
    console.log("Usage:");
    console.log("  node scripts/lib/runware-models.mjs models <modality>");
    console.log("  node scripts/lib/runware-models.mjs pick <modality> budget|balanced|premium");
    console.log("  node scripts/lib/runware-models.mjs search <query> [--json] [--limit=N]");
  }
}
