// Master pipeline orchestrator — turn a URL into a rendered MP4 in one command.
//
// Usage:
//   npm run video -- <url>
//   npm run video -- <url> --seconds=30
//   npm run video -- <url> --seconds=15 --template=social-reel
//   npm run video -- <url> --no-render --keep-artifacts   # assemble + check, skip render
//
// Pipeline (each step is its own stage):
//   1. brand extract      → tokens-<slug>.css   (scripts/new-comp.mjs)
//   2. copy generate      → <slug>.copy.json    (scripts/extract-copy.mjs, optional)
//   3. asset pull         → assets/<slug>/      (scripts/pull-assets.mjs, optional)
//   4. music pick         → candidate tracks    (scripts/pick-music.mjs, optional)
//   5. tts narration      → assets/voiceover/<slug>.mp3 (scripts/fetch-tts-edge.mjs, optional)
//   6. composition assemble → index.html        (template + tokens + copy + audio)
//   7. quality gate       → npm run check       (lint + smoke)
//   8. render             → renders/<slug>-<ts>-graded[-wm].mp4
//
// Flags:
//   --seconds=N        (default 30) — drives template choice
//   --template=<name>  override auto-pick (social-reel | hero-promo | case-study | founder-story | testimonial)
//                      explicit user choice always wins over auto-tone selection
//   --name=<slug>      override URL-derived slug
//   --with-music       actually wire the picked music into the composition
//   --no-tts           skip narration synthesis (default: synthesize TTS from copy)
//   --no-render        assemble + check, skip render (saves ~5min)
//   --auto-fix         run `npm run fix:apply` if quality gate fails
//   --keep-artifacts   don't restore index.html at end (for inspection)
//   --dry-run          skip every child spawn, write synthetic outputs, lint
//                      only — exercises orchestrator + parallel-batch wiring
//                      without burning network quota (target wall-clock <5s).
//                      URL is optional; defaults to https://example.com.
//
// Constraints:
//   - MUST restore index.html via try/finally even on crash.
//   - Each stage reports its own time + output path.
//   - Workers (extract-copy, pull-assets, pick-music) may not exist yet — gracefully degrade.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync, spawn } from "child_process";
import { node as nodeBin, npmArgs } from "./lib/platform-bin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- args -----------------------------------------------------------------

const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith("--"));
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const dryRun = !!flags["dry-run"];

// In dry-run mode we don't need a real URL — fall back to example.com so the
// orchestrator wiring is exercised end-to-end without touching the network.
const url = positional[0] || (dryRun ? "https://example.com" : undefined);
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Usage: npm run video -- <https://example.com> [--seconds=N] [--template=<name>] [--name=<slug>]");
  console.error("       npm run video -- <url> --no-render --keep-artifacts   # quick sanity check");
  console.error("       npm run video -- --dry-run                            # smoke-test the orchestrator");
  console.error("");
  console.error("Templates: social-reel (15s) | hero-promo (30s) | testimonial (45s) | founder-story | case-study (60s)");
  process.exit(1);
}

const seconds = Math.max(5, parseInt(flags.seconds ?? "30", 10));
const withMusic = !!flags["with-music"];
const skipTts = !!flags["no-tts"];
// In dry-run we never render — the whole point is to exercise wiring without
// burning quota or wall-clock. OR with the existing flag so both work.
const skipRender = !!flags["no-render"] || dryRun;
const autoFix = !!flags["auto-fix"];
const keepArtifacts = !!flags["keep-artifacts"];

const host = new URL(url).hostname.replace(/^www\./, "").replace(/\.[a-z]+$/, "");
// In dry-run, default the slug to "dryrun-test" so synthetic outputs are
// clearly distinguishable from real ones. User-supplied --name= still wins.
const slugDefault = (dryRun && !positional[0]) ? "dryrun-test" : host;
const slug = String(flags.name ?? slugDefault).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

// --- template auto-pick ---------------------------------------------------
//
// Map seconds → known structural template. We list every template the
// Templates supervisor mentioned (testimonial, product-launch, founder-story,
// before-after, faq-quick) plus the three already-shipped ones. The
// `assembleComposition` step gracefully falls back if the template file
// doesn't exist on disk yet.

// Each entry maps a structural template (scene count + form) to the vibe
// template the Copy supervisor and Music supervisor expect (they only know
// vibe template names). `shipped` is recomputed at runtime from the disk so
// the orchestrator stays self-correcting as templates land.
const TEMPLATE_REGISTRY = {
  "social-reel":     { file: "social-reel-15s.html",   seconds: 15, dims: [1080, 1920], vibe: "kinetic-pop"    },
  "hero-promo":      { file: "hero-promo-30s.html",    seconds: 30, dims: [1920, 1080], vibe: "kinetic-pop"    },
  "product-launch":  { file: "product-launch-30s.html",seconds: 30, dims: [1920, 1080], vibe: "kinetic-pop"    },
  "before-after":    { file: "before-after-30s.html",  seconds: 30, dims: [1920, 1080], vibe: "kinetic-pop"    },
  "faq-quick":       { file: "faq-quick-30s.html",     seconds: 30, dims: [1920, 1080], vibe: "warm-community" },
  "testimonial":     { file: "testimonial-45s.html",   seconds: 45, dims: [1920, 1080], vibe: "warm-community" },
  "founder-story":   { file: "founder-story-60s.html", seconds: 60, dims: [1920, 1080], vibe: "documentary"    },
  "case-study":      { file: "case-study-60s.html",    seconds: 60, dims: [1920, 1080], vibe: "documentary"    },
};

// Tone -> template preference ladders. Each ladder is an ordered list of
// "preferred-given-this-tone" templates; we walk it in order and pick the
// first whose seconds bucket is closest to the requested seconds.
//
// Per LEARNINGS section 8 (kindred-nz finding 2026-04-26): a community brand
// at 30s was being forced into hero-promo (kinetic-pop synth-pop) purely by
// duration bucket. The tone ladders below let warm-community brands land on
// testimonial/faq-quick instead.
const TONE_PREFERENCE = {
  warm:        ["faq-quick", "testimonial", "founder-story"],
  energetic:   ["social-reel", "hero-promo", "product-launch", "before-after"],
  documentary: ["founder-story", "case-study"],
  // neutral falls through to duration-only buckets
};

// Music vibe map. pick-music.mjs reads from the tone-mapped vibe shortlist.
// Keep in sync with TONE_PREFERENCE: the tone determines BOTH the template
// ladder AND the music shortlist (so a "warm" brand always pulls warm-
// community music even if the requested seconds force a fallback template
// that is normally tagged kinetic-pop).
const TONE_TO_VIBE = {
  warm: "warm-community",
  energetic: "kinetic-pop",
  documentary: "documentary",
  neutral: null,
};

function pickTemplate({ seconds, tone, override }) {
  if (override) {
    if (!TEMPLATE_REGISTRY[override]) {
      throw new Error(`Unknown template "${override}". Pick from: ${Object.keys(TEMPLATE_REGISTRY).join(", ")}`);
    }
    return { name: override, reason: "override" };
  }

  const ladder = TONE_PREFERENCE[tone];
  if (ladder && ladder.length) {
    // Short-form (<=20s) has no tone-specific template yet. Warm + 15s falls
    // back to social-reel because there's no warm 15s template; same for
    // documentary. Energetic stays on its ladder (social-reel IS the top
    // entry there, so this branch picks correctly via the normal ranking).
    if (seconds <= 20 && tone !== "energetic") {
      return {
        name: "social-reel",
        reason: `tone=${tone} (no warm/documentary 15s template yet — using social-reel)`,
      };
    }
    // Pick the ladder entry whose seconds bucket is closest to the requested
    // seconds. Ties broken by ladder order (earlier = preferred for this tone).
    const ranked = ladder
      .map((name, idx) => ({
        name,
        idx,
        diff: Math.abs((TEMPLATE_REGISTRY[name]?.seconds ?? 30) - seconds),
      }))
      .sort((a, b) => a.diff - b.diff || a.idx - b.idx);
    const pick = ranked[0];
    const dur = TEMPLATE_REGISTRY[pick.name].seconds;
    let reason = `tone=${tone}`;
    if (tone === "documentary" && seconds <= 35) {
      reason += " (warning: documentary tone in <=35s is awkward; narrative needs room)";
    }
    if (Math.abs(dur - seconds) > 20) {
      reason += ` (seconds=${seconds} drifts from template natural ${dur}s)`;
    }
    return { name: pick.name, reason };
  }

  // tone=neutral or unrecognised - duration-only fallback (today's behaviour).
  if (seconds <= 20) return { name: "social-reel", reason: "duration-bucket" };
  if (seconds <= 35) return { name: "hero-promo", reason: "duration-bucket" };
  if (seconds <= 50) return { name: "testimonial", reason: "duration-bucket" };
  if (seconds <= 75) return { name: "case-study", reason: "duration-bucket" };
  return { name: "case-study", reason: "duration-bucket" };
}

function resolveTemplatePath(templateName) {
  // Prefer exact entry in registry; if file is missing on disk, fall back to
  // the template with the closest duration that DOES exist.
  const entry = TEMPLATE_REGISTRY[templateName];
  if (!entry) return null;
  const tryPath = path.join(projectRoot, "compositions", "templates", entry.file);
  if (fs.existsSync(tryPath)) return { name: templateName, file: tryPath, entry };

  // Fallback: pick the existing template with the closest duration.
  const existing = Object.entries(TEMPLATE_REGISTRY)
    .map(([n, e]) => ({ name: n, entry: e, file: path.join(projectRoot, "compositions", "templates", e.file) }))
    .filter(t => fs.existsSync(t.file))
    .sort((a, b) => Math.abs(a.entry.seconds - entry.seconds) - Math.abs(b.entry.seconds - entry.seconds));

  if (!existing.length) return null;
  const fallback = existing[0];
  return { name: fallback.name, file: fallback.file, entry: fallback.entry, fallbackFor: templateName };
}

// extract-copy.mjs only accepts seconds in {15, 30, 60} and a vibe-style
// template name. Map our structural pick → the closest contract it knows.
function vibeForTemplate(templateName) {
  return TEMPLATE_REGISTRY[templateName]?.vibe || "warm-community";
}
function bucketSeconds(s) {
  // pick the closest of {15, 30, 60}.
  return [15, 30, 60].sort((a, b) => Math.abs(a - s) - Math.abs(b - s))[0];
}

// ---------------------------------------------------------------------------
// Brand-tone reader
// ---------------------------------------------------------------------------
// Combines three signals into one of: "warm" | "energetic" | "documentary" |
// "neutral". Per LEARNINGS section 8 (kindred-nz finding 2026-04-26), the
// duration-only picker forced warm community brands into kinetic-pop slots.
// Each signal returns {tone -> score} contributions; we sum across signals
// and pick the highest. Below a small floor we fall back to "neutral".
//
// Signals (none alone is decisive — the picker requires consensus):
//   1. Palette warmth/saturation (parsed from design/tokens-<slug>.css)
//   2. Copy voice vocabulary    (parsed from compositions/<slug>.copy.json)
//   3. Hostname/vertical hint   (.org/.foundation -> warm; shop/labs/io -> energetic)

// Convert a hex string (#rrggbb or #rgb) to {h, s, v} where:
//   h in [0, 360), s in [0, 1], v in [0, 1]
function hexToHsv(hex) {
  if (typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const sat = max === 0 ? 0 : d / max;
  return { h: hue, s: sat, v: max };
}

// Score a single hex against the four tones.
//  - warm hue band (0-60 or 300-360) AND moderate-sat -> warm
//  - cool/electric hue (180-260) at high sat -> energetic
//  - very low sat (any hue), or earthy sat AND mid-luminance -> documentary
function scoreColor(hex) {
  const hsv = hexToHsv(hex);
  if (!hsv) return null;
  const { h, s, v } = hsv;
  const out = { warm: 0, energetic: 0, documentary: 0 };
  // Skip near-pure white/black — they don't signal tone.
  if (v < 0.05 || (v > 0.97 && s < 0.05)) return out;

  const isWarmHue = (h <= 60) || (h >= 300);
  const isCoolHue = (h >= 180 && h <= 260);

  if (isWarmHue && s >= 0.25 && s <= 0.85) out.warm += 1;
  if (isCoolHue && s >= 0.5) out.energetic += 1;
  // Desaturated palette of any hue (museum/print/document feel).
  if (s < 0.2 && v >= 0.15 && v <= 0.85) out.documentary += 0.7;
  // Earthy mid-sat warm (browns, terracotta, ochre) — also reads documentary.
  if (isWarmHue && s >= 0.15 && s <= 0.45 && v < 0.6) out.documentary += 0.5;
  return out;
}

// Parse a tokens-<slug>.css file's hex codes from the well-known palette
// variables and aggregate per-tone scores.
function paletteSignal(tokensCssPath) {
  if (!tokensCssPath || !fs.existsSync(tokensCssPath)) {
    return { warm: 0, energetic: 0, documentary: 0, hexes: [], note: "(no tokens.css)" };
  }
  let css = "";
  try { css = fs.readFileSync(tokensCssPath, "utf8"); } catch { return { warm: 0, energetic: 0, documentary: 0, hexes: [], note: "(unreadable)" }; }

  // Pull hex values from --bg/--fg/--accent/--brand-color/--card-* and any
  // other CSS custom property whose name suggests a brand color. We look at
  // the value of the property, not the name's tone, so naming variations
  // (`--card-paper` vs `--brand-yellow`) all flow through.
  const propRe = /--(?:bg|fg|color|accent|brand[-_a-z]*|card-[-_a-z]+|primary|secondary|tertiary|surface|on-surface|paper|navy|slate|warn|ok)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  const hexes = [];
  let m;
  while ((m = propRe.exec(css)) != null) {
    hexes.push(m[1].toLowerCase());
  }
  // Dedupe — many palettes alias the same hex across multiple tokens, which
  // would over-count one color's signal.
  const uniq = [...new Set(hexes)];
  const totals = { warm: 0, energetic: 0, documentary: 0 };
  for (const hex of uniq) {
    const s = scoreColor(hex);
    if (!s) continue;
    totals.warm += s.warm;
    totals.energetic += s.energetic;
    totals.documentary += s.documentary;
  }
  // Determine a short label for logs.
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  let note = "(palette neutral)";
  if (top && top[1] > 0) {
    if (top[0] === "warm") note = "palette warm";
    else if (top[0] === "energetic") note = "palette cool-saturated";
    else if (top[0] === "documentary") note = "palette muted/earthy";
  }
  return { ...totals, hexes: uniq, note };
}

// Score copy.json voice vocabulary. Per the user's spec we look in
// `narration` + `beats[].headline` + `beats[].body` for tone-revealing words.
const COPY_LEXICON = {
  warm: ["neighbour", "neighbor", "community", "share", "sharing", "help", "local", "kind", "kindness", "together", "care", "caring", "family", "support", "neighbours", "neighbors", "give", "gift", "friend"],
  energetic: ["boost", "launch", "fast", "instant", "transform", "unlock", "scale", "save time", "10x", "explosive", "supercharge", "growth", "ship", "ai-powered", "automate", "rocket", "blazing", "rapid", "accelerate"],
  documentary: ["story", "journey", "founded", "since", "discovered", "research", "study", "deep dive", "history", "investigated", "decade", "century", "tradition", "legacy", "archive", "origin", "evolved", "uncovered"],
};

function copySignal(copyJsonPath) {
  if (!copyJsonPath || !fs.existsSync(copyJsonPath)) {
    return { warm: 0, energetic: 0, documentary: 0, note: "(no copy.json)" };
  }
  let copy = null;
  try { copy = JSON.parse(fs.readFileSync(copyJsonPath, "utf8")); }
  catch { return { warm: 0, energetic: 0, documentary: 0, note: "(unparseable)" }; }

  const corpus = [
    typeof copy.narration === "string" ? copy.narration : "",
    typeof copy.title === "string" ? copy.title : "",
    ...(Array.isArray(copy.beats) ? copy.beats.flatMap((b) => [b?.headline || "", b?.body || ""]) : []),
    copy?.cta?.tagline || "",
  ].join(" ").toLowerCase();

  if (!corpus.trim()) return { warm: 0, energetic: 0, documentary: 0, note: "(empty corpus)" };

  const totals = { warm: 0, energetic: 0, documentary: 0 };
  for (const [tone, words] of Object.entries(COPY_LEXICON)) {
    for (const w of words) {
      // Word-boundary match (case-insensitive). Multi-word phrases like
      // "save time" use a literal substring search.
      if (w.includes(" ")) {
        if (corpus.includes(w)) totals[tone] += 1;
      } else {
        const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
        if (re.test(corpus)) totals[tone] += 1;
      }
    }
  }
  // Convert a discrete count into a smooth contribution. 1 hit barely
  // matters; 3+ is a clear voice signal.
  for (const k of Object.keys(totals)) totals[k] = Math.min(totals[k] / 3, 2);

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  let note = "(copy neutral)";
  if (top && top[1] >= 0.34) {
    if (top[0] === "warm") note = "copy: community-vocab";
    else if (top[0] === "energetic") note = "copy: growth-vocab";
    else if (top[0] === "documentary") note = "copy: narrative-vocab";
  }
  return { ...totals, note };
}

// Hostname / vertical hint. Light bias only — never enough to flip the
// decision on its own, but tiebreaks against a neutral palette+copy.
function domainSignal(hostname) {
  const out = { warm: 0, energetic: 0, documentary: 0, note: "(domain neutral)" };
  if (!hostname || typeof hostname !== "string") return out;
  const lower = hostname.toLowerCase();

  // Warm-bias TLDs and substrings.
  if (/(\.org|\.community|\.foundation|\.charity|\.church|\.school|\.edu)$/.test(lower)
      || /(\.co\.nz|\.org\.nz|\.org\.au|\.org\.uk)$/.test(lower)
      || /(community|coop|trust|aid|relief|nonprofit)/.test(lower)) {
    out.warm += 0.6;
    out.note = `domain: ${lower.match(/\.[a-z.]+$/)?.[0] || "warm-vertical"}`;
  }

  // Energetic-bias commerce/tech substrings + TLDs.
  if (/(shop|store|market|cart|labs|\.ai|\.io|\.app|\.dev|\.tech|saas|cloud)/.test(lower)
      || /\.(ai|io|app|dev|tech|sh)$/.test(lower)) {
    out.energetic += 0.6;
    out.note = `domain: tech/commerce`;
  }

  // Documentary-bias substrings (museums, archives, news).
  if (/(museum|archive|press|news|times|review|chronicle|journal|history|institute)/.test(lower)) {
    out.documentary += 0.4;
    out.note = `domain: editorial/archive`;
  }

  return out;
}

// Combine the three signals. Returns:
//   { tone, reason, palette, copy, domain }
// where `tone` is one of warm | energetic | documentary | neutral and
// `reason` is a short " · "-joined string of which signals fired.
function extractBrandTone({ tokensCssPath, copyJsonPath, hostname }) {
  const palette = paletteSignal(tokensCssPath);
  const copy = copySignal(copyJsonPath);
  const domain = domainSignal(hostname);

  const totals = { warm: 0, energetic: 0, documentary: 0 };
  for (const sig of [palette, copy, domain]) {
    totals.warm += sig.warm || 0;
    totals.energetic += sig.energetic || 0;
    totals.documentary += sig.documentary || 0;
  }

  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [topTone, topScore] = ranked[0];
  const [, secondScore] = ranked[1] || ["", 0];

  // Floor for "we have a real signal": top score >= 0.6 AND meaningfully
  // ahead of the runner-up (margin >= 0.3). Otherwise neutral.
  let tone = "neutral";
  if (topScore >= 0.6 && (topScore - secondScore) >= 0.3) {
    tone = topTone;
  }

  const reasonParts = [palette.note, copy.note, domain.note]
    .filter((s) => s && !/neutral|none|empty|unparseable/.test(s));
  const reason = reasonParts.length ? reasonParts.join(" · ") : "no strong signal";
  return { tone, reason, palette, copy, domain, totals };
}

// --- helpers --------------------------------------------------------------

// Deterministic per-call delay generator for dry-run mode. Each call returns
// a value in [min, max) drawn from a fixed cycle so the smoke test's wall-
// clock is repeatable. Bounded 50-200ms so the parallel-batch wall-clock log
// shows real overlap (sum of per-stage elapsed > batch wall-clock) without
// dragging out the smoke test.
let _randCallIdx = 0;
const _RAND_CYCLE = [120, 80, 170, 60, 140];
function rand(min, max) {
  const span = max - min;
  const v = _RAND_CYCLE[_randCallIdx % _RAND_CYCLE.length];
  _randCallIdx += 1;
  return min + (v % span);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function relPath(p) {
  if (!p) return "";
  const r = path.relative(projectRoot, p).replace(/\\/g, "/");
  return r || ".";
}

// Stage runner: prints a `[i/N] <label>` line, runs `fn`, prints the result
// and elapsed time. `fn` returns a string (output path / summary) or an
// object `{ output, soft }`.
function makeStageRunner(total) {
  let i = 0;
  // Allow callers to skip indices that were taken by a prior parallel batch.
  // After fanning out stages 2-4 in parallel we set `runner.i = 4` so the
  // next sequential stage prints `[5/8]`.
  const api = async function stage(label, fn) {
    i += 1;
    const labelText = `${label}`.padEnd(20);
    process.stdout.write(`  [${i}/${total}] ${labelText}`);
    const t0 = Date.now();
    try {
      const result = await fn();
      const ms = Date.now() - t0;
      const output = typeof result === "string" ? result : (result?.output ?? "");
      const soft = typeof result === "object" && result?.soft;
      const arrow = soft ? "→ " : "→ ";
      const out = output.padEnd(40);
      console.log(`${arrow}${out}(${fmtTime(ms)})`);
      return { ms, ...((typeof result === "object" && result) || {}), output };
    } catch (err) {
      const ms = Date.now() - t0;
      console.log(`→ FAILED                                  (${fmtTime(ms)})`);
      err.stage = label;
      err.elapsedMs = ms;
      throw err;
    }
  };
  Object.defineProperty(api, "i", { get: () => i, set: (v) => { i = v; } });
  return api;
}

// Parallel-stage runner: starts every stage at once, captures its output and
// timing without printing, then returns the collected results in stage order.
//
// `stages` is an array of `{ label, fn }`. `fn` is the same shape as the
// sequential runner accepts: it may return a string, an object `{ output,
// soft }`, or throw. Failures are returned as `{ ok: false, err }` rather
// than rejecting — so a single broken parallel stage does NOT abort the
// pipeline (matches `Promise.allSettled` semantics).
//
// Output ordering: result lines print in the original stage order (so the
// reader's eye doesn't have to chase finish-order across runs). Each line
// shows that stage's own elapsed wall-clock — which can be inspected to see
// the parallelism (sum of elapsed > total batch wall-clock means overlap).
async function runStagesInParallel(stages, { startIndex, total }) {
  const batchT0 = Date.now();
  console.log(`  [${startIndex + 1}-${startIndex + stages.length}/${total}] (parallel: ${stages.map(s => s.label).join(" + ")})`);
  const settled = await Promise.allSettled(
    stages.map(async ({ label, fn }) => {
      const t0 = Date.now();
      try {
        const result = await fn();
        const ms = Date.now() - t0;
        const output = typeof result === "string" ? result : (result?.output ?? "");
        const soft = typeof result === "object" && result?.soft;
        return { label, ok: true, ms, output, soft };
      } catch (err) {
        const ms = Date.now() - t0;
        return { label, ok: false, ms, err };
      }
    }),
  );
  const batchMs = Date.now() - batchT0;
  // Print result lines in canonical stage order.
  const results = settled.map((s, idx) => {
    const r = s.value; // never rejects — wrapper above always returns a resolved object
    const stageNum = startIndex + idx + 1;
    const labelText = `${r.label}`.padEnd(20);
    if (r.ok) {
      const out = (r.output || "").padEnd(40);
      console.log(`  [${stageNum}/${total}] ${labelText}→ ${out}(${fmtTime(r.ms)})`);
    } else {
      console.log(`  [${stageNum}/${total}] ${labelText}→ FAILED                                  (${fmtTime(r.ms)})`);
    }
    return r;
  });
  console.log(`  └─ batch wall-clock: ${fmtTime(batchMs)} (sequential would have been ${fmtTime(results.reduce((s, r) => s + r.ms, 0))})`);
  return results;
}

// Run a child process synchronously. Returns `{ status, stdout, stderr }`.
// We use `spawnSync` so we can capture output for failed stages without
// printing it inline (keeps the per-stage log tidy). Used by sequential
// stages where blocking the event loop is fine.
function runNode(scriptPath, args = [], { quiet = true, env = {} } = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: false,
  });
  return result;
}

function runNpm(scriptName, extraArgs = [], { quiet = true } = {}) {
  // Spawn `node <npm-cli.js> run <scriptName> [-- ...extraArgs]` directly —
  // bypasses `npm.cmd` (a Windows .cmd shim) so we can drop shell:true and
  // avoid both Node 22 DEP0190 and CVE-2024-27980's EINVAL on .cmd spawn.
  // See scripts/lib/platform-bin.mjs.
  const result = spawnSync(nodeBin, npmArgs(scriptName, extraArgs), {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  return result;
}

// Async variant of runNode using `spawn` — required for stages we want to
// run concurrently. `spawnSync` blocks the event loop so it can't be wrapped
// in `Promise.all*` for real parallelism. Returns the same shape as runNode:
// `{ status, stdout, stderr }`. We always pipe + buffer stdio so concurrent
// stages don't interleave their child output onto our stdout (the parent
// prints a clean per-stage line when all stages finish).
function runNodeAsync(scriptPath, args = [], { env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString("utf8"); });
    child.stderr.on("data", (d) => { stderr += d.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ status: code, stdout, stderr });
    });
  });
}

// --- backup / restore index.html -----------------------------------------

const indexPath = path.join(projectRoot, "index.html");
const backupPath = path.join(projectRoot, `.video-orchestrator.index.bak`);
let backupCreated = false;
let priorIndexLabel = "(none)";

function backupIndex() {
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, backupPath);
    backupCreated = true;
    // Try to derive a label from the <title> for the assemble-stage log line.
    try {
      const head = fs.readFileSync(indexPath, "utf8").slice(0, 2048);
      const m = head.match(/<title>([^<]+)<\/title>/i);
      if (m) priorIndexLabel = m[1].trim().split(/[—\-|]/)[0].trim().slice(0, 30);
    } catch {}
  }
}

function restoreIndex() {
  if (!backupCreated) return;
  if (keepArtifacts) {
    console.log(`  ⓘ --keep-artifacts: index.html left as assembled. Restore with:`);
    console.log(`    cp "${relPath(backupPath)}" index.html`);
    return;
  }
  try {
    fs.copyFileSync(backupPath, indexPath);
    fs.unlinkSync(backupPath);
    backupCreated = false;
  } catch (err) {
    console.error(`  ⚠ failed to restore index.html: ${err.message}`);
    console.error(`    backup is still at: ${relPath(backupPath)}`);
  }
}

// --- main pipeline --------------------------------------------------------

const totalStart = Date.now();
if (dryRun) {
  console.log(`▶ [DRY RUN] video: ${url}`);
  console.log(`  no child processes spawned · synthetic outputs only · no network`);
} else {
  console.log(`▶ video: ${url}`);
}
console.log(`  slug: ${slug} · target seconds: ${seconds} · render: ${skipRender ? "no" : "yes"}${withMusic ? " · music: on" : ""}${skipTts ? " · tts: off" : " · tts: on"}`);
console.log("");

const TOTAL_STAGES = 8;
const stage = makeStageRunner(TOTAL_STAGES);
let copyJsonPath = null;
let assetsDir = null;
let musicCandidates = null;
let chosenTemplate = null;
let ttsAudioPath = null;
let ttsDurationSec = null;

let stageError = null;

try {
  // ----- Stage 1: brand extract -------------------------------------------
  // Reuse new-comp.mjs in --mode=headless. It writes design/tokens-<slug>.css
  // AND a compositions/<slug>.html scaffold (which we ignore — we use the
  // structural template). We pipe its output to /dev/null since the parent
  // stage line is the canonical log.
  await stage("brand extract", async () => {
    const tokensCssRel = `design/tokens-${slug}.css`;
    if (dryRun) {
      // Synthesize a minimal tokens CSS file + meta.json. No Playwright spawn,
      // no network. The downstream synthesizeCopyFromTokens() reader looks at
      // Title/Tagline/Logo URL comments, so include them so Stage 2 fallback
      // produces a sensible-shaped placeholder.
      await sleep(rand(50, 150));
      const stubCss = [
        `/* [DRY RUN] synthetic tokens — slug=${slug} */`,
        `/* Title: Dry Run Test */`,
        `/* Tagline: Synthetic output for orchestrator smoke test. */`,
        `/* Logo URL: (none found) */`,
        `:root {`,
        `  --color-bg: #0a0a0a;`,
        `  --color-fg: #f5f5f5;`,
        `  --color-accent: #ff6b35;`,
        `}`,
        ``,
      ].join("\n");
      const tokensCssPath = path.join(projectRoot, tokensCssRel);
      fs.mkdirSync(path.dirname(tokensCssPath), { recursive: true });
      fs.writeFileSync(tokensCssPath, stubCss);
      const metaPath = path.join(projectRoot, "compositions", `${slug}.meta.json`);
      fs.mkdirSync(path.dirname(metaPath), { recursive: true });
      fs.writeFileSync(metaPath, JSON.stringify({ slug, url, dryRun: true, _synthesized: true }, null, 2));
      return `${tokensCssRel} (synthetic)`;
    }
    const r = runNode(path.join(__dirname, "new-comp.mjs"),
      [url, `--mode=headless`, `--name=${slug}`],
      { quiet: true });
    if (r.status !== 0) {
      const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-5).join("\n");
      throw new Error(`new-comp.mjs failed (exit ${r.status})\n${stderr}`);
    }
    if (!fs.existsSync(path.join(projectRoot, tokensCssRel))) {
      throw new Error(`expected ${tokensCssRel} but it was not written`);
    }
    return tokensCssRel;
  });

  // ----- Stages 2-4: parallel fan-out -------------------------------------
  // copy generate, asset pull, music pick — all only depend on Stage 1's
  // output (tokens-<slug>.css). They write to disjoint paths, so we fan
  // them out with `Promise.allSettled` for partial-failure tolerance.
  // Each stage's deferred logging avoids interleaved stdout from concurrent
  // children (each child's output is buffered + discarded; only the parent
  // stage line is shown).
  const copyScript = path.join(__dirname, "extract-copy.mjs");
  const assetsScript = path.join(__dirname, "pull-assets.mjs");
  const musicScript = path.join(__dirname, "pick-music.mjs");
  copyJsonPath = path.join(projectRoot, "compositions", `${slug}.copy.json`);
  assetsDir = path.join(projectRoot, "assets", slug);

  // ----- Tone resolution --------------------------------------------------
  // Run after Stage 1 so the palette signal can read tokens-<slug>.css.
  // copy.json may not exist yet (it's written by the upcoming parallel
  // Stage 2). The tone reader gracefully skips that signal if the file
  // is missing — palette + domain are still enough on most brands.
  // Dry-run bypasses the reader: synthetic tokens don't carry brand intent
  // and the smoke test asserts on a fixed wall-clock signature.
  let resolvedTone = "neutral";
  let resolvedToneReason = "(dry-run)";
  if (!dryRun) {
    const tokensCssPath = path.join(projectRoot, "design", `tokens-${slug}.css`);
    const hostnameRaw = (() => {
      try { return new URL(url).hostname; } catch { return ""; }
    })();
    const toneReport = extractBrandTone({
      tokensCssPath,
      copyJsonPath, // best-effort; missing file is fine (skips signal)
      hostname: hostnameRaw,
    });
    resolvedTone = toneReport.tone;
    resolvedToneReason = toneReport.reason;
  }

  // Pre-compute shared inputs the stage closures need. Now tone-aware.
  const _picked = pickTemplate({ seconds, tone: resolvedTone, override: flags.template });
  const _structural = _picked.name;
  const _pickReason = _picked.reason;
  // Music vibe: tone-mapped vibe wins over the template's hardcoded vibe
  // when a tone is set. Otherwise fall back to the template's vibe (today's
  // behaviour). pick-music.mjs accepts BOTH --template and --tone; --tone
  // overrides --template's vibe inference downstream.
  const _toneVibe = TONE_TO_VIBE[resolvedTone] || null;
  const _vibe = _toneVibe || vibeForTemplate(_structural);
  const _bucket = bucketSeconds(seconds);

  // Print the tone signal + template choice so the user sees what was
  // inferred. This sits between the brand-extract and parallel-batch lines
  // so the reader can scan top-down: URL -> tokens -> tone -> template.
  if (!dryRun) {
    console.log(`    tone: ${resolvedTone} (${resolvedToneReason})`);
    const overrode = _pickReason === "override" ? " (--template override)"
                   : _pickReason === "duration-bucket" ? " (duration bucket)"
                   : ` (${_pickReason})`;
    const musicVibe = _toneVibe ? ` -> music: ${_toneVibe}` : "";
    console.log(`    template: ${_structural}${overrode}${musicVibe}`);
  }

  // Deferred warnings — surfaced after the parallel batch finishes so they
  // don't garble the in-flight `[N-M/8] (parallel: …)` header.
  const deferredWarnings = [];

  const parallelResults = await runStagesInParallel(
    [
      // ----- Stage 2: copy generate ------------------------------------
      {
        label: "copy generate",
        fn: async () => {
          if (dryRun) {
            // Write a minimal synthetic copy.json directly, no child spawn.
            // Random 50-200ms delay so the parallel batch wall-clock log
            // shows real overlap (sum elapsed > batch wall-clock).
            await sleep(rand(50, 200));
            fs.mkdirSync(path.dirname(copyJsonPath), { recursive: true });
            fs.writeFileSync(copyJsonPath, JSON.stringify({
              slug, url, _dryRun: true, beats: [], narration: "",
            }, null, 2));
            return { output: `compositions/${slug}.copy.json (dry-run)`, soft: true };
          }
          if (!fs.existsSync(copyScript)) {
            // Graceful degradation — synthesize copy from the brand extract output.
            const placeholderCopy = synthesizeCopyFromTokens({ slug, seconds });
            fs.mkdirSync(path.dirname(copyJsonPath), { recursive: true });
            fs.writeFileSync(copyJsonPath, JSON.stringify(placeholderCopy, null, 2));
            return { output: `compositions/${slug}.copy.json (placeholder)`, soft: true };
          }
          const r = await runNodeAsync(copyScript,
            [url, `--template=${_vibe}`, `--seconds=${_bucket}`, `--name=${slug}`]);
          // exit 2 = "thin narration" warning — the JSON was still written. Treat
          // as soft and continue.
          if (r.status !== 0 && r.status !== 2) {
            const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-5).join("\n");
            deferredWarnings.push(`extract-copy.mjs failed (exit ${r.status}); using placeholders\n${stderr}`);
            const placeholderCopy = synthesizeCopyFromTokens({ slug, seconds });
            fs.writeFileSync(copyJsonPath, JSON.stringify(placeholderCopy, null, 2));
            return { output: `compositions/${slug}.copy.json (fallback)`, soft: true };
          }
          if (!fs.existsSync(copyJsonPath)) {
            const placeholderCopy = synthesizeCopyFromTokens({ slug, seconds });
            fs.writeFileSync(copyJsonPath, JSON.stringify(placeholderCopy, null, 2));
            return { output: `compositions/${slug}.copy.json (synthesized)`, soft: true };
          }
          if (r.status === 2) return { output: `compositions/${slug}.copy.json (thin)`, soft: true };
          return `compositions/${slug}.copy.json`;
        },
      },
      // ----- Stage 3: asset pull ---------------------------------------
      {
        label: "asset pull",
        fn: async () => {
          if (dryRun) {
            await sleep(rand(50, 200));
            fs.mkdirSync(assetsDir, { recursive: true });
            return { output: `assets/${slug}/ (dry-run, empty)`, soft: true };
          }
          if (!fs.existsSync(assetsScript)) {
            return { output: `skipped (pull-assets.mjs not found)`, soft: true };
          }
          const r = await runNodeAsync(assetsScript, [url, `--name=${slug}`]);
          if (r.status !== 0) {
            const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-3).join("\n");
            deferredWarnings.push(`pull-assets.mjs failed (exit ${r.status}); continuing without\n${stderr}`);
            return { output: `skipped (pull-assets failed)`, soft: true };
          }
          if (!fs.existsSync(assetsDir)) {
            return { output: `assets/${slug}/ (empty)`, soft: true };
          }
          const fileCount = walkCount(assetsDir);
          return `assets/${slug}/ (${fileCount} files)`;
        },
      },
      // ----- Stage 4: music pick ---------------------------------------
      {
        label: "music pick",
        fn: async () => {
          if (dryRun) {
            await sleep(rand(50, 200));
            const musicJsonPath = path.join(projectRoot, "compositions", `${slug}.music.json`);
            fs.writeFileSync(musicJsonPath, JSON.stringify({
              tracks: [], _dryRun: true,
            }, null, 2));
            return { output: `0 candidate tracks (dry-run)`, soft: true };
          }
          if (!fs.existsSync(musicScript)) {
            return { output: `skipped (pick-music.mjs not found)`, soft: true };
          }
          const args = [`--template=${_vibe}`, `--seconds=${seconds}`, `--json`];
          // Pass --tone so pick-music.mjs can override the template-derived
          // vibe when the brand's tone disagrees with the structural template's
          // hardcoded vibe (e.g. forced fallback templates).
          if (resolvedTone && resolvedTone !== "neutral") args.push(`--tone=${resolvedTone}`);
          if (withMusic) args.push("--download");
          const r = await runNodeAsync(musicScript, args);
          if (r.status !== 0) {
            const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-3).join("\n");
            deferredWarnings.push(`pick-music.mjs failed (exit ${r.status})\n${stderr}`);
            return { output: `no candidates`, soft: true };
          }
          const musicJsonPath = path.join(projectRoot, "compositions", `${slug}.music.json`);
          let n = 0;
          try {
            const stdout = (r.stdout || "").trim();
            const start = stdout.indexOf("{");
            const end = stdout.lastIndexOf("}");
            if (start >= 0 && end > start) {
              musicCandidates = JSON.parse(stdout.slice(start, end + 1));
              const list = musicCandidates?.tracks ?? musicCandidates?.candidates ?? musicCandidates?.picks ?? [];
              n = Array.isArray(list) ? list.length : 0;
              fs.writeFileSync(musicJsonPath, JSON.stringify(musicCandidates, null, 2));
            }
          } catch {}
          return `${n || "?"} candidate track${n === 1 ? "" : "s"}`;
        },
      },
    ],
    { startIndex: stage.i, total: TOTAL_STAGES },
  );
  // Bump the sequential counter past the parallel batch so the next stage
  // prints `[5/8]` not `[2/8]`.
  stage.i = stage.i + parallelResults.length;

  // Surface any captured warnings from the parallel batch.
  for (const w of deferredWarnings) {
    console.warn(`    ⚠ ${w.split("\n").map((l, i) => i === 0 ? l : `      ${l}`).join("\n")}`);
  }

  // Hard failures (exception thrown — not just exit !=0 + soft fallback)
  // bubble up here as `{ ok: false, err }`. Aggregate them into one error.
  const hardFailures = parallelResults.filter(r => !r.ok);
  if (hardFailures.length) {
    const summary = hardFailures
      .map(f => `  · ${f.label}: ${f.err?.message || f.err}`)
      .join("\n");
    const err = new Error(
      `${hardFailures.length}/${parallelResults.length} parallel stage(s) failed:\n${summary}`,
    );
    err.stage = `parallel batch (${hardFailures.map(f => f.label).join(", ")})`;
    throw err;
  }

  // ----- Stage 5: tts narration -------------------------------------------
  // Synthesize Edge TTS audio from copy.json's `narration` field. Land at
  // assets/voiceover/<slug>.mp3 (+ word-level VTT). Soft-fail on:
  //   · --no-tts flag
  //   · empty/missing narration text (typical for --dry-run)
  //   · network failure / Edge protocol break
  // The assemble stage checks for the mp3 on disk and only wires <audio> if
  // the file exists, so a soft skip here just yields a music-only comp.
  await stage("tts narration", async () => {
    if (skipTts) return { output: "skipped (--no-tts)", soft: true };

    let copy = {};
    try { copy = JSON.parse(fs.readFileSync(copyJsonPath, "utf8")); } catch {}
    const narrationText = sanitizeForTts(buildNarrationScript(copy, { seconds }));
    if (!narrationText) {
      // Empty narration — typical for --dry-run + thin/missing copy.json.
      return { output: "skipped (empty narration)", soft: true };
    }

    const ttsScript = path.join(__dirname, "fetch-tts-edge.mjs");
    if (!fs.existsSync(ttsScript)) {
      return { output: "skipped (fetch-tts-edge.mjs not found)", soft: true };
    }

    if (dryRun) {
      // No real network/spawn in dry-run. Synthesize a placeholder mp3 path so
      // the rest of the pipeline keeps shape, but DON'T write the file (the
      // assemble stage's existsSync check will gate the <audio> injection,
      // matching the no-narration path the smoke test relies on).
      await sleep(rand(50, 150));
      return { output: "skipped (dry-run)", soft: true };
    }

    const r = runNode(ttsScript,
      [narrationText, `${slug}.mp3`, `--voice=en-US-JennyNeural`],
      { quiet: true });
    const expectedPath = path.join(projectRoot, "assets", "voiceover", `${slug}.mp3`);
    if (r.status !== 0 || !fs.existsSync(expectedPath)) {
      const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-3).join("\n");
      console.warn(`    ⚠ fetch-tts-edge.mjs failed (exit ${r.status}); continuing without narration\n      ${stderr.replace(/\n/g, "\n      ")}`);
      return { output: "skipped (tts failed)", soft: true };
    }
    ttsAudioPath = expectedPath;
    ttsDurationSec = readVttDuration(expectedPath.replace(/\.mp3$/, ".vtt")) || Math.min(seconds, 30);
    const wordCount = narrationText.split(/\s+/).filter(Boolean).length;
    return `assets/voiceover/${slug}.mp3 (${wordCount} words)`;
  });

  // ----- Stage 6: composition assemble ------------------------------------
  // Pick a template, copy to index.html, rewrite paths, swap tokens, inject copy.
  await stage("assemble", () => {
    backupIndex();
    // Reuse the tone-aware pick from Stages 2-4 so the assemble stage can't
    // disagree with the music vibe / copy template that was generated above.
    const requested = _structural;
    const resolved = resolveTemplatePath(requested);
    if (!resolved) {
      throw new Error(`no template available — looked for "${requested}" and shipped fallbacks in compositions/templates/`);
    }
    chosenTemplate = resolved;

    let html = fs.readFileSync(resolved.file, "utf8");

    // Path rewrite: ../../design/ → design/, ../design/ → design/
    html = html.replace(/\.\.\/\.\.\/design\//g, "design/");
    html = html.replace(/\.\.\/design\//g, "design/");

    // Token swap: tokens-PLACEHOLDER.css → tokens-<slug>.css
    html = html.replace(/tokens-PLACEHOLDER\.css/g, `tokens-${slug}.css`);

    // Copy injection — load whatever's in compositions/<slug>.copy.json and
    // splice into the placeholder strings the templates use. This is a
    // best-effort textual swap so we don't have to know each template's
    // structure deeply; the Copy supervisor's job is to populate the JSON
    // with sensible keys (hook, headline, support, benefits[], stat, etc.).
    let copy = {};
    try {
      copy = JSON.parse(fs.readFileSync(copyJsonPath, "utf8"));
    } catch {}
    html = applyCopyToTemplate(html, copy, resolved.name);

    // Inject <audio> tags for TTS narration (track 9) + music bed (track 8).
    // Both are gated by file existence on disk, so the same code path handles
    // music-only (--no-tts), tts-only (--with-music absent), full-stack, or
    // dry-run (no files = no <audio> injected, lint stays clean).
    const audioTags = [];
    const compSeconds = TEMPLATE_REGISTRY[resolved.name]?.seconds || seconds || 30;

    // Music — only if --with-music + a downloaded track is on disk.
    if (withMusic) {
      const musicSrc = findMusicTrackPath(slug);
      if (musicSrc) {
        audioTags.push(buildAudioTag({
          id: "audio-music",
          src: musicSrc,
          duration: compSeconds,
          trackIndex: 8,
          volume: 0.18,
        }));
      }
    }

    // Narration — only if Stage 5 produced an mp3 on disk (or one was left
    // over from a prior run; either way, an existing file means a comp can
    // legitimately wire it). Prefer the in-memory ttsDurationSec when Stage 5
    // ran this session; otherwise re-read the sibling VTT to avoid stretching
    // a short narration to fill the comp.
    const ttsExpected = path.join(projectRoot, "assets", "voiceover", `${slug}.mp3`);
    if (fs.existsSync(ttsExpected)) {
      const vttDur = ttsDurationSec || readVttDuration(ttsExpected.replace(/\.mp3$/, ".vtt"));
      const dur = vttDur || compSeconds;
      audioTags.push(buildAudioTag({
        id: "audio-narration",
        src: `assets/voiceover/${slug}.mp3`,
        duration: Math.min(dur, compSeconds),
        trackIndex: 9,
        volume: 0.95,
      }));
    }

    if (audioTags.length) {
      html = injectAudioTags(html, audioTags);
    }

    fs.writeFileSync(indexPath, html);

    const note = resolved.fallbackFor
      ? `index.html (fallback ${resolved.name} for ${resolved.fallbackFor}; was: ${priorIndexLabel})`
      : `index.html (was: ${priorIndexLabel})`;
    return audioTags.length ? `${note} +${audioTags.length} audio` : note;
  });

  // ----- Stage 7: quality gate --------------------------------------------
  await stage("quality gate", () => {
    if (dryRun) {
      // In dry-run we run lint only — the full `check` includes a Playwright
      // smoke against the assembled index.html, which fails on synthetic copy
      // data and would also blow the smoke test's <5s budget. Lint is the
      // load-bearing wiring signal: it confirms Stage 5 produced a parseable
      // composition with the synthetic tokens swapped in.
      const r = runNpm("lint", [], { quiet: true });
      if (r.status === 0) return { output: "lint pass (dry-run)", soft: true };
      const tail = (r.stdout || r.stderr || "").trim().split("\n").slice(-12).join("\n");
      throw new Error(`lint failed (exit ${r.status})\n----\n${tail}`);
    }
    // Run the gates the orchestrator actually needs: lint + lint:strict +
    // check:heads + smoke:cli. We deliberately SKIP `npm run smoke` (the
    // visual Playwright smoke) because (a) it requires a separate
    // `hyperframes preview` server running on :3002, which is interactive
    // workflow not automated-pipeline state, and (b) the render about to
    // happen in Stage 7 already proves the comp loads in a browser. Use
    // `npm run check` directly (interactive) when you want the visual
    // signal too.
    const gates = ["lint", "lint:strict", "check:heads", "smoke:cli"];
    const runGates = () => {
      for (const g of gates) {
        const r = runNpm(g, [], { quiet: true });
        if (r.status !== 0) return { ok: false, gate: g, r };
      }
      return { ok: true };
    };
    const result = runGates();
    if (result.ok) return "lint + smoke:cli pass";
    if (autoFix) {
      console.log("\n    ⓘ quality gate failed — running fix:apply…");
      runNpm("fix:apply", [], { quiet: false });
      const result2 = runGates();
      if (result2.ok) return "lint + smoke:cli pass (after auto-fix)";
    }
    const tail = (result.r.stdout || result.r.stderr || "").trim().split("\n").slice(-12).join("\n");
    throw new Error(`quality gate failed at \`npm run ${result.gate}\` (exit ${result.r.status})\n----\n${tail}`);
  });

  // ----- Stage 8: render --------------------------------------------------
  await stage("render", () => {
    if (skipRender) {
      return { output: `skipped (--no-render)`, soft: true };
    }
    const beforeFiles = listRendersDir();
    // The render child emits its own progress bar (via render-progress.mjs).
    // Drop a newline first so the bar gets its own row instead of clobbering
    // the stage runner's `[8/8] render` label. The closing `→ output (Xs)`
    // lands on a fresh row because the bar's done() ends with \n.
    process.stdout.write("\n");
    const r = runNpm("render", ["--watermark"], { quiet: false });
    if (r.status !== 0) {
      throw new Error(`render failed (exit ${r.status})`);
    }
    const afterFiles = listRendersDir();
    const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
    // Prefer the watermarked variant if multiple appeared.
    const final = newFiles.find(f => f.includes("-graded-wm"))
      || newFiles.find(f => f.includes("-graded"))
      || newFiles[newFiles.length - 1]
      || "(unknown)";
    return `renders/${final}`;
  });

  // ----- done -------------------------------------------------------------
  const totalMs = Date.now() - totalStart;
  console.log("");
  if (skipRender) {
    console.log(`✓ assembled + checked in ${fmtTime(totalMs)}.`);
    if (keepArtifacts) {
      console.log(`  inspect: ${path.join(projectRoot, "index.html")}`);
    }
  } else {
    // Find the freshest render to print as the open path.
    const latest = listRendersDir()
      .filter(f => f.endsWith(".mp4"))
      .map(f => ({ f, mtime: fs.statSync(path.join(projectRoot, "renders", f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0];
    if (latest) {
      console.log(`✓ done in ${fmtTime(totalMs)}. open: ${path.join(projectRoot, "renders", latest.f)}`);
    } else {
      console.log(`✓ done in ${fmtTime(totalMs)}.`);
    }
  }

} catch (err) {
  stageError = err;
  console.error("");
  console.error(`✗ pipeline failed at stage: ${err.stage || "(unknown)"}`);
  console.error(`  ${err.message}`);
} finally {
  // ALWAYS restore index.html — even on crash.
  restoreIndex();
}

if (stageError) process.exit(1);

// ===========================================================================
// helpers
// ===========================================================================

function listRendersDir() {
  const dir = path.join(projectRoot, "renders");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

function walkCount(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += walkCount(path.join(dir, e.name));
    else n += 1;
  }
  return n;
}

// Synthesize a placeholder copy.json from what new-comp.mjs already scraped
// (visible as a comment block in tokens-<slug>.css). Graceful degradation
// path for when extract-copy.mjs is unavailable. Schema mirrors the canonical
// extract-copy.mjs output so the assemble stage's injector is one-shot.
function synthesizeCopyFromTokens({ slug, seconds }) {
  const tokensPath = path.join(projectRoot, "design", `tokens-${slug}.css`);
  let title = slug;
  let tagline = "Welcome.";
  let logo = "";
  try {
    const css = fs.readFileSync(tokensPath, "utf8");
    title = (css.match(/Title:\s+([^\n]+)/) || [])[1]?.trim() || title;
    tagline = (css.match(/Tagline:\s+([^\n]+)/) || [])[1]?.trim() || tagline;
    logo = (css.match(/Logo URL:\s+([^\n]+)/) || [])[1]?.trim() || "";
    if (logo === "(none found)") logo = "";
  } catch {}

  const brandName = title.split(/[—\-|·]/)[0].trim().slice(0, 24);
  const ctaUrl = (() => {
    try { return new URL(logo || `https://${slug}.com`).hostname.replace(/^www\./, ""); }
    catch { return `${slug}.com`; }
  })();

  // Mirror extract-copy.mjs's COPY_SCHEMA so applyCopyToTemplate has one path.
  return {
    slug,
    url: logo || `https://${slug}.com`,
    title,
    template: "warm-community",
    seconds,
    narration: tagline,
    beats: [
      { kicker: brandName.toUpperCase(),  headline: tagline.slice(0, 80),                    body: "" },
      { kicker: "WHAT WE DO",             headline: "Built around how you actually work.",   body: "" },
      { kicker: "WHY IT MATTERS",         headline: "Simple, fast, yours.",                  body: "" },
      { kicker: "GET STARTED",            headline: `${brandName} — see for yourself.`,      body: "" },
    ],
    cta: { verb: "Try", url: ctaUrl, tagline: tagline.slice(0, 80) },
    meta: { generatedAt: new Date().toISOString().slice(0, 10), wordCount: tagline.split(/\s+/).length, beatCount: 4, _synthesized: true },
  };
}

// Apply copy.json to a structural template by replacing the textContent of
// known element IDs. Accepts the canonical extract-copy.mjs schema:
//   { slug, url, title, narration, beats: [{ kicker, headline, body }], cta }
// Templates use IDs like s1-hook, s1-headline, s1-supporting, s2-stat,
// s4-quote, s5-cta-verb, etc. Each shipped template uses a stable subset.
function applyCopyToTemplate(html, copy, templateName) {
  if (!copy || typeof copy !== "object") return html;

  const replaceText = (haystack, idAttr, newText) => {
    if (newText === undefined || newText === null || newText === "") return haystack;
    const escId = idAttr.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    // Match <tag id="..."[attrs]>text</tag> — text may contain inline tags
    // like <span>, so we use lazy-match-anything-then-closing-tag. Captures
    // the open tag, the body, and the matching close tag.
    const re = new RegExp(`(<([a-z]+[0-9]?)\\b[^>]*\\sid="${escId}"[^>]*>)([\\s\\S]*?)(</\\2>)`, "i");
    if (re.test(haystack)) {
      return haystack.replace(re, (_, open, _tag, _orig, close) => `${open}${escapeHtml(newText)}${close}`);
    }
    return haystack;
  };

  // --- pull out useful fields with sensible fallbacks ---------------------
  const beats = Array.isArray(copy.beats) ? copy.beats : [];
  const b = (i, key) => beats[i]?.[key] ?? "";
  const headlines = beats.map(x => x.headline).filter(Boolean);
  const bodies    = beats.map(x => x.body).filter(Boolean);

  const brandName = (copy.title || copy.slug || "").split(/[—\-|·:]/)[0].trim().slice(0, 24);
  const ctaUrl = copy.cta?.url || (() => {
    try { return new URL(copy.url || "").hostname.replace(/^www\./, ""); }
    catch { return ""; }
  })();
  const ctaVerb = copy.cta?.verb || "Try";

  // --- scene 1 (hook / hero) ---------------------------------------------
  // social-reel uses #s1-hook, hero-promo uses #s1-headline, case-study uses
  // #s1-headline + #s1-supporting. Cover all of them.
  const hookText = b(0, "headline") || headlines[0] || copy.narration?.split(".")[0] || "";
  html = replaceText(html, "s1-hook", hookText);
  html = replaceText(html, "s1-headline", hookText);
  html = replaceText(html, "s1-support", b(0, "body") || bodies[0] || "");
  html = replaceText(html, "s1-supporting", b(0, "body") || bodies[0] || "");
  html = replaceText(html, "s1-mark", brandName.toUpperCase());
  // Decorative giant background typography (hero-promo s1, case-study s2):
  // ship the brand name as the texture rather than the literal word
  // "HEADLINE" / "SOLUTION", which reads as an unfilled placeholder.
  if (brandName) html = replaceText(html, "s1-bg-text", brandName.toUpperCase());
  if (brandName) html = replaceText(html, "s2-bg-text", brandName.toUpperCase());

  // --- scene 2 (punch / benefits / solution) ------------------------------
  html = replaceText(html, "s2-headline", b(1, "headline") || headlines[1] || "");
  html = replaceText(html, "s2-line", b(1, "body") || b(1, "headline") || bodies[1] || "");
  // Three-up benefits: pull single-word leaders out of headlines[1..3].
  const benefits = [headlines[1], headlines[2], headlines[3]]
    .filter(Boolean)
    .map(s => String(s).split(/\s+/)[0].replace(/[^A-Za-z]/g, ""))
    .filter(s => s && s.length <= 12);
  if (benefits[0]) html = replaceText(html, "s2-b1-title", benefits[0].toUpperCase());
  if (benefits[1]) html = replaceText(html, "s2-b2-title", benefits[1].toUpperCase());
  if (benefits[2]) html = replaceText(html, "s2-b3-title", benefits[2].toUpperCase());
  // Bullets in case-study scene 2.
  if (bodies[1]) html = replaceText(html, "s2-b1", bodies[1]);
  if (bodies[2]) html = replaceText(html, "s2-b2", bodies[2]);
  if (bodies[3]) html = replaceText(html, "s2-b3", bodies[3]);

  // --- scene 3 (stat / outcome) ------------------------------------------
  html = replaceText(html, "s3-headline", b(2, "headline") || headlines[2] || "");
  html = replaceText(html, "s3-line", b(2, "body") || bodies[2] || "");

  // --- scene 4 (quote / CTA depending on template) -----------------------
  // social-reel s4 = CTA wordmark + URL; case-study s4 = quote.
  html = replaceText(html, "s4-mark", brandName.toUpperCase());
  html = replaceText(html, "s4-url", ctaUrl);
  html = replaceText(html, "s4-cta-verb", ctaVerb);
  // Case-study quote.
  html = replaceText(html, "s4-quote", b(3, "headline") || copy.cta?.tagline || "");
  // (Don't overwrite attrib/role — placeholders are fine without copy data.)

  // --- scene 5 (case-study CTA) ------------------------------------------
  html = replaceText(html, "s5-cta-verb", ctaVerb);
  html = replaceText(html, "s5-url", ctaUrl);

  return html;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// =============================================================================
// Narration script synthesis + Edge TTS sanitisation
// =============================================================================
// Build a 75-90 word spoken narration from the copy.json. Prefer the canonical
// `copy.narration` field (extract-copy.mjs already produces it, sanitised for
// TTS). Fall back to assembling from beats + cta when narration is empty.
function buildNarrationScript(copy, { seconds }) {
  if (!copy || typeof copy !== "object") return "";

  // 1. Canonical path — extract-copy.mjs writes a sanitised narration. Use as-is.
  if (typeof copy.narration === "string" && copy.narration.trim().length > 20) {
    return copy.narration.trim();
  }

  // 2. Fallback — synthesise from beats + cta. Cap at ~90 words for 30s.
  const targetWords = Math.min(110, Math.max(30, Math.round((seconds || 30) * 2.8)));
  const parts = [];
  const beats = Array.isArray(copy.beats) ? copy.beats : [];
  for (const b of beats) {
    if (b.headline) parts.push(String(b.headline).trim().replace(/\s+/g, " "));
    if (b.body)     parts.push(String(b.body).trim().replace(/\s+/g, " "));
  }
  const ctaTagline = copy.cta?.tagline ? String(copy.cta.tagline).trim() : "";
  if (ctaTagline) parts.push(ctaTagline);

  // Join, dedupe punctuation, then word-cap.
  let joined = parts
    .filter(Boolean)
    .map(s => s.endsWith(".") || s.endsWith("!") || s.endsWith("?") ? s : `${s}.`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const words = joined.split(/\s+/);
  if (words.length > targetWords) {
    joined = words.slice(0, targetWords).join(" ").replace(/[,;:]?\s*$/, "") + ".";
  }
  return joined;
}

// Defensive Maori-word sanitiser. The canonical extract-copy.mjs ttsSafetyWorker
// already runs this map, but if the orchestrator gets a hand-edited copy.json
// (or the dry-run synthesises from a template that bypasses sanitisation),
// re-apply here as a belt-and-braces guard. Edge TTS (en-US-JennyNeural)
// mispronounces te reo, per the user's standing memory rule.
//
// Patterns are constructed inside the function (not module-level) so the
// orchestrator's main pipeline — which runs at top level — can call this
// function without hitting the temporal-dead-zone on module-level consts
// declared further down the file.
function sanitizeForTts(text) {
  if (!text) return "";
  const patterns = [
    [/\bAotearoa\b/g, "New Zealand"],
    [/\bTāmaki Makaurau\b/gi, "Auckland"],
    [/\bTamaki Makaurau\b/gi, "Auckland"],
    [/\bTe Whanganui-a-Tara\b/gi, "Wellington"],
    [/\bŌtautahi\b/gi, "Christchurch"],
    [/\bOtautahi\b/gi, "Christchurch"],
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
    [/\btēnā\b/gi, "greetings"],
  ];
  let out = String(text);
  for (const [re, repl] of patterns) out = out.replace(re, repl);
  return out.replace(/\s{2,}/g, " ").trim();
}

// Read the LAST cue end-time from a Whisper-style VTT file. Used to set the
// <audio> tag's data-duration so the TTS doesn't get truncated. Returns null
// if the VTT can't be parsed — the caller falls back to comp duration.
function readVttDuration(vttPath) {
  try {
    if (!fs.existsSync(vttPath)) return null;
    const txt = fs.readFileSync(vttPath, "utf8");
    // Cue lines look like: "00:00:01.234 --> 00:00:02.567"
    const matches = [...txt.matchAll(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/g)];
    if (!matches.length) return null;
    const last = matches[matches.length - 1];
    const h = parseInt(last[5], 10);
    const m = parseInt(last[6], 10);
    const s = parseInt(last[7], 10);
    const ms = parseInt(last[8], 10);
    return h * 3600 + m * 60 + s + ms / 1000;
  } catch { return null; }
}

// =============================================================================
// Audio wiring (music + narration)
// =============================================================================
// Find the on-disk path for the picked music track. Priority:
//   1. Track #1 in compositions/<slug>.music.json with an existing local_file
//   2. assets/music/<top-track.slug>.mp3 (the path pick-music's --download writes)
// Returns a project-relative POSIX path, or null if none found.
function findMusicTrackPath(slug) {
  const musicJsonPath = path.join(projectRoot, "compositions", `${slug}.music.json`);
  if (!fs.existsSync(musicJsonPath)) return null;
  let data;
  try { data = JSON.parse(fs.readFileSync(musicJsonPath, "utf8")); }
  catch { return null; }
  const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
  if (!tracks.length) return null;

  // 1. The first track with a working local_file.
  for (const t of tracks) {
    if (t.local_file) {
      const abs = path.isAbsolute(t.local_file)
        ? t.local_file
        : path.join(projectRoot, t.local_file);
      if (fs.existsSync(abs)) {
        return path.relative(projectRoot, abs).replace(/\\/g, "/");
      }
    }
  }
  // 2. Inferred path from --download convention.
  const top = tracks[0];
  if (top?.slug) {
    const slugSafe = String(top.slug).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const inferred = path.join(projectRoot, "assets", "music", `${slugSafe}.mp3`);
    if (fs.existsSync(inferred)) {
      return `assets/music/${slugSafe}.mp3`;
    }
  }
  return null;
}

// Build a single <audio> tag string for HyperFrames. Mirrors the canonical
// pattern from compositions/kindred-production-30s.html: class="clip", a
// unique data-track-index, full-comp data-start/data-duration, data-volume.
function buildAudioTag({ id, src, duration, trackIndex, volume }) {
  const dur = (Math.round(Number(duration) * 100) / 100).toString();
  return `  <audio id="${id}" src="${src}" data-start="0" data-duration="${dur}" data-track-index="${trackIndex}" data-volume="${volume}" class="clip" preload="auto"></audio>`;
}

// Inject one or more <audio> tags into the assembled index.html. Insertion
// point: immediately after the root `<div … class="comp clip" … data-start=… >`
// open-tag (matches kindred-production-30s.html convention — audio tags live
// inside the comp wrapper so they participate in the same timeline). Falls
// back to inserting before `</body>` if the comp wrapper isn't found.
function injectAudioTags(html, tags) {
  const block = `\n  <!-- ============== AUDIO TRACKS (orchestrator) ============== -->\n${tags.join("\n")}\n`;
  // Match the comp wrapper opening tag (greedy across attributes, single tag).
  const compOpenRe = /(<div\b[^>]*\bclass="comp clip"[^>]*>)/i;
  if (compOpenRe.test(html)) {
    return html.replace(compOpenRe, (m) => `${m}${block}`);
  }
  // Fallback: just before </body>.
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${block}\n</body>`);
  }
  // Last resort: append.
  return html + block;
}
