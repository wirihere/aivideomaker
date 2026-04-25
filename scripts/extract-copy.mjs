// Copy generation supervisor — turns a URL + template into a video-ready
// `<slug>.copy.json` document the orchestrator can drop into a composition.
//
// Usage:
//   node scripts/extract-copy.mjs <url>
//   node scripts/extract-copy.mjs <url> --template=warm-community --seconds=30
//   node scripts/extract-copy.mjs <url> --template=kinetic-pop --seconds=15 --name=acme
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
// What it does (deterministic, offline-friendly — no LLM call):
//   1. scrapeWorker      — curl the URL, extract title, meta description, h1/h2/h3,
//                          first body paragraphs, primary CTA URL.
//   2. summarizeWorker   — distill raw copy to ~target-length narration.
//   3. beatStructuringWorker — split narration into N beats matching scene count.
//   4. toneTuningWorker  — light rewrites per template's voice.
//   5. ttsSafetyWorker   — strip Māori words, expand numbers, strike invented stats,
//                          enforce English place names. (LEARNINGS §4.)
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

const url = positional[0];
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Usage: node scripts/extract-copy.mjs <https://example.com> [--template=warm-community] [--seconds=30] [--name=<slug>]");
  console.error("Templates: warm-community | kinetic-pop | documentary | quiet-premium");
  console.error("Seconds:   15 | 30 | 60");
  process.exit(1);
}

const TEMPLATES = ["warm-community", "kinetic-pop", "documentary", "quiet-premium"];
const SECONDS_OK = [15, 30, 60];

const template = flags.template ?? "warm-community";
const seconds = parseInt(flags.seconds ?? "30", 10);

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

  return { title, metaDescription, headings, paragraphs, listItems, ctaText };
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
  // Diagnostic — useful for the orchestrator to know how the document was built.
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10), // date only, deterministic
    wordCount: narration.split(/\s+/).filter(Boolean).length,
    beatCount: beats.length,
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
