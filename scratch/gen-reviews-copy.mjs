// Generate "reviews from your bin" copy via the script-and-copy model ladder.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { loadRunwareKey, assertWithinCap, recordSpend, todaySummary } from "../scripts/lib/runware-vision.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROMPT = `You are writing copy for BinSparkle, a wheelie-bin-cleaning marketplace in Hamilton, New Zealand. Homeowners book online; self-employed contractors do the clean at the customer's place.

BRAND CONTEXT (verbatim from binsparkle.nz):
- Tagline pattern: short assertion + plain kicker. Real examples on the site: "Stinky bins? We've got you, mate." / "Three steps. That's it." / "Plain answers. No fine print." / "Honest prices. No surprises."
- Brand voice: warm, plain-spoken, friendly-local, NEVER corporate. Talk like a Hamilton neighbour, not a marketer.
- The service: pressure-washed, scrubbed, deodorised — at your place. Book at binsparkle.nz.

PRODUCT FACTS (use only these — do not invent):
- Wheelie-bin cleaning, residential, Hamilton NZ.
- Customer books online; a local contractor cleans the bin at the property.
- Standard clean = pressure wash + scrub every wall and the base + deodorise. Smell gone, bin clean.
- Book at binsparkle.nz. No invented prices, no invented stats, no named competitors.

THE CONCEPT: "Reviews from your bin" — a reviews-page format (like a Product Review / Trustpilot page) where the wheelie bin leaves reviews about THE HOMEOWNER (the person who owns it). The inversion is the whole joke: the bin is the reviewer, the homeowner is the product being reviewed. It should be GENUINELY FUNNY — sharp, specific, dry. The early reviews are brutal (1-2 stars: the homeowner is a terrible bin-owner), then after a BinSparkle clean the final review is glowing (5 stars: "i take it all back, this human has changed"). The voice is a bin with the dry wit of a judgey Hamilton local — not a mascot, not crude. Specific complaints beat generic ("left a half-eaten pie in me since the rugby" beats "i am dirty").

CRAFT CONSTRAINTS (mandatory — outputs breaking these fail):
1. NO EMOJIS anywhere. BinSparkle's site has none. Comedy comes from the writing.
2. This must be FUNNY. Each review line should earn a smirk or a laugh. Dry, specific, a little savage but ultimately warm.
3. Each review = star rating (1-5) + a one-line review title + the review body (1-3 short sentences, text-message short, lower-case fine). Plus a "reviewer" line that's a variant of "your bin, [location/week]".
4. Specific over generic. Name the weird real things people do to bins (pizza boxes, nappies, the lid left open in the rain, the Christmas ham bone).
5. NO invented product facts/prices/stats. Comedic invented bin-experiences are fine; invented BinSparkle claims are not.
6. The arc: brutal early reviews → the BinSparkle clean → glowing final review. The brand name lands in the late reviews (the clean that changed everything) and CTA is binsparkle.nz.
7. Kiwi flavour where it fits (mate, sorted, reckon, bloody, choice, sweet as) — no caricature.
8. Read every line aloud — if it doesn't sound funny out loud, rewrite it.

DELIVERABLES (return exactly these two, no preamble, no commentary):

=== REVIEWS ===
7 reviews in the arc (low stars early → 5 stars late). Format each:
[rating]/5 | [review title] | [review body] | [reviewer line]

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

  console.log("▶ generating reviews copy via anthropic:claude@opus-4.8 ...");
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
  fs.writeFileSync(path.join(__dirname, "reviews-copy-output.md"), out);
  console.log("\n──── saved to scratch/reviews-copy-output.md ────");
  console.log("today:", JSON.stringify(todaySummary()));
}

main().catch(e => { console.error("✗", e.message); process.exit(1); });
