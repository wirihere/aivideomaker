// One-off: generate the "texts from your bin" message copy + captions via the
// script-and-copy model ladder (Claude Opus 4.8). Text-only textInference —
// the project's judge() is vision-only, so this fills that gap for copy gen.
//
// Run: node scratch/gen-texts-copy.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { loadRunwareKey, assertWithinCap, recordSpend, todaySummary } from "../scripts/lib/runware-vision.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

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

THE CONCEPT: "Texts from your bin" — a text-message conversation between a homeowner and their wheelie bin. The bin texts the homeowner complaining about its week. This should be GENUINELY FUNNY — the comedy is the premise: a wheelie bin has your phone number and is texting you like an exasperated flatmate. Lean into the absurdity. The bin is dramatic, witty, a little passive-aggressive, properly funny — think the voice of a put-upon character in a Taika Waititi bit, not a marketing mascot. Specific vivid complaints beat generic "I'm dirty" — the funnier and more specific the detail, the better. Things escalate comedically through the middle (something at the bottom is... alive). The homeowner gives in and books a BinSparkle clean. The bin texts back, grateful and restored, still funny. Warm, not crude — kiwi register, second person.

CRAFT CONSTRAINTS (mandatory — outputs breaking these fail):
1. NO EMOJIS anywhere. BinSparkle's site has none; the brand voice is plain words. Do not add them. The comedy comes from the writing, not emoji crutches.
2. This must be FUNNY. If a line isn't earning a laugh or a smirk, cut it and write a sharper one. The bin's voice is the whole point — dry, dramatic, witty, passive-aggressive-but-loveable. Give it real personality, not mascot energy.
3. Conversational text-message register: short, lower-case is fine, contractions, the way people actually text. No full marketing sentences. Let messages breathe — sometimes a one-word reply is the funniest choice.
4. Specific over generic. "you left a half-eaten pie in me on tuesday" is funny. "i am dirty" is not. Name the weird, specific, relatable things people do to their bins.
5. NO invented facts, prices, stats, or competitor names. Stick to the product facts above. (Comedic invented *bin experiences* are fine — invented *product claims* are not.)
6. The brand name "BinSparkle" lands naturally near the end (the booking) and the CTA is binsparkle.nz. Don't break the comedic voice to sell.
7. Kiwi flavour where it fits (mate, sorted, reckons, bloody, choice) — but don't overdo it into caricature.
8. Read every line aloud — if it doesn't sound like something a real person would text, or if it doesn't land funny, rewrite it.

DELIVERABLES (return exactly these two, no preamble, no commentary):

=== TEXT CONVERSATION ===
A 7-message back-and-forth, alternating sender (you / bin). Format each line:
[sender] | the message
Message 1 is from the bin (the opener). The conversation should escalate through the middle and resolve with the booking + the bin's grateful reply. Keep each message short (under 15 words).

=== CAPTIONS ===
Three captions for the same post, one per platform. Same angle, different length/hashtag rules. NO emojis in any of them.
- FB (3-5 hashtags, warm, medium ~40 words)
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

  console.log("▶ generating copy via anthropic:claude@opus-4.8 ...");
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
  fs.writeFileSync(path.join(__dirname, "texts-copy-output.md"), out);
  console.log("\n──── saved to scratch/texts-copy-output.md ────");
  console.log("today:", JSON.stringify(todaySummary()));
}

main().catch(e => { console.error("✗", e.message); process.exit(1); });
