// Generate "WANTED poster" copy via the script-and-copy model ladder.
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

THE CONCEPT: "WANTED" — a Wild West wanted poster where the dirty wheelie bin is the outlaw. The bin's mugshot is front and centre. It's WANTED for crimes against the driveway and the neighbourhood's nose. The poster's gag: instead of "dead or alive," it's "dead or — let's be honest — cleaned." Three short, specific, funny charges (the weird real things people do to bins — lid left open in the rain since the rugby, harbouring a thriving ecosystem, assaulting the postie's nostrils). The reward is one BinSparkle clean. The payoff: the clean "clears its name." Warm, dry, Kiwi-neighbour humour — the bin is a lovable rogue, not a villain. Funny on the page.

CRAFT CONSTRAINTS (mandatory — outputs breaking these fail):
1. Emojis are allowed (1-2 well-placed max in the captions; on-screen poster text stays emoji-free — it's printed type).
2. This must be FUNNY. Dry, specific, a little savage but ultimately warm. Specific charges beat generic ("left half a pie in me since the Chiefs game" beats "i am dirty").
3. Kiwi flavour where it fits (mate, sorted, reckon, bloody, choice, sweet as, the rugby, the postie) — no caricature.
4. ON-SCREEN text must be TIGHT for video: short, punchy, scannable. No long sentences. Each beat at most 12 words.
5. NO invented product facts/prices/stats. Comedic invented bin-charges are fine; invented BinSparkle claims are not.
6. Read every line aloud — if it doesn't sound funny out loud, rewrite it.

DELIVERABLES (return exactly these two blocks, no preamble, no commentary):

=== ON-SCREEN POSTER ===
The text that appears ON the wanted poster (printed type, no emojis). Give exactly:
- HEADLINE: one word (the big poster word).
- SUBHEAD: the "dead or ___" parody line (short).
- CHARGES: exactly 3 short charge lines (each at most 8 words, specific + funny, the bin's crimes).
- REWARD: one short line (what's offered).
- CTA: one short line ending with binsparkle.nz.

=== CAPTIONS ===
Three captions for the same post, one per platform. Same angle (the bin is wanted; the clean clears its name). Emojis allowed (1-2 max).
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

  console.log("▶ generating WANTED-poster copy via anthropic:claude@opus-4.8 ...");
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
  fs.writeFileSync(path.join(__dirname, "wanted-copy-output.md"), out);
  console.log("\n──── saved to scratch/wanted-copy-output.md ────");
  console.log("today:", JSON.stringify(todaySummary()));
}

main().catch(e => { console.error("✗", e.message); process.exit(1); });
