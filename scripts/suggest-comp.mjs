#!/usr/bin/env node
// Composition auto-suggester — Phase 1 (deterministic, no LLM call).
// Maps (vibe, duration, vertical, framework) -> ranked shortlist of templates,
// extracts a scene outline for the top pick, and (optionally) copies it into
// compositions/<slug>.html for editing. Substrate: 25 templates under
// compositions/templates/ (8 structural) and compositions/verticals/ (17). Each
// carries a vibe CSS link, a data-duration on the root <div class="comp clip">,
// scenes with timing, and a `Copy framework: <name>` breadcrumb (inline body
// comment OR header docblock — both supported). Run --help for usage. Phase 2
// (not in scope): swap the deterministic ranker for an Anthropic call.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const TEMPLATE_DIRS = [
  { dir: path.join(projectRoot, "compositions", "templates"), kind: "structural" },
  { dir: path.join(projectRoot, "compositions", "verticals"), kind: "vertical" },
];
const CACHE_PATH = path.join(projectRoot, ".suggest-cache.json");
const CACHE_VERSION = 1;
const KNOWN_VIBES = ["kinetic-pop", "quiet-premium", "warm-community", "documentary"];
const KNOWN_VERTICALS = ["hospitality", "real-estate", "realestate", "saas", "trades", "wellness", "ecommerce"];
// Compatibility neighbours for soft (0.5) vibe matches.
const VIBE_NEIGHBOURS = {
  "kinetic-pop": ["warm-community"],
  "quiet-premium": ["documentary"],
  "warm-community": ["kinetic-pop", "documentary"],
  "documentary": ["quiet-premium", "warm-community"],
};

// Per-template one-liners (cribbed from docs/copy-apply-2026-04-26.md).
const COPY_NOTES = {
  "before-after-20s.html": "Honest before/after, single promise reframed mid-clip",
  "case-study-60s.html": "Situation → task → action → result",
  "faq-quick-30s.html": "Each question gets one concrete answer",
  "founder-story-60s.html": "Origin → call → trial → return",
  "hero-promo-30s.html": "Attention · Interest · Desire · Action",
  "product-launch-30s.html": "Feature → advantage → benefit, no buzzwords",
  "social-reel-15s.html": "Hook within first 7 words; one CTA",
  "testimonial-45s.html": "Pull-quote with named moment + emotional shift",
  "ecommerce-product-spotlight-30s.html": "Three benefits, single price, verb-first CTA",
  "ecommerce-social-reel-15s.html": "One hook, one offer, one CTA",
  "hospitality-cafe-vibe-15s.html": "Sensory hook → question → ten-word answer",
  "hospitality-event-special-20s.html": "Real date, real seat count, hard close",
  "hospitality-restaurant-promo-30s.html": "Plate-led hook, three benefits, dinner CTA",
  "realestate-listing-reel-15s.html": "Address → standout → \"Book a viewing\"",
  "realestate-listing-tour-45s.html": "Open Sunday hook, four feature cells, walk-through CTA",
  "realestate-agent-brand-30s.html": "Local agent, three proof points, free valuation",
  "saas-case-study-60s.html": "Friday spreadsheet pain → Thursday close",
  "saas-feature-launch-20s.html": "One-click rollback, one CTA",
  "saas-product-tour-30s.html": "Three features → free for five seats",
  "trades-before-after-30s.html": "Five days, three steps, one promise kept",
  "trades-service-callout-20s.html": "Same-day pain list → \"We fix it today\"",
  "trades-trust-builder-45s.html": "Since 2003, six service details, free quote",
  "wellness-clinic-trust-45s.html": "Quiet rooms, honest plans, check-up CTA",
  "wellness-fitness-transformation-30s.html": "Three real first-12-weeks, \"Start Tuesday\" CTA",
  "wellness-spa-mood-20s.html": "An hour off the clock, four-line menu",
};

// --- args -----------------------------------------------------------------
function parseArgs(argv) {
  const out = { _: [] };
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.replace(/^--/, "").split("=");
      out[k] = v === undefined ? true : v;
    } else out._.push(a);
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) { printHelp(); process.exit(0); }

// --- template scan + cache ------------------------------------------------
function listTemplateFiles() {
  const out = [];
  for (const { dir, kind } of TEMPLATE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith(".html")) out.push({ kind, file: path.join(dir, name) });
    }
  }
  return out;
}
function readCache() {
  if (!fs.existsSync(CACHE_PATH)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    if (j && j.version === CACHE_VERSION && Array.isArray(j.templates)) return j;
  } catch { /* ignore corrupt cache */ }
  return null;
}
function writeCache(payload) { fs.writeFileSync(CACHE_PATH, JSON.stringify(payload, null, 2)); }
function isCacheFresh(cache, files) {
  if (!cache || cache.templates.length !== files.length) return false;
  const byPath = new Map(cache.templates.map(t => [t.file, t.mtimeMs]));
  for (const { file } of files) {
    const fresh = byPath.get(file);
    if (fresh === undefined) return false;
    if (fs.statSync(file).mtimeMs > fresh) return false;
  }
  return true;
}

// --- per-template parsing -------------------------------------------------
function parseTemplate(file, kind) {
  const html = fs.readFileSync(file, "utf8");
  const stat = fs.statSync(file);
  const baseName = path.basename(file);

  const vibeMatch = html.match(/templates\/(kinetic-pop|quiet-premium|warm-community|documentary)\.css/);
  const vibe = vibeMatch ? vibeMatch[1] : null;

  // Duration from root <div class="comp clip" ... data-duration="N">; fallback
  // to filename pattern "*-30s.html" -> 30.
  let duration = null;
  const compMatch = html.match(/<div[^>]*class="[^"]*\bcomp\b[^"]*"[^>]*>/);
  if (compMatch) {
    const dur = compMatch[0].match(/data-duration="(\d+(?:\.\d+)?)"/);
    if (dur) duration = Number(dur[1]);
  }
  if (duration == null) {
    const fn = baseName.match(/-(\d+)s\.html$/);
    if (fn) duration = Number(fn[1]);
  }

  // Framework — match either the inline `<!-- Copy framework: ... -->` or the
  // header-docblock `Copy framework: ...` line. Strip trailing breadcrumb date.
  let framework = null;
  const fwInline = html.match(/<!--\s*Copy framework:\s*([^\n]+?)\s*-->/i);
  const fwHeader = html.match(/^\s*Copy framework:\s*([^\n]+)$/im);
  const fwRaw = (fwInline && fwInline[1]) || (fwHeader && fwHeader[1]) || null;
  if (fwRaw) {
    framework = fwRaw
      .replace(/·\s*applied\s*\d{4}-\d{2}-\d{2}.*$/i, "")
      .replace(/\([^)]*\)\s*$/, "")
      .trim();
  }

  // Vertical from filename prefix (verticals/ only). realestate -> real-estate.
  let vertical = null;
  if (kind === "vertical") {
    const m = baseName.match(/^([a-z]+)-/);
    if (m) vertical = m[1] === "realestate" ? "real-estate" : m[1];
  }

  // Scene outline — locate <div class="scene ..." data-start data-duration>,
  // grab the leading HTML comment (or fall back to inner text) for a label.
  const scenes = [];
  const sceneRe = /<div\s+[^>]*class="[^"]*\bscene\b[^"]*"[^>]*>/g;
  let m;
  while ((m = sceneRe.exec(html))) {
    const tag = m[0];
    const idMatch = tag.match(/\bid="([^"]+)"/);
    const startMatch = tag.match(/\bdata-start="(\d+(?:\.\d+)?)"/);
    const durMatch = tag.match(/\bdata-duration="(\d+(?:\.\d+)?)"/);
    if (!startMatch || !durMatch) continue;
    const start = Number(startMatch[1]);
    const dur = Number(durMatch[1]);

    const before = html.slice(Math.max(0, m.index - 240), m.index);
    const commentMatch = before.match(/<!--\s*([^]*?)\s*-->\s*$/);
    let label = (commentMatch ? commentMatch[1] : "")
      .replace(/^Scene\s*\d+\s*[—\-:·]\s*/i, "")
      .replace(/\s*\(\s*\d+(?:\.\d+)?\s*[\u2013\u2014\-]\s*\d+(?:\.\d+)?\s*s\)\s*/g, " ")
      .replace(/\s*\([^)]*\)\s*$/, "")
      .replace(/^[—\-:·]\s*/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!label) {
      const closeIdx = findMatchingClose(html, m.index + tag.length);
      if (closeIdx > 0) {
        const inner = html.slice(m.index + tag.length, closeIdx);
        label = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
      }
    }
    scenes.push({
      id: idMatch ? idMatch[1] : `s${scenes.length + 1}`,
      start, duration: dur, label: label || "(no label)",
    });
  }

  return { file, baseName, kind, vibe, duration, framework, vertical, scenes, mtimeMs: stat.mtimeMs };
}

// Naive depth counter — fine for the well-formed templates.
function findMatchingClose(html, from) {
  const reOpen = /<div\b[^>]*>/g;
  const reClose = /<\/div>/g;
  reOpen.lastIndex = from;
  reClose.lastIndex = from;
  let depth = 1;
  while (depth > 0) {
    const op = reOpen.exec(html);
    const cl = reClose.exec(html);
    if (!cl) return -1;
    if (op && op.index < cl.index) { depth++; reClose.lastIndex = op.index + 1; }
    else { depth--; if (depth === 0) return cl.index; reOpen.lastIndex = cl.index + 1; }
  }
  return -1;
}

// --- ranking --------------------------------------------------------------
function durationFit(templateDur, requestedDur) {
  if (templateDur == null) return 0;
  const delta = Math.abs(templateDur - requestedDur);
  if (delta <= 5) return 1.0;
  if (delta >= 15) return 0;
  return 1 - (delta - 5) / 10; // linear decay 5..15s -> 1..0.
}
function vibeFit(templateVibe, requestedVibe) {
  if (!requestedVibe || !templateVibe) return 0.5;
  if (templateVibe === requestedVibe) return 1.0;
  return (VIBE_NEIGHBOURS[requestedVibe] || []).includes(templateVibe) ? 0.5 : 0;
}
function verticalFit(template, requestedVertical) {
  if (!requestedVertical) return 0.5;
  const norm = requestedVertical === "realestate" ? "real-estate" : requestedVertical;
  if (template.kind === "structural") return 0.5;
  return template.vertical === norm ? 1.0 : 0;
}
function frameworkFit(templateFw, requestedFw) {
  if (!requestedFw || !templateFw) return 0;
  const a = templateFw.toLowerCase();
  const b = requestedFw.toLowerCase();
  if (a === b) return 1.0;
  // Composite frameworks like "Sensory + FAB" fire on either side.
  return a.split(/[+\s·\/]+/).filter(Boolean).includes(b) ? 1.0 : 0;
}
function score(template, req) {
  const dFit = durationFit(template.duration, req.duration);
  const vFit = vibeFit(template.vibe, req.vibe);
  const verFit = verticalFit(template, req.vertical);
  const fwFit = frameworkFit(template.framework, req.framework);
  let total = (dFit * 3) + (vFit * 2);
  if (req.vertical) total += verFit * 4;
  if (req.framework) total += fwFit * 2;
  return { total: Number(total.toFixed(2)), breakdown: { durationFit: dFit, vibeFit: vFit, verticalFit: verFit, frameworkFit: fwFit } };
}
function rankTemplates(templates, req) {
  return templates.map(t => ({ template: t, ...score(t, req) })).sort((a, b) => b.total - a.total);
}

// --- output ---------------------------------------------------------------
const fmtSecond = n => Number.isInteger(n) ? `${n}` : n.toFixed(1);
function describeTemplate(t) {
  const tags = [];
  if (t.framework) tags.push(`framework: ${t.framework}`);
  if (t.vibe) tags.push(`vibe: ${t.vibe}`);
  tags.push(`duration: ${t.duration ?? "?"}s`);
  tags.push(t.kind === "vertical" ? `vertical (${t.vertical || "?"})` : "structural");
  return tags.join(" · ");
}
function printResults(req, ranked) {
  const top = ranked.slice(0, 3).filter(r => r.total > 0);
  const labelParts = [`${req.duration}s`];
  if (req.vibe) labelParts.push(req.vibe);
  if (req.vertical) labelParts.push(req.vertical);
  if (req.framework) labelParts.push(req.framework);

  console.log(`Top ${top.length || 0} matches for: ${labelParts.join(" · ")}`);
  console.log("");
  if (top.length === 0) {
    console.log("  (no template scored > 0 — try widening duration or relaxing vertical)");
    return;
  }
  for (let i = 0; i < top.length; i++) {
    const { template, total } = top[i];
    const star = i === 0 ? "★" : "·";
    console.log(`  ${star} ${template.baseName}  (score ${total.toFixed(1)})`);
    console.log(`    ${describeTemplate(template)}`);
    const note = COPY_NOTES[template.baseName];
    if (note) console.log(`    "${note}"`);
    if (i === 0 && template.scenes.length) {
      console.log("");
      for (let j = 0; j < template.scenes.length; j++) {
        const s = template.scenes[j];
        const range = `${fmtSecond(s.start)}-${fmtSecond(s.start + s.duration)}s`;
        const label = `Scene ${j + 1} (${range}):`;
        console.log(`    ${label.padEnd(20)} ${s.label}`);
      }
    }
    console.log("");
  }
}
function printList(templates) {
  for (const t of templates) console.log(`${t.baseName}  ${describeTemplate(t)}`);
  console.log("");
  console.log(`${templates.length} templates scanned.`);
}
function printHelp() {
  console.log(`Usage:
  node scripts/suggest-comp.mjs --duration=N [--vibe=<vibe>] [--vertical=<industry>] [--framework=<name>] [--save=<slug>]
  node scripts/suggest-comp.mjs --list                       # show all scanned templates
  node scripts/suggest-comp.mjs --refresh                    # bust the cache

Vibes:        ${KNOWN_VIBES.join(", ")}
Verticals:    ${KNOWN_VERTICALS.join(", ")}
Frameworks:   AIDA, PAS, FAB, STAR, BAB, Hero's Journey, Transformation, Q-Payoff, Sensory

Score = (durationFit ×3) + (vibeFit ×2) + (verticalFit ×4 if --vertical) + (frameworkFit ×2 if --framework)
  durationFit: 1.0 if |Δ| ≤ 5s, decays linearly to 0 at ±15s.
  vibeFit:     1.0 exact, 0.5 compatible, 0 otherwise.
  verticalFit: 1.0 same industry, 0.5 structural, 0 cross-industry vertical.
  frameworkFit: 1.0 exact (or one half of a composite "Sensory + FAB"), 0 otherwise.

Examples:
  node scripts/suggest-comp.mjs --duration=30 --vibe=kinetic-pop --vertical=ecommerce
  node scripts/suggest-comp.mjs --duration=15 --vibe=warm-community
  node scripts/suggest-comp.mjs --duration=30 --vibe=kinetic-pop --vertical=ecommerce --save=my-shop`);
}

// --- save -----------------------------------------------------------------
function saveCopy(template, slug) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
    throw new Error(`bad --save slug "${slug}" — must be alphanumeric + dashes`);
  }
  const dest = path.join(projectRoot, "compositions", `${slug}.html`);
  if (fs.existsSync(dest)) {
    throw new Error(`refusing to overwrite ${path.relative(projectRoot, dest)} — pick a different --save slug`);
  }
  let html = fs.readFileSync(template.file, "utf8");
  // Templates live two levels deep; copy lands at compositions/<slug>.html
  // (one level deep), so `../../design/` -> `../design/`.
  html = html.replace(/\.\.\/\.\.\/design\//g, "../design/");
  // Replace the templates-pass breadcrumb date with today's so future readers
  // can tell when this file was branched, not when the source last changed.
  const today = new Date().toISOString().slice(0, 10);
  html = html.replace(
    /(Copy framework:[^<\n]*?)applied\s+\d{4}-\d{2}-\d{2}/g,
    `$1applied ${today} (suggester · branched from ${template.baseName})`
  );
  fs.writeFileSync(dest, html);
  return dest;
}

// --- main -----------------------------------------------------------------
function main() {
  const files = listTemplateFiles();
  let cache = readCache();
  let templates;
  if (args.refresh || !isCacheFresh(cache, files)) {
    templates = files.map(({ file, kind }) => parseTemplate(file, kind));
    writeCache({ version: CACHE_VERSION, generatedAt: new Date().toISOString(), templates });
  } else {
    templates = cache.templates;
  }

  if (args.list) { printList(templates); return; }

  if (args.duration === undefined || args.duration === true) {
    console.error("error: --duration=<seconds> is required");
    console.error("");
    printHelp();
    process.exit(2);
  }
  const req = {
    duration: Number(args.duration),
    vibe: args.vibe || "kinetic-pop",
    vertical: args.vertical || null,
    framework: args.framework || null,
  };
  if (!Number.isFinite(req.duration) || req.duration <= 0) {
    console.error(`error: --duration must be a positive number (got "${args.duration}")`);
    process.exit(2);
  }
  if (req.vibe && !KNOWN_VIBES.includes(req.vibe)) {
    console.error(`warning: --vibe=${req.vibe} is not one of ${KNOWN_VIBES.join(", ")} — proceeding with neutral vibe scoring`);
  }

  const ranked = rankTemplates(templates, req);
  printResults(req, ranked);

  if (args.save) {
    const top = ranked[0];
    if (!top || top.total === 0) {
      console.error("error: no template scored > 0; refusing to --save anything.");
      process.exit(3);
    }
    try {
      const dest = saveCopy(top.template, args.save);
      console.log(`Saved → ${path.relative(projectRoot, dest)}`);
      console.log(`  source: compositions/${top.template.kind === "vertical" ? "verticals" : "templates"}/${top.template.baseName}`);
      console.log("");
      console.log("Next steps:");
      console.log(`  1. Edit ${path.relative(projectRoot, dest)} — fill in placeholder copy + tokens.`);
      console.log(`  2. npm run new:comp -- <url>     # wire brand tokens from a website`);
      console.log(`  3. npx hyperframes lint          # validate before render`);
    } catch (err) {
      console.error(`error: ${err.message}`);
      process.exit(4);
    }
  }
}
main();
