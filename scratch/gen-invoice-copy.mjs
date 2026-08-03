// Generate "invoice from your bin" copy via the script-and-copy model ladder.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { loadRunwareKey, assertWithinCap, recordSpend, todaySummary } from "../scripts/lib/runware-vision.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROMPT = `You are writing copy for BinSparkle, a wheelie-bin-cleaning marketplace in Hamilton, New Zealand. Homeowners book online; self-employed contractors do the clean at the customer's place.

BRAND CONTEXT (verbatim from binsparkle.nz):
- Tagline pattern: short assertion + plain kicker. Real examples: "Stinky bins? We've got you, mate." / "Three steps. That's it." / "Plain answers. No fine print." / "Honest prices. No surprises."
- Brand voice: warm, plain-spoken, friendly-local, NEVER corporate. A Hamilton neighbour, not a marketer.
- The service: pressure-washed, scrubbed, deodorised — at your place. Book at binsparkle.nz.

PRODUCT FACTS (use only these — do not invent):
- Wheelie-bin cleaning, residential, Hamilton NZ. Book at binsparkle.nz. No invented prices, stats, or competitor names.

THE CONCEPT: "Invoice from your bin" — a formal-looking itemised invoice / statement, sent BY the wheelie bin TO the homeowner, billing them for what the bin has endured. The joke is the deadpan corporate formality applied to bin suffering. Each line item is a specific, funny, relatable thing the homeowner did to the bin, with a quantity and a deadpan description — and every line is priced at $0.00 (the bin charges nothing, it has just suffered). The invoice builds line by line, then the "balance due" is NOT money — it's "1× BinSparkle clean" (the only thing that settles the debt). It should be GENUINELY FUNNY — dry, specific, the bin as a weary accountant. Specific complaints beat generic. The voice: imagine a bin that has been through a lot and is now, with grim politeness, submitting its expenses.

CRAFT CONSTRAINTS (mandatory — outputs breaking these fail):
1. NO EMOJIS anywhere. BinSparkle's site has none. Comedy comes from the writing.
2. This must be FUNNY. Each line item should earn a smirk. Dry, specific, deadpan formal.
2. Format each line item: [item name] | [qty] | [deadpan description] | [price: always $0.00]
3. Specific over generic. "Prawn shells — extended cold storage, 15 days" beats "food waste."
4. NO invented product facts/prices/stats for BinSparkle. The $0.00 line prices are the joke (the bin charges nothing); the only real "cost" is the BinSparkle clean.
5. The arc: ~6 funny suffering line items (escalating) → a "subtotal" line → "balance due: 1× BinSparkle clean (pressure wash + scrub + deodorise)" → "pay at binsparkle.nz."
6. Kiwi flavour where it fits (mate, sorted, reckon, bloody). No caricature.
7. Read every line aloud — if it doesn't sound funny out loud, rewrite it.

DELIVERABLES (return exactly these two, no preamble, no commentary):

=== INVOICE ===
- A "from" line (your wheelie bin, sole trader, est. the day you moved in)
- A "to" line (you, the homeowner)
- An invoice number (funny, e.g. INV-2026-NOPENOTAGAIN)
- 6 line items in the format: item | qty | description | $0.00
- A subtotal line ($0.00)
- A "balance due" line: 1× BinSparkle clean
- A closing note (one line, dry)

=== CAPTIONS ===
Three captions for the same post, one per platform. Same angle. NO emojis.
- FB (3-5 hashtags, warm, ~40 words)
- IG (12-15 hashtags, energetic but plain, ~60 words)
- Threads (0-1 hashtags, conversational, ~20 words)`;

async function main() {
  const key = loadRunwareKey();
  if (!key) throw new Error("RUNWARE_API_KEY not found");
  assertWithinCap();

  const body = [{
    taskType: "textInference",
    taskUUID: randomUUID(),
    model: "anthropic:claude@opus-4.8",
    deliveryMethod: "sync",
    includeCost: true,
    messages: [{ role: "user", content: [{ type: "text", text: PROMPT }] }],
  }];

  console.log("▶ generating invoice copy via anthropic:claude@opus-4.8 ...");
  const t0 = Date.now();
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
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const out = d.text || "";
  console.log(`✓ done in ${secs}s, cost $${cost ?? "?"}\n`);
  console.log("──── OUTPUT ────\n");
  console.log(out);
  fs.writeFileSync(path.join(__dirname, "invoice-copy-output.md"), out);
  console.log("\n──── saved to scratch/invoice-copy-output.md ────");
  console.log("today:", JSON.stringify(todaySummary()));
}

main().catch(e => { console.error("✗", e.message); process.exit(1); });
