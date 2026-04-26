// Copy generation supervisor — turns a URL + template into a video-ready
// `<slug>.copy.json` document the orchestrator can drop into a composition.
//
// Usage (URL mode — deterministic, offline):
//   node scripts/extract-copy.mjs <url>
//   node scripts/extract-copy.mjs <url> --template=warm-community --seconds=30
//   node scripts/extract-copy.mjs <url> --template=kinetic-pop --seconds=15 --name=acme
//
// Usage (framework mode — AI-assisted, calls Anthropic API):
//   node scripts/extract-copy.mjs --framework=AIDA --brand="Local cafe with rotating brunch menu"
//   node scripts/extract-copy.mjs --framework=STAR --brand="…" --vibe=documentary --duration=60
//   node scripts/extract-copy.mjs --framework=PAS  --brand="…" --dry-run
//   node scripts/extract-copy.mjs --framework=FAB  --brand="…" --out=copy.json
//
// Templates (set tone + lexical bias):
//   warm-community  — warm/grounded, "we" pronouns, no jargon
//   kinetic-pop     — punchy, short sentences, action verbs
//   documentary     — considered, third-person, weighty pacing
//   quiet-premium   — spacious, single thoughts, no filler
//
// Seconds (sets narration target length + beat count):
//    15  → 25–40 words,   4 beats   (matches social-reel-15s.html)
//    30  → 60–90 words,   4 beats   (matches hero-promo-30s.html)
//    60  → 120–160 words, 5 beats   (matches case-study-60s.html)
//
// What URL mode does (deterministic, offline-friendly — no LLM call):
//   1. scrapeWorker      — curl the URL, extract title, meta description, h1/h2/h3,
//                          first body paragraphs, primary CTA URL.
//   2. summarizeWorker   — distill raw copy to ~target-length narration.
//   3. beatStructuringWorker — split narration into N beats matching scene count.
//   4. toneTuningWorker  — light rewrites per template's voice.
//   5. ttsSafetyWorker   — strip Māori words, expand numbers, strike invented stats,
//                          enforce English place names. (LEARNINGS §4.)
//
// What framework mode does (AI-assisted, requires ANTHROPIC_API_KEY):
//   1. Reads docs/copy-playbook.md as the source-of-truth for framework rules.
//   2. Builds a strict prompt with: framework structure, word caps, ban list,
//      Tier 1 verb-first CTA rule, brand brief.
//   3. Calls Claude (default `claude-sonnet-4-6`, temperature 0.4) and parses
//      the JSON response into the same COPY_SCHEMA shape URL mode emits, so
//      downstream consumers (compose-from-template.mjs, copy-apply flow) are
//      drop-in compatible.
//
// Output: compositions/<slug>.copy.json (schema documented in COPY_SCHEMA below).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// =====================================================================
// CLI args
// =====================================================================
const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith("--"));
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

// =====================================================================
// Framework mode branch — AI-assisted copy generation from a brand brief.
//
// Triggers when --framework=<name> is passed. This is independent of the
// URL pipeline below: no scrape, no deterministic distillation. Calls
// Claude with a playbook-aware prompt, parses the JSON response into the
// same COPY_SCHEMA shape. Bails out before the rest of the file runs.
// =====================================================================
const SUPPORTED_FRAMEWORKS = [
  "AIDA",
  "PAS",
  "FAB",
  "STAR",
  "BAB",
  "Heros-Journey",
  "Transformation",
  "Q-Payoff",
  "Sensory",
];

if (flags.framework) {
  await runFrameworkMode({ flags, projectRoot });
  // runFrameworkMode never returns — it process.exits.
}

const url = positional[0];
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Usage:");
  console.error("  URL mode:       node scripts/extract-copy.mjs <https://example.com> [--template=warm-community] [--seconds=30] [--name=<slug>] [--structural=<testimonial|founder-story|product-launch>]");
  console.error("  Framework mode: node scripts/extract-copy.mjs --framework=<name> --brand=\"<one-line description>\" [--vibe=kinetic-pop] [--duration=30] [--dry-run] [--out=path]");
  console.error("Templates:  warm-community | kinetic-pop | documentary | quiet-premium");
  console.error("Seconds:    15 | 30 | 60");
  console.error("Structural: testimonial | founder-story | product-launch (optional — opts in to person/launch-date harvest)");
  console.error(`Frameworks: ${SUPPORTED_FRAMEWORKS.join(" | ")}`);
  process.exit(1);
}

const TEMPLATES = ["warm-community", "kinetic-pop", "documentary", "quiet-premium"];
const SECONDS_OK = [15, 30, 60];

const template = flags.template ?? "warm-community";
const seconds = parseInt(flags.seconds ?? "30", 10);

// Structural template (e.g. testimonial, founder-story, product-launch) — used
// only as a gate for the optional personFieldsWorker. Does NOT change the
// vibe/narration pipeline, so it's intentionally a separate flag from
// --template (which selects voice). Default null = no extra extraction.
const structuralTemplate = typeof flags.structural === "string"
  ? flags.structural
  : null;
const STRUCTURAL_TEMPLATES_NEEDING_PERSON_FIELDS = new Set([
  "testimonial",
  "founder-story",
  "product-launch",
]);

if (!TEMPLATES.includes(template)) {
  console.error(`✗ Unknown template: ${template}. Pick from: ${TEMPLATES.join(", ")}`);
  process.exit(1);
}
if (!SECONDS_OK.includes(seconds)) {
  console.error(`✗ Unknown seconds: ${seconds}. Pick from: ${SECONDS_OK.join(", ")}`);
  process.exit(1);
}

// Slug — derive from URL host if not given.
const host = new URL(url).hostname.replace(/^www\./, "").replace(/\.[a-z]+$/, "");
const slug = (flags.name ?? host).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

// Per-second presets — narration target band + scene count.
const PRESETS = {
  15: { narrLow: 25,  narrHigh: 40,  beatCount: 4 },
  30: { narrLow: 60,  narrHigh: 90,  beatCount: 4 },
  60: { narrLow: 120, narrHigh: 160, beatCount: 5 },
};
const preset = PRESETS[seconds];

console.log(`▶ extract-copy "${slug}" from ${url}`);
console.log(`  template: ${template} · seconds: ${seconds} · target ${preset.narrLow}-${preset.narrHigh} words · ${preset.beatCount} beats`);
if (structuralTemplate) {
  console.log(`  structural: ${structuralTemplate}${STRUCTURAL_TEMPLATES_NEEDING_PERSON_FIELDS.has(structuralTemplate) ? " (will harvest person/launch fields)" : ""}`);
}

// =====================================================================
// 1. scrapeWorker — curl the URL, extract semantic copy.
// =====================================================================
function scrapeWorker(targetUrl) {
  console.log(`  [scrape] fetching ${targetUrl}…`);
  let html = "";
  try {
    html = execSync(`curl -s -L --max-time 20 "${targetUrl}"`, {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (err) {
    console.error(`✗ couldn't fetch ${targetUrl}: ${err.message}`);
    process.exit(1);
  }
  if (!html || html.length < 100) {
    console.error(`✗ response too short (${html.length} bytes)`);
    process.exit(1);
  }
  console.log(`  [scrape] fetched ${(html.length / 1024).toFixed(1)} KB`);

  // Strip <script>, <style>, <noscript> blocks before tag walking.
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");

  const decode = (s) =>
    s
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-z0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  // <title>
  const title = decode(stripped.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || slug).slice(0, 120);

  // <meta name="description"> — primary signal, often the brand's own tagline.
  const metaDescription =
    stripped.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    stripped.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ||
    stripped.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    "";

  // Headings — h1/h2/h3 in document order. Trim, dedupe.
  const headings = { h1: [], h2: [], h3: [] };
  for (const level of [1, 2, 3]) {
    const re = new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi");
    for (const m of stripped.matchAll(re)) {
      const txt = decode(m[1]);
      if (txt.length > 4 && txt.length < 220 && !headings[`h${level}`].includes(txt)) {
        headings[`h${level}`].push(txt);
      }
    }
  }

  // Paragraphs — first ~12 with reasonable length.
  const paragraphs = [];
  for (const m of stripped.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const txt = decode(m[1]);
    if (txt.length >= 24 && txt.length < 600) {
      if (!paragraphs.includes(txt)) paragraphs.push(txt);
      if (paragraphs.length >= 14) break;
    }
  }

  // List items — bullet content often = product benefits.
  const listItems = [];
  for (const m of stripped.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const txt = decode(m[1]);
    if (txt.length >= 8 && txt.length < 240 && !listItems.includes(txt)) listItems.push(txt);
    if (listItems.length >= 24) break;
  }

  // CTA — first <a> whose text suggests an action and href is on-domain or root.
  const ctaCandidates = [];
  const aHostRe = new RegExp(`^https?:\\/\\/(www\\.)?${host.replace(/[.\-]/g, "[.\\-]")}`, "i");
  for (const m of stripped.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1].trim();
    const text = decode(m[2]);
    if (!text || text.length < 2 || text.length > 60) continue;
    if (/^(home|menu|skip)$/i.test(text)) continue;
    const score =
      (/(get|try|join|donate|sign|start|learn|find|share|help|contact|book|shop|buy|register|subscribe|read|see|view|explore|connect|give|reach|visit|browse)/i.test(text) ? 3 : 0) +
      (href.startsWith("/") || aHostRe.test(href) ? 1 : 0) +
      (text.length < 24 ? 1 : 0);
    if (score >= 2) ctaCandidates.push({ text, href, score });
  }
  ctaCandidates.sort((a, b) => b.score - a.score);
  const ctaText = ctaCandidates[0]?.text || null;

  console.log(
    `  [scrape] title="${title}" · meta=${metaDescription ? metaDescription.length + "ch" : "—"} · h1=${headings.h1.length} · h2=${headings.h2.length} · h3=${headings.h3.length} · p=${paragraphs.length} · li=${listItems.length}`
  );

  // `rawHtml` is the original (un-stripped) HTML so personFieldsWorker can
  // search <script type="application/ld+json"> blocks etc.; `strippedHtml` is
  // the same body with <script>/<style>/<noscript> removed for tag walking.
  return {
    title, metaDescription, headings, paragraphs, listItems, ctaText,
    rawHtml: html, strippedHtml: stripped,
  };
}

// =====================================================================
// 2. summarizeWorker — distill scraped copy to a target-length narration.
//
// Strategy: rank candidate sentences by signal (meta description first, then
// h1, then first paragraphs, then h2 lines), keep the strongest ones until
// we hit the target word band, lightly stitched with template-aware connective
// phrasing.
// =====================================================================
function summarizeWorker(scraped, { wordLow, wordHigh, template }) {
  const all = [];

  // Meta description first — usually the brand's hand-tuned one-liner.
  if (scraped.metaDescription) all.push({ src: "meta", text: scraped.metaDescription });

  // H1 — top of mind statement.
  for (const h of scraped.headings.h1) all.push({ src: "h1", text: h });

  // First few paragraphs — supporting detail.
  for (const p of scraped.paragraphs.slice(0, 6)) all.push({ src: "p", text: p });

  // H2 — secondary structure / category labels.
  for (const h of scraped.headings.h2.slice(0, 6)) all.push({ src: "h2", text: h });

  // Split each candidate into sentences.
  const sentences = [];
  for (const c of all) {
    const parts = c.text
      .split(/(?<=[.!?])\s+(?=[A-Z])/) // sentence boundary heuristic
      .map(s => s.trim())
      .filter(s => s.length >= 8);
    for (const s of parts) {
      if (s.split(/\s+/).length > 35) continue; // skip wall-of-text sentences
      // dedupe (case-insensitive)
      if (sentences.some(x => x.text.toLowerCase() === s.toLowerCase())) continue;
      sentences.push({ src: c.src, text: s });
    }
  }

  // Pick sentences until word count hits the target band. Prefer meta/h1 first,
  // then short clear sentences over long ones.
  const order = { meta: 0, h1: 1, p: 2, h2: 3, h3: 4 };
  sentences.sort((a, b) => {
    const sa = order[a.src] ?? 9;
    const sb = order[b.src] ?? 9;
    if (sa !== sb) return sa - sb;
    return a.text.length - b.text.length;
  });

  const picked = [];
  let words = 0;
  for (const s of sentences) {
    const wc = s.text.split(/\s+/).length;
    if (words + wc > wordHigh + 6) continue;
    picked.push(s.text);
    words += wc;
    if (words >= wordLow) break;
  }

  // If we're still under the floor, just append shorter remaining sentences.
  if (words < wordLow) {
    for (const s of sentences) {
      if (picked.includes(s.text)) continue;
      const wc = s.text.split(/\s+/).length;
      if (words + wc > wordHigh + 6) continue;
      picked.push(s.text);
      words += wc;
      if (words >= wordLow) break;
    }
  }

  // If we still came up empty (very thin pages), seed from listItems / h3.
  if (picked.length === 0) {
    for (const item of [...scraped.listItems, ...scraped.headings.h3]) {
      const wc = item.split(/\s+/).length;
      if (wc < 3) continue;
      picked.push(item.endsWith(".") ? item : item + ".");
      words += wc;
      if (words >= wordLow) break;
    }
  }

  // Make sure each fragment ends with a period.
  let narration = picked
    .map(s => (/[.!?]$/.test(s) ? s : s + "."))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // Trim if we badly overshot.
  const finalWords = narration.split(/\s+/).filter(Boolean);
  if (finalWords.length > wordHigh + 8) {
    narration = finalWords.slice(0, wordHigh).join(" ") + ".";
  }

  console.log(`  [summarize] ${narration.split(/\s+/).filter(Boolean).length} words from ${picked.length} sentences (target ${wordLow}-${wordHigh})`);
  return narration;
}

// =====================================================================
// 3. beatStructuringWorker — split narration into N beats matching scenes.
//
// Each beat = { kicker, headline, body }.
//   kicker  = 1-3 word uppercase label (per template's vocabulary)
//   headline = the strongest sentence for that beat (visual hero text)
//   body    = a short supporting line (or empty if narration only had one)
// =====================================================================
const BEAT_KICKERS = {
  "warm-community": ["WHO WE ARE", "WHAT WE DO", "HOW IT FEELS", "WHY IT MATTERS", "JOIN IN"],
  "kinetic-pop":    ["INTRO", "PROOF", "PUNCH", "PAYOFF", "GO"],
  "documentary":    ["THE CONTEXT", "THE APPROACH", "THE RESULT", "THE VOICE", "THE NEXT STEP"],
  "quiet-premium":  ["INTRODUCING", "THE WORK", "THE DETAIL", "THE OUTCOME", "DISCOVER"],
};

function beatStructuringWorker(narration, scraped, { beatCount, template }) {
  // Split narration on sentence boundaries.
  const sentences = narration
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Distribute sentences across beats. Try to give each beat ≥1 sentence; if
  // we have fewer sentences than beats, supplement from h2/listItems/h3.
  const supplements = [
    ...scraped.headings.h2,
    ...scraped.listItems,
    ...scraped.headings.h3,
    ...scraped.paragraphs.slice(6),
  ]
    .map(s => s.replace(/\s+/g, " ").trim())
    .filter(s => s.length >= 6 && s.length < 200);

  const supplementsSeen = new Set();
  function nextSupplement() {
    for (const s of supplements) {
      if (!supplementsSeen.has(s.toLowerCase())) {
        supplementsSeen.add(s.toLowerCase());
        return s;
      }
    }
    return null;
  }

  // Bucket sentences into N roughly-equal groups.
  const buckets = Array.from({ length: beatCount }, () => []);
  if (sentences.length >= beatCount) {
    const perBeat = Math.ceil(sentences.length / beatCount);
    for (let i = 0; i < sentences.length; i++) {
      const idx = Math.min(beatCount - 1, Math.floor(i / perBeat));
      buckets[idx].push(sentences[i]);
    }
  } else {
    // Spread sentences thinly; fill missing slots from supplements.
    sentences.forEach((s, i) => buckets[i].push(s));
  }

  const kickers = BEAT_KICKERS[template];

  function shorten(s, max = 60) {
    if (!s) return "";
    s = s.replace(/[""]/g, '"').replace(/['']/g, "'");
    if (s.length <= max) return s;
    // Cut at a word boundary near `max`.
    const cut = s.slice(0, max).replace(/[\s,;:]+\S*$/, "");
    return cut + (cut.endsWith(".") ? "" : ".");
  }

  function toHeadline(s) {
    if (!s) return "";
    // Strip trailing period for display headlines (visual-text style).
    return shorten(s.replace(/[.]$/, "."), 64);
  }

  function toBody(s) {
    if (!s) return "";
    return shorten(s, 90);
  }

  const beats = [];
  for (let i = 0; i < beatCount; i++) {
    let bucket = buckets[i];
    if (!bucket.length) {
      const sup = nextSupplement();
      if (sup) bucket = [sup];
    }
    // Headline = first sentence; body = second (or trimmed remainder).
    const headlineSrc = bucket[0] || nextSupplement() || "";
    const bodySrc = bucket.slice(1).join(" ") || nextSupplement() || "";

    beats.push({
      kicker: kickers[i] || `BEAT ${i + 1}`,
      headline: toHeadline(headlineSrc),
      body: toBody(bodySrc),
    });
  }

  console.log(`  [beats] structured ${beats.length} beats (${beats.filter(b => b.body).length} with body)`);
  return beats;
}

// =====================================================================
// 4. toneTuningWorker — gentle per-template lexical adjustments.
//
// Conservative on purpose. We're not rewriting from scratch (LEARNINGS §4: do
// not invent facts) — just nudging filler words and hedging out where they
// clash with the template's voice.
// =====================================================================
function toneTuningWorker(narration, beats, { template }) {
  const adjust = (s) => {
    if (!s) return s;
    let out = s;

    if (template === "kinetic-pop") {
      // Prefer punchier word choices. Strip mealy connectors.
      out = out
        .replace(/\bin order to\b/gi, "to")
        .replace(/\bvery (?=\w)/gi, "")
        .replace(/\bsimply\b/gi, "")
        .replace(/\bjust about\b/gi, "")
        .replace(/\butilise\b/gi, "use")
        .replace(/\butilize\b/gi, "use")
        .replace(/\s{2,}/g, " ")
        .trim();
    } else if (template === "documentary") {
      // Documentary stays third-person — strip second-person hype.
      out = out
        .replace(/\byou'll\b/gi, "they will")
        .replace(/\byou'd\b/gi, "they would")
        .replace(/\byou will\b/gi, "they will")
        .replace(/!/g, ".")
        .trim();
    } else if (template === "quiet-premium") {
      // Quiet-premium prefers single thoughts. Strip exclamation marks +
      // intensifier filler.
      out = out
        .replace(/!/g, ".")
        .replace(/\bamazing\b/gi, "considered")
        .replace(/\bawesome\b/gi, "")
        .replace(/\bsuper\s+(?=\w)/gi, "")
        .replace(/\bvery\s+(?=\w)/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    } else if (template === "warm-community") {
      // Warm-community softens corporate jargon.
      out = out
        .replace(/\bleverage\b/gi, "use")
        .replace(/\butilise\b/gi, "use")
        .replace(/\butilize\b/gi, "use")
        .replace(/\bsynergy\b/gi, "")
        .replace(/\bsolutions\b/gi, "help")
        .replace(/\bstakeholders\b/gi, "people")
        .replace(/\s{2,}/g, " ")
        .trim();
    }

    return out;
  };

  const tunedNarration = adjust(narration);
  const tunedBeats = beats.map(b => ({
    kicker: b.kicker, // kickers come from a fixed map per template
    headline: adjust(b.headline),
    body: adjust(b.body),
  }));

  return { narration: tunedNarration, beats: tunedBeats };
}

// =====================================================================
// 5. ttsSafetyWorker — apply LEARNINGS §4 hard rules to narration only.
//
//    - Strip Māori / te reo words (Edge TTS mispronounces them).
//    - Replace common Māori place-names with English equivalents.
//    - Spell out short numbers (zero-risk across voices).
//    - Strip parenthetical asides — they read awkwardly in TTS.
//    - Compact whitespace.
//
// Visual on-screen text (beats) is left alone — te reo is welcome in the
// frame; the rule only blocks it from the spoken track.
// =====================================================================
const MAORI_PLACE_MAP = new Map([
  [/\bAotearoa\b/g, "New Zealand"],
  [/\bTāmaki Makaurau\b/g, "Auckland"],
  [/\bTamaki Makaurau\b/g, "Auckland"],
  [/\bTe Whanganui-a-Tara\b/g, "Wellington"],
  [/\bŌtautahi\b/g, "Christchurch"],
  [/\bOtautahi\b/g, "Christchurch"],
  [/\bWaikato\b/g, "Waikato"], // English-recognised
]);

// Common te reo words that creep into NZ marketing copy. Replace inline rather
// than drop, so the sentence still reads.
const MAORI_WORD_MAP = new Map([
  [/\bkia ora\b/gi, "hello"],
  [/\bwhānau\b/gi, "family"],
  [/\bwhanau\b/gi, "family"],
  [/\bmana\b/gi, "respect"],
  [/\bmahi\b/gi, "work"],
  [/\bawhi\b/gi, "support"],
  [/\baroha\b/gi, "love"],
  [/\bkaupapa\b/gi, "purpose"],
  [/\bhapū\b/gi, "community"],
  [/\bhapu\b/gi, "community"],
  [/\biwi\b/gi, "community"],
  [/\bmarae\b/gi, "meeting place"],
  [/\bngā\b/gi, "the"],
  [/\bnga\b/gi, "the"],
  [/\bte\b(?=\s+[a-z])/gi, "the"], // preposition "te" — only mid-sentence
]);

// Detect numeric stats that look like specific claims (X% of Y, $X million,
// "in YYYY"). We won't strip them — but flag them so the user sees them
// before they hit the TTS pipeline.
function detectStatsFlags(narration) {
  const flags = [];
  for (const m of narration.matchAll(/\b\d+(?:[.,]\d+)?%\b/g)) flags.push(m[0]);
  for (const m of narration.matchAll(/\b\$\d[\d,.]*\b/g)) flags.push(m[0]);
  for (const m of narration.matchAll(/\b\d{1,3}(?:,\d{3})+\b/g)) flags.push(m[0]);
  return flags;
}

// Safe number-to-word for tiny integers (per LEARNINGS §3 TTS rules).
const NUM_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

function ttsSafetyWorker(narration) {
  let out = narration;

  // Strip parenthetical asides.
  out = out.replace(/\s*\([^)]*\)/g, "");

  // Replace Māori place names → English.
  for (const [re, repl] of MAORI_PLACE_MAP) out = out.replace(re, repl);
  // Replace common te reo words → English equivalents.
  for (const [re, repl] of MAORI_WORD_MAP) out = out.replace(re, repl);

  // Spell out small standalone integers. Keep larger / punctuated numbers.
  out = out.replace(/\b(\d{1,2})\b/g, (m, n) => {
    const i = parseInt(n, 10);
    if (i <= 12) return NUM_WORDS[i];
    return m;
  });

  // Acronym hint — split obvious 3-letter all-caps acronyms with periods so
  // the voice reads them letter-by-letter.
  out = out.replace(/\b([A-Z]{3,5})\b/g, (m) => m.split("").join("."));

  // Compact whitespace + leading/trailing trim.
  out = out.replace(/\s{2,}/g, " ").trim();

  // Light punctuation tidy: never two periods in a row except `...` (which
  // Edge TTS ignores anyway, per LEARNINGS §3). Replace `...` with `,` for
  // a real beat.
  out = out.replace(/\.\.\./g, ",").replace(/\s+([,.!?])/g, "$1");

  const flags = detectStatsFlags(out);
  if (flags.length) {
    console.log(`  [tts-safety] potential numeric claims kept (verify against source): ${flags.join(", ")}`);
  } else {
    console.log(`  [tts-safety] no numeric claims detected — copy is description-only`);
  }

  return out;
}

// =====================================================================
// 6. personFieldsWorker — harvest optional template-specific fields:
//
//    - customerName / customerRole  (testimonial templates)
//    - founderName  / founderRole   (founder-story templates)
//    - launchDate                   (product-launch templates)
//
// Runs only when `--structural=<name>` opts in to one of:
//   testimonial | founder-story | product-launch
//
// Returns `null` for any field it can't pin down with confidence — we
// never invent customer/founder names (memory: no fake facts about real
// brands). The render pipeline falls back to brandName / kicker / CTA verb
// if the field is null, so missing values degrade gracefully.
//
// Sources we look at, in order of trust:
//   1. schema.org JSON-LD (Person, Review, Organization.founder, Event,
//      Product.releaseDate). Hand-tuned by the brand → highest signal.
//   2. Microdata / RDFa hints (`itemtype` / `property` on visible blocks).
//   3. HTML pattern matches in the rendered copy: "Meet our founder, X",
//      "X, Co-Founder", "Available <date>", review/quote attributions.
//
// We deliberately keep this conservative — false positives are worse than
// nulls because templates have safe fallbacks but injected wrong names hit
// the screen verbatim.
// =====================================================================

function personFieldsWorker(scraped, { structuralTemplate }) {
  // Default — populate ALL three pairs as null; they're optional schema
  // fields and downstream template-injection treats null as "skip / fall back".
  const empty = {
    customerName: null,
    customerRole: null,
    founderName: null,
    founderRole: null,
    launchDate: null,
  };
  if (!structuralTemplate || !STRUCTURAL_TEMPLATES_NEEDING_PERSON_FIELDS.has(structuralTemplate)) {
    return empty;
  }

  const raw = scraped.rawHtml || "";
  const stripped = scraped.strippedHtml || "";
  if (!raw) return empty;

  // ----- 1. Collect JSON-LD blocks (the strongest signal). ------------
  // schema.org snippets are wrapped in <script type="application/ld+json">…</script>.
  // The exact keys we care about live under @type Person, Review, Organization,
  // Product, Event, NewsArticle (PR-style press release).
  const ldBlocks = [];
  for (const m of raw.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const txt = m[1].trim();
    if (!txt) continue;
    try {
      const parsed = JSON.parse(txt);
      if (Array.isArray(parsed)) ldBlocks.push(...parsed);
      else if (parsed && parsed["@graph"] && Array.isArray(parsed["@graph"])) ldBlocks.push(...parsed["@graph"]);
      else ldBlocks.push(parsed);
    } catch {
      // Some sites emit malformed JSON-LD — skip silently.
    }
  }

  // Walk a node + nested children, collecting nodes whose @type matches the
  // requested set (case-insensitive, supports arrays).
  const collectByType = (typeNames) => {
    const wanted = new Set(typeNames.map((t) => t.toLowerCase()));
    const out = [];
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      const t = node["@type"];
      const types = Array.isArray(t) ? t : (t ? [t] : []);
      if (types.some((x) => typeof x === "string" && wanted.has(x.toLowerCase()))) out.push(node);
      // Recurse into nested known props.
      for (const key of Object.keys(node)) {
        const v = node[key];
        if (Array.isArray(v)) v.forEach(visit);
        else if (v && typeof v === "object") visit(v);
      }
    };
    ldBlocks.forEach(visit);
    return out;
  };

  // Helper: pull a person's display name + role/jobTitle from a JSON-LD node.
  const personFromNode = (node) => {
    if (!node) return null;
    let name = null;
    if (typeof node.name === "string") name = node.name;
    else if (node.name && typeof node.name === "object" && typeof node.name["@value"] === "string") name = node.name["@value"];
    else if (typeof node.givenName === "string" && typeof node.familyName === "string") name = `${node.givenName} ${node.familyName}`;
    if (typeof name !== "string") return null;
    name = name.replace(/\s+/g, " ").trim();
    if (!name || name.length < 2 || name.length > 60) return null;
    let role = null;
    for (const key of ["jobTitle", "role", "description"]) {
      const v = node[key];
      if (typeof v === "string" && v.trim().length >= 2 && v.trim().length <= 80) { role = v.trim(); break; }
    }
    return { name, role };
  };

  const out = { ...empty };

  // ----- 2. Customer (testimonial) ------------------------------------
  if (structuralTemplate === "testimonial") {
    // 2a. JSON-LD Review: { author: Person|string, reviewBody, … }
    const reviews = collectByType(["Review"]);
    for (const r of reviews) {
      const author = r.author;
      let person = null;
      if (typeof author === "string") person = { name: author.trim(), role: null };
      else if (author && typeof author === "object") person = personFromNode(author);
      if (person && person.name) {
        out.customerName = person.name;
        out.customerRole = person.role;
        break;
      }
    }
    // 2b. Fallback: <figure>/<blockquote> with cite + small role label.
    //     Look for <cite>Name</cite>, then a sibling chip with "—" or a
    //     comma-separated role.
    if (!out.customerName) {
      // Pattern: <blockquote>"…"</blockquote><cite>Mei Tan, Operations Lead</cite>
      const m = stripped.match(/<cite\b[^>]*>\s*([A-Z][A-Za-z'\-\s]{1,40}?)(?:\s*[,—–-]\s*([A-Za-z'\-\s,&]{2,60}))?\s*<\/cite>/);
      if (m) {
        const candName = m[1].trim();
        if (candName.split(/\s+/).length >= 2) {
          out.customerName = candName;
          if (m[2]) out.customerRole = m[2].trim().replace(/\s+/g, " ");
        }
      }
    }
  }

  // ----- 3. Founder (founder-story) -----------------------------------
  if (structuralTemplate === "founder-story") {
    // 3a. JSON-LD Organization.founder
    const orgs = collectByType(["Organization", "Corporation", "LocalBusiness"]);
    for (const org of orgs) {
      const f = org.founder ?? org.founders;
      const cands = Array.isArray(f) ? f : (f ? [f] : []);
      for (const c of cands) {
        const person = typeof c === "string"
          ? { name: c.trim(), role: "Founder" }
          : personFromNode(c);
        if (person && person.name) {
          out.founderName = person.name;
          out.founderRole = person.role || "Founder";
          break;
        }
      }
      if (out.founderName) break;
    }
    // 3b. JSON-LD Person with jobTitle containing "founder|ceo|chief".
    if (!out.founderName) {
      const persons = collectByType(["Person"]);
      for (const p of persons) {
        const person = personFromNode(p);
        if (!person) continue;
        if (person.role && /\b(founder|co-?founder|ceo|chief|owner)\b/i.test(person.role)) {
          out.founderName = person.name;
          out.founderRole = person.role;
          break;
        }
      }
    }
    // 3c. Fallback: HTML pattern "Meet our founder, X" / "Founded by X".
    if (!out.founderName) {
      const patterns = [
        /(?:meet (?:our|the))\s+(?:co-?)?founder[,:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z'\-]+){1,2})/i,
        /founded by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z'\-]+){1,2})/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z'\-]+){1,2})\s*[,—–-]\s*(?:co-?)?founder\b/,
      ];
      for (const re of patterns) {
        const m = stripped.match(re);
        if (m && m[1]) {
          out.founderName = m[1].trim();
          if (!out.founderRole) {
            // Sniff a role nearby ("Co-Founder & CEO").
            const roleMatch = stripped.match(new RegExp(`${m[1].replace(/[-\\^$*+?.()|[\\]{}]/g, "\\$&")}[^<]{0,80}?\\b((?:co-?)?founder(?:[^.<]{0,40})?)`, "i"));
            out.founderRole = roleMatch ? roleMatch[1].trim() : "Founder";
          }
          break;
        }
      }
    }
  }

  // ----- 4. Launch date (product-launch) ------------------------------
  if (structuralTemplate === "product-launch") {
    // 4a. JSON-LD Product.releaseDate / datePublished
    const products = collectByType(["Product", "SoftwareApplication", "MobileApplication"]);
    for (const p of products) {
      const d = p.releaseDate || p.datePublished;
      if (typeof d === "string" && d.trim().length >= 4) { out.launchDate = d.trim(); break; }
    }
    // 4b. JSON-LD Event.startDate
    if (!out.launchDate) {
      const events = collectByType(["Event"]);
      for (const e of events) {
        const d = e.startDate;
        if (typeof d === "string" && d.trim().length >= 4) { out.launchDate = d.trim(); break; }
      }
    }
    // 4c. NewsArticle.datePublished (press releases announcing a launch).
    if (!out.launchDate) {
      const news = collectByType(["NewsArticle", "Article", "PressRelease"]);
      for (const n of news) {
        const d = n.datePublished;
        if (typeof d === "string" && d.trim().length >= 4) { out.launchDate = d.trim(); break; }
      }
    }
    // 4d. Fallback: HTML pattern matching common launch phrasing.
    if (!out.launchDate) {
      const patterns = [
        /\bAvailable\s+(?:from\s+|on\s+)?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/,
        /\bLaunch(?:ing|es)\s+(?:on\s+)?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/,
        /\bComing\s+([A-Z][a-z]+\s+\d{4})/,
        /\b(\d{4}-\d{2}-\d{2})\b/, // bare ISO date — last resort
      ];
      for (const re of patterns) {
        const m = stripped.match(re);
        if (m && m[1]) { out.launchDate = m[1].trim(); break; }
      }
    }
  }

  // Tidy log line — only mention fields we actually populated.
  const populated = Object.entries(out).filter(([, v]) => v !== null && v !== "");
  if (populated.length) {
    console.log(`  [person-fields] harvested: ${populated.map(([k, v]) => `${k}="${String(v).slice(0, 40)}"`).join(", ")}`);
  } else {
    console.log(`  [person-fields] no candidates found for ${structuralTemplate} (fields will be null — template fallbacks apply)`);
  }
  return out;
}

// =====================================================================
// Run the pipeline.
// =====================================================================
const scraped = scrapeWorker(url);

let narration = summarizeWorker(scraped, {
  wordLow: preset.narrLow,
  wordHigh: preset.narrHigh,
  template,
});

// Re-dispatch if narration is too thin (charter rule: <40 words for 30s = re-dispatch).
const initialWordCount = narration.split(/\s+/).filter(Boolean).length;
const reDispatchFloor = preset.narrLow * 0.7; // 70% of low band = "sparse"
if (initialWordCount < reDispatchFloor) {
  console.log(`  [supervisor] narration sparse (${initialWordCount} < ${reDispatchFloor.toFixed(0)}) — re-dispatching with broader source pool`);
  // Re-summarize with a wider net: include list items and h3.
  const widened = {
    ...scraped,
    paragraphs: [
      ...scraped.paragraphs,
      ...scraped.listItems.map(li => li.endsWith(".") ? li : li + "."),
      ...scraped.headings.h3.map(h => h.endsWith(".") ? h : h + "."),
    ],
  };
  narration = summarizeWorker(widened, {
    wordLow: preset.narrLow,
    wordHigh: preset.narrHigh,
    template,
  });
}

let beats = beatStructuringWorker(narration, scraped, {
  beatCount: preset.beatCount,
  template,
});

// Re-dispatch if any beat ended up with no headline (charter: mismatched scene count = re-dispatch).
const emptyBeats = beats.filter(b => !b.headline).length;
if (emptyBeats > 0) {
  console.log(`  [supervisor] ${emptyBeats} beat(s) have no headline — re-dispatching beat-structuring with full supplement pool`);
  // Force every empty beat to receive a supplement from a broader pool.
  beats = beatStructuringWorker(narration, scraped, {
    beatCount: preset.beatCount,
    template,
  });
  // Fallback: if STILL empty, use the brand title for that beat.
  beats = beats.map((b) =>
    b.headline ? b : { ...b, headline: scraped.title.split(/[—–:|·]/)[0].trim() + "." }
  );
}

const tuned = toneTuningWorker(narration, beats, { template });
narration = tuned.narration;
beats = tuned.beats;

// Apply TTS-safety to narration only (per charter §4).
narration = ttsSafetyWorker(narration);

// =====================================================================
// CTA — derive verb + tagline.
// =====================================================================
const CTA_VERBS = {
  "warm-community": "Visit",
  "kinetic-pop":    "Try",
  "documentary":    "Learn more at",
  "quiet-premium":  "Discover",
};

const ctaTagline =
  scraped.metaDescription
    ? scraped.metaDescription.split(/[.!?]/)[0].trim()
    : (scraped.headings.h1[0] || scraped.title).split(/[—–:|·]/).pop().trim();

const cta = {
  verb: scraped.ctaText && /^[A-Za-z][\w\s]+$/.test(scraped.ctaText)
    ? scraped.ctaText.split(/\s+/).slice(0, 2).join(" ")
    : CTA_VERBS[template],
  url,
  tagline: ctaTagline.slice(0, 80),
};

// =====================================================================
// Optional template-specific person/launch-date fields. Skipped entirely
// unless --structural=<testimonial|founder-story|product-launch>. Returns
// an object with all five keys; nulls mean "not found, fall back".
// =====================================================================
const personFields = personFieldsWorker(scraped, { structuralTemplate });

// =====================================================================
// Build final output document and write it.
// =====================================================================
const COPY_SCHEMA = {
  slug,
  url,
  title: scraped.title,
  template,
  seconds,
  narration,
  beats,
  cta,
  // Optional fields — only emitted into the JSON when this run is for a
  // structural template that needs them. Existing copy.json files written
  // before this addition stay valid: applyCopyToTemplate() reads the keys
  // with `?.` and falls back to brandName / kicker / CTA verb when absent.
  ...(structuralTemplate && STRUCTURAL_TEMPLATES_NEEDING_PERSON_FIELDS.has(structuralTemplate)
    ? {
        customerName: personFields.customerName,
        customerRole: personFields.customerRole,
        founderName: personFields.founderName,
        founderRole: personFields.founderRole,
        launchDate: personFields.launchDate,
      }
    : {}),
  // Diagnostic — useful for the orchestrator to know how the document was built.
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10), // date only, deterministic
    wordCount: narration.split(/\s+/).filter(Boolean).length,
    beatCount: beats.length,
    structuralTemplate: structuralTemplate || null,
    sourcedFrom: {
      metaDescription: !!scraped.metaDescription,
      h1Count: scraped.headings.h1.length,
      paragraphCount: scraped.paragraphs.length,
    },
  },
};

const outDir = path.join(projectRoot, "compositions");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${slug}.copy.json`);
fs.writeFileSync(outPath, JSON.stringify(COPY_SCHEMA, null, 2) + "\n", "utf8");

console.log(`✓ wrote ${path.relative(projectRoot, outPath).replace(/\\/g, "/")}`);
console.log(`  narration: ${COPY_SCHEMA.meta.wordCount} words (target ${preset.narrLow}-${preset.narrHigh})`);
console.log(`  beats: ${beats.length} · cta: "${cta.verb}" → ${cta.url}`);

// Hard-stop if we ended up outside the band — the supervisor's charter says
// don't ship narration <40 words for 30s.
if (COPY_SCHEMA.meta.wordCount < preset.narrLow) {
  console.warn(`⚠ narration is ${COPY_SCHEMA.meta.wordCount} words — below floor of ${preset.narrLow}. Source page may be too thin; re-run with a content-richer URL or hand-edit the JSON.`);
  process.exitCode = 2;
}

// =====================================================================
// Framework mode implementation
// =====================================================================
//
// AI-assisted copy generation. Reads the live copy-playbook.md so framework
// rules stay in lock-step with the doc — no hard-coded list of constraints
// inside the script. The user provides a brand brief; Claude returns a
// strict-JSON document matching COPY_SCHEMA.
async function runFrameworkMode({ flags, projectRoot }) {
  const framework = flags.framework;
  const brand = flags.brand;
  const vibe = flags.vibe ?? "kinetic-pop";
  const duration = parseInt(flags.duration ?? "30", 10);
  const model = flags.model ?? "claude-sonnet-4-6";
  const temperature = flags.temperature !== undefined
    ? parseFloat(flags.temperature)
    : 0.4;
  const isDryRun = flags["dry-run"] === true;
  const outFlag = flags.out;

  // 1. Validate framework name.
  if (!SUPPORTED_FRAMEWORKS.includes(framework)) {
    console.error(`✗ Unknown framework: "${framework}". Pick from: ${SUPPORTED_FRAMEWORKS.join(", ")}`);
    process.exit(1);
  }

  // 2. Validate brand brief.
  if (typeof brand !== "string" || brand.length < 8) {
    console.error("✗ --brand=\"<one-line description>\" is required (min 8 chars).");
    console.error(`  e.g. node scripts/extract-copy.mjs --framework=${framework} --brand="Local cafe with rotating brunch menu, walk-up only, weekends busiest"`);
    process.exit(1);
  }

  // 3. Validate vibe.
  const VIBES = ["warm-community", "kinetic-pop", "documentary", "quiet-premium"];
  if (!VIBES.includes(vibe)) {
    console.error(`✗ Unknown vibe: "${vibe}". Pick from: ${VIBES.join(", ")}`);
    process.exit(1);
  }

  // 4. Validate duration.
  const DURATIONS = [15, 20, 30, 45, 60];
  if (!DURATIONS.includes(duration)) {
    console.error(`✗ Unknown duration: ${duration}. Pick from: ${DURATIONS.join(", ")}`);
    process.exit(1);
  }

  // Per-duration narration band + beat count (matches the URL-mode PRESETS
  // for 15/30/60; 20s and 45s borrow neighbouring bands).
  const FW_PRESETS = {
    15: { narrLow: 25,  narrHigh: 40,  beatCount: 4 },
    20: { narrLow: 35,  narrHigh: 55,  beatCount: 4 },
    30: { narrLow: 60,  narrHigh: 90,  beatCount: 4 },
    45: { narrLow: 90,  narrHigh: 130, beatCount: 5 },
    60: { narrLow: 120, narrHigh: 160, beatCount: 5 },
  };
  const preset = FW_PRESETS[duration];

  // 5. Read copy-playbook.md so framework rules come from a single source.
  const playbookPath = path.join(projectRoot, "docs", "copy-playbook.md");
  if (!fs.existsSync(playbookPath)) {
    console.error(`✗ docs/copy-playbook.md not found at ${playbookPath}`);
    process.exit(1);
  }
  const playbookText = fs.readFileSync(playbookPath, "utf8");

  // 6. Slug — derive from brand brief if --name not given.
  const slug = (flags.name
    ? String(flags.name)
    : brand.toLowerCase().split(/\s+/).slice(0, 3).join("-")
  ).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "brand";

  // 7. Build the prompt.
  const prompt = buildFrameworkPrompt({
    framework,
    brand,
    vibe,
    duration,
    preset,
    playbookText,
    slug,
  });

  if (isDryRun) {
    console.log("▶ extract-copy [framework mode · DRY RUN] — prompt below, no API call");
    console.log(`  framework: ${framework} · vibe: ${vibe} · duration: ${duration}s · model: ${model} · temp: ${temperature}`);
    console.log(`  brand: ${brand}`);
    console.log("─".repeat(72));
    console.log(prompt);
    console.log("─".repeat(72));
    process.exit(0);
  }

  // 8. Auth check.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("✗ ANTHROPIC_API_KEY is not set in the environment.");
    console.error("  Set it (e.g. `set ANTHROPIC_API_KEY=sk-ant-...` on Windows, `export` on bash) and re-run.");
    console.error("  Or use --dry-run to preview the prompt without calling the API.");
    process.exit(1);
  }

  console.log(`▶ extract-copy [framework mode] — ${framework} for "${brand.slice(0, 60)}${brand.length > 60 ? "…" : ""}"`);
  console.log(`  vibe: ${vibe} · duration: ${duration}s · target ${preset.narrLow}-${preset.narrHigh} words · ${preset.beatCount} beats`);
  console.log(`  model: ${model} · temperature: ${temperature}`);

  // 9. Call the Anthropic Messages API.
  const data = await callAnthropic({ apiKey, model, prompt, temperature });

  // 10. Parse the JSON response.
  const copyDoc = parseModelJson(data, { framework, brand, vibe, duration, slug, preset });

  // 11. Write or print.
  const json = JSON.stringify(copyDoc, null, 2) + "\n";
  if (outFlag === true) {
    console.error("✗ --out= requires a path (e.g. --out=copy.json)");
    process.exit(1);
  }
  if (typeof outFlag === "string" && outFlag.length > 0) {
    const outPath = path.isAbsolute(outFlag) ? outFlag : path.join(projectRoot, outFlag);
    const outDirAbs = path.dirname(outPath);
    if (!fs.existsSync(outDirAbs)) fs.mkdirSync(outDirAbs, { recursive: true });
    fs.writeFileSync(outPath, json, "utf8");
    console.log(`✓ wrote ${path.relative(projectRoot, outPath).replace(/\\/g, "/")}`);
    console.log(`  narration: ${copyDoc.meta.wordCount} words · beats: ${copyDoc.beats.length} · cta: "${copyDoc.cta.verb}"`);
  } else {
    process.stdout.write(json);
  }
  process.exit(0);
}

function buildFrameworkPrompt({ framework, brand, vibe, duration, preset, playbookText, slug }) {
  // Trim playbook to the load-bearing sections to keep the prompt focused.
  // Sections 2 (frameworks), 4 (per-line rules), 6 (vibes), 9 (lint), 10
  // (earned word + big idea) are mandatory.
  return [
    "You are HyperFrames' copy supervisor. Generate a strict-JSON copy document",
    "for one short-form video, obeying the playbook below. Do not invent facts",
    "about the brand beyond what the brief explicitly states. If a slot would",
    "require an invented stat, use a sensory image or a brand-truth instead.",
    "",
    "INPUTS",
    `- Framework: ${framework}`,
    `- Vibe: ${vibe}`,
    `- Duration: ${duration} seconds`,
    `- Slug: ${slug}`,
    `- Narration target: ${preset.narrLow}-${preset.narrHigh} words across ${preset.beatCount} beats`,
    `- Brand brief: ${brand}`,
    "",
    "HARD CONSTRAINTS (every line must obey)",
    "- Hook ≤ 7 words. Single clause. No brand name unless brand IS the hook.",
    "- Headline ≤ 12 words. Active voice. One non-substitutable word.",
    "- Body ≤ 18 words per line. One idea per line. One sentence.",
    "- CTA: 2-5 words. MUST start with a Tier 1 verb: Book, Call, Get, Start,",
    "  Open, See, Visit. (Also OK: Try, Shop, Save, Read, Watch, Join.)",
    "- Banned phrases: \"Click here\", \"Learn more\" alone, \"Submit\",",
    "  \"Find out more\", \"Discover more\".",
    "- Banned jargon: leverage, utilise, synergy, ecosystem, solutions,",
    "  stakeholders, world-class, cutting-edge, best-in-class, innovative,",
    "  premium-as-adjective, holistic.",
    "- No invented stats, awards, customer names, or quotes about the brand.",
    "- Narration: no Māori words (Edge TTS mispronounces). English equivalents only.",
    "- Kicker: 1-3 words, ALL CAPS. Categorical, not promotional. Distinct per scene.",
    "",
    "OUTPUT — return ONE JSON object, no prose, no markdown fences. Schema:",
    "{",
    `  "slug": "${slug}",`,
    `  "framework": "${framework}",`,
    `  "vibe": "${vibe}",`,
    `  "duration": ${duration},`,
    "  \"bigIdea\": \"<≤15-word sentence — the strategic insight this video carries>\",",
    "  \"earnedWord\": \"<single word the video is teaching; CTA must include it or pre-load it>\",",
    "  \"narration\": \"<spoken-track copy, sentences end with periods, target word band met>\",",
    `  "beats": [ { "kicker": "...", "headline": "...", "body": "..." }, ... ${preset.beatCount} entries ],`,
    "  \"cta\": { \"verb\": \"<verb-first 2-5 word CTA>\", \"url\": \"<placeholder URL or brand domain if obvious from brief>\", \"tagline\": \"<≤80 chars, the why-now line>\" },",
    "  \"meta\": { \"generatedAt\": \"<YYYY-MM-DD>\", \"wordCount\": <int>, \"beatCount\": <int>, \"sourcedFrom\": { \"brief\": true } }",
    "}",
    "",
    "PLAYBOOK (source of truth — sections 2, 4, 6, 8, 9, 10):",
    "─".repeat(72),
    playbookText,
    "─".repeat(72),
    "",
    "Now generate the copy document. JSON only. No commentary.",
  ].join("\n");
}

async function callAnthropic({ apiKey, model, prompt, temperature }) {
  const body = {
    model,
    max_tokens: 2048,
    temperature,
    messages: [{ role: "user", content: prompt }],
  };

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`✗ network error calling Anthropic API: ${err.message}`);
    process.exit(1);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`✗ Anthropic API ${res.status} ${res.statusText}`);
    if (text) console.error(`  ${text.slice(0, 600)}`);
    process.exit(1);
  }

  const data = await res.json().catch((err) => {
    console.error(`✗ Anthropic API returned non-JSON: ${err.message}`);
    process.exit(1);
  });

  return data;
}

function parseModelJson(apiResponse, ctx) {
  // Pull the assistant's first text block.
  const blocks = Array.isArray(apiResponse?.content) ? apiResponse.content : [];
  const text = blocks
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) {
    console.error("✗ Anthropic API returned no text content.");
    console.error(`  raw: ${JSON.stringify(apiResponse).slice(0, 400)}`);
    process.exit(1);
  }

  // Strip markdown fences if the model added them despite the instruction.
  let cleaned = text;
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // If the model wrapped the JSON in prose, find the first { and last }.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace > 0 || lastBrace < cleaned.length - 1) {
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error(`✗ Anthropic response was not valid JSON: ${err.message}`);
    console.error("  first 600 chars of returned text:");
    console.error(text.slice(0, 600));
    process.exit(1);
  }

  // Light shape-fix: ensure required fields, derive meta if the model dropped it.
  const narration = typeof parsed.narration === "string" ? parsed.narration.trim() : "";
  const wordCount = narration.split(/\s+/).filter(Boolean).length;
  const beats = Array.isArray(parsed.beats) ? parsed.beats : [];

  return {
    slug: parsed.slug || ctx.slug,
    framework: parsed.framework || ctx.framework,
    vibe: parsed.vibe || ctx.vibe,
    duration: parsed.duration || ctx.duration,
    bigIdea: parsed.bigIdea || "",
    earnedWord: parsed.earnedWord || "",
    narration,
    beats,
    cta: parsed.cta || { verb: "", url: "", tagline: "" },
    meta: {
      generatedAt: (parsed.meta && parsed.meta.generatedAt) || new Date().toISOString().slice(0, 10),
      wordCount: (parsed.meta && parsed.meta.wordCount) || wordCount,
      beatCount: (parsed.meta && parsed.meta.beatCount) || beats.length,
      sourcedFrom: { brief: true, framework: ctx.framework },
    },
  };
}
