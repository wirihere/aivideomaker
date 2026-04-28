// Build a structured effects catalog from the 15 raw batch HTML files.
//
// Inputs:  docs/design-bundles/consentmate/project/effects/batch-*-EXXX-EYYY.html
// Outputs: docs/effects/CATALOG.json   (machine-queryable, one entry per effect)
//          docs/effects/INDEX.md       (human/Claude-scannable, organized by category + register)
//
// Each effect block in a batch HTML file is delimited by a CSS comment header:
//   /* E243 Holographic Sticker ============= */
// ...followed by the effect's CSS rules until the next header (or end of <style>).
//
// We extract:
//   id        e.g. "E243"
//   name      e.g. "Holographic Sticker"
//   slug      e.g. "holographic-sticker"
//   batch     e.g. 7
//   source    relative path with #anchor for direct navigation
//   css_size  bytes of the CSS block (rough complexity proxy)
//
// Then we apply heuristic classification based on the name:
//   type      one of: glitch / particle / glow / sweep / transition / text-fx /
//             animation / distortion / organic / geometric / architectural / other
//   phase     entrance / exit / ambient / climax / transition (multi-tag)
//   register  contemplative / warm-community / kinetic-pop / documentary / quiet-premium
//             / editorial-utility (multi-tag)
//   keywords  array of terms for grep/search
//
// Heuristics are ~70-80% accurate. The user can refine entries by editing CATALOG.json
// directly; subsequent runs of this script will preserve manual edits if they exist
// (merge mode, not overwrite).
//
// Usage: node scripts/build-effects-catalog.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const effectsDir = path.join(projectRoot, "docs/design-bundles/consentmate/project/effects");
const outDir = path.join(projectRoot, "docs/effects");
const catalogPath = path.join(outDir, "CATALOG.json");
const indexPath = path.join(outDir, "INDEX.md");

// ---- Heuristic classifiers (name → tags) ------------------------------------

const TYPE_KEYWORDS = {
  glitch: ["crt", "vhs", "glitch", "rgb", "datamosh", "scanline", "static", "tracking", "noise"],
  particle: ["glitter", "sparkle", "confetti", "snow", "ember", "spark", "particle", "dust", "rain"],
  glow: ["holo", "halo", "aura", "glow", "bloom", "shimmer", "flare", "neon", "spotlight", "shine"],
  sweep: ["sweep", "wipe", "scan", "marquee", "ticker"],
  transition: ["cut", "reveal", "fade", "iris", "split", "shutter", "zoom"],
  "text-fx": ["typewriter", "cascade", "stamp", "counter", "type reveal", "mask", "stagger", "explode", "bounce in"],
  animation: ["pulse", "bounce", "float", "wobble", "shake", "spin", "rotate"],
  distortion: ["liquid", "ripple", "wave", "vortex", "tunnel", "warp", "morph"],
  organic: ["fire", "flame", "lava", "plasma", "smoke", "ink", "bloom", "drip", "blob"],
  geometric: ["hex", "grid", "triangle", "polygon", "constellation", "lattice", "matrix"],
  architectural: ["frame", "border", "edge", "barcode", "terminal", "boot", "ribbon"],
};

const PHASE_KEYWORDS = {
  entrance: ["reveal", "type", "cascade", "stagger", "bounce in", "draw"],
  exit: ["dissolve", "burn out", "fade out", "vanish"],
  ambient: ["pulse", "shimmer", "ambient", "field", "tracking", "lava lamp", "constellation"],
  climax: ["burst", "explosion", "slam", "stamp", "impact", "flare"],
  transition: ["sweep", "wipe", "iris", "cut", "shutter", "zoom"],
};

const REGISTER_HINTS = {
  // glitch / VHS / CRT / matrix / barcode → kinetic / industrial
  "kinetic-pop": ["crt", "vhs", "glitch", "rgb", "matrix", "barcode", "terminal", "neon", "burst", "explosion", "slam"],
  // gold / shimmer / halo / glow / soft → premium / contemplative
  "contemplative": ["halo", "glow", "shimmer", "ink", "smoke", "flame", "constellation", "ambient", "ribbon"],
  "quiet-premium": ["holo", "iridescent", "flare", "shine", "sparkle"],
  "warm-community": ["confetti", "bounce", "wobble", "celebration"],
  "documentary": ["typewriter", "type reveal", "spotlight", "scan"],
  "editorial-utility": ["counter", "barcode", "scanline", "grid", "stamp", "frame"],
};

function classify(name) {
  const lower = name.toLowerCase();
  const matchTags = (table) => {
    const tags = [];
    for (const [tag, kws] of Object.entries(table)) {
      if (kws.some(kw => lower.includes(kw))) tags.push(tag);
    }
    return tags;
  };
  const types = matchTags(TYPE_KEYWORDS);
  const phases = matchTags(PHASE_KEYWORDS);
  const registers = matchTags(REGISTER_HINTS);
  return {
    type: types[0] || "other",
    type_secondary: types.slice(1),
    phase: phases.length ? phases : ["unknown"],
    register: registers.length ? registers : ["any"],
    keywords: Array.from(new Set([
      ...lower.split(/[\s\-/()]+/).filter(w => w.length >= 3),
      ...types,
      ...phases,
    ])),
  };
}

// ---- Parser -----------------------------------------------------------------

// Header formats observed across the 15 batch files:
//   /* ============= E241 CRT TV ============= */     (batches 03, 05-09)
//   /* ================ E01 — Brand Glow ============== */  (batches 01, 02)
//   /* E121 Curtain Reveal */                          (batches 04, 15)
//
// Strategy: match any /* ... */ comment, then check inner content for an EXXX header.
const COMMENT_RE = /\/\*([^]*?)\*\//g;
const ID_NAME_RE = /^=*\s*(E\d{1,3})\s*(?:[—\-]\s+)?(.+?)\s*=*\s*$/;

function parseBatchFile(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath);
  const batchMatch = fileName.match(/batch-(\d+)/);
  const batchNum = batchMatch ? parseInt(batchMatch[1], 10) : null;

  // Find all effect headers via comment matching
  const matches = [];
  let cm;
  COMMENT_RE.lastIndex = 0;
  while ((cm = COMMENT_RE.exec(html)) !== null) {
    const inner = cm[1].trim();
    const id = inner.match(ID_NAME_RE);
    if (!id) continue;
    // Pad short IDs (E01 → E001) for sortable consistency
    const idStr = id[1].length === 2 ? `E0${id[1].slice(1)}` : id[1].length === 1 ? `E00${id[1].slice(1)}` : id[1];
    matches.push({
      id: idStr,
      name: id[2].trim(),
      startIdx: cm.index,
      headerEnd: cm.index + cm[0].length,
    });
  }

  // CSS block for each effect = bytes between this header and the next (or end of file)
  return matches.map((mm, i) => {
    const next = matches[i + 1];
    const cssEnd = next ? next.startIdx : html.length;
    const cssSize = cssEnd - mm.headerEnd;

    return {
      id: mm.id,
      name: mm.name,
      slug: mm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      batch: batchNum,
      source: `docs/design-bundles/consentmate/project/effects/${fileName}#${mm.id}`,
      css_size: cssSize,
      ...classify(mm.name),
      ported_to: null,
      preview_image: null,
      best_for: null, // hand-fillable
      duration_ms: null, // hand-fillable
    };
  });
}

// ---- Build the catalog ------------------------------------------------------

function buildCatalog() {
  if (!fs.existsSync(effectsDir)) {
    console.error(`Effects dir not found: ${effectsDir}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const batchFiles = fs.readdirSync(effectsDir)
    .filter(f => /^batch-\d+-E\d+-E\d+\.html$/.test(f))
    .sort();

  let allEffects = [];
  for (const file of batchFiles) {
    const filePath = path.join(effectsDir, file);
    const effects = parseBatchFile(filePath);
    allEffects = allEffects.concat(effects);
    console.log(`  ${file}: ${effects.length} effects`);
  }

  // Merge with existing catalog if present (preserve hand-tagged fields)
  let existing = {};
  if (fs.existsSync(catalogPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
      for (const e of prev.effects || []) existing[e.id] = e;
    } catch (err) {
      console.warn(`(existing catalog parse failed — will overwrite): ${err.message}`);
    }
  }

  const merged = allEffects.map(e => {
    const prev = existing[e.id];
    if (!prev) return e;
    // Preserve fields the user / classifier may have refined
    return {
      ...e,
      type: prev.type !== "other" ? prev.type : e.type,
      best_for: prev.best_for ?? e.best_for,
      duration_ms: prev.duration_ms ?? e.duration_ms,
      ported_to: prev.ported_to ?? e.ported_to,
      preview_image: prev.preview_image ?? e.preview_image,
      // Re-run classification for non-overridden tags
      register: prev.register?.length ? prev.register : e.register,
      phase: prev.phase?.length ? prev.phase : e.phase,
    };
  });

  const catalog = {
    schema_version: 1,
    generated: new Date().toISOString(),
    total: merged.length,
    types: Object.keys(TYPE_KEYWORDS),
    phases: Object.keys(PHASE_KEYWORDS),
    registers: Object.keys(REGISTER_HINTS),
    effects: merged,
  };

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  console.log(`\nWrote ${catalogPath} (${merged.length} effects)`);

  return catalog;
}

// ---- INDEX.md generator -----------------------------------------------------

function buildIndex(catalog) {
  const byType = {};
  const byRegister = {};
  const byPhase = {};
  for (const e of catalog.effects) {
    (byType[e.type] ??= []).push(e);
    for (const r of e.register) (byRegister[r] ??= []).push(e);
    for (const p of e.phase) (byPhase[p] ??= []).push(e);
  }

  const sortById = (a, b) => a.id.localeCompare(b.id);
  const fmt = (e) => `\`${e.id}\` ${e.name} *(batch ${e.batch})*`;

  let md = `# Effects catalog — INDEX

**${catalog.total} effects** parsed from \`docs/design-bundles/consentmate/project/effects/batch-*-E*.html\`.
Generated by \`scripts/build-effects-catalog.mjs\` on ${catalog.generated.split("T")[0]}.

For machine-queryable form (grep / jq / programmatic lookup) see [\`CATALOG.json\`](CATALOG.json).

## How Claude picks an effect (Stage 7 lookup pattern)

1. **Browse this INDEX.md** by register or phase to narrow to ~5-10 candidates.
2. **Grep CATALOG.json** for a keyword if you have a specific look in mind: \`jq '.effects[] | select(.keywords[] | contains("glitter"))' docs/effects/CATALOG.json\`.
3. **Open the source** at the link in the entry's \`source\` field — see actual visual + CSS.
4. **Port** the CSS block: copy into \`videos/<brand>/effects.css\` (one-off) OR \`design/effects-<feature>.css\` (reusable across brands).
5. **Wire** into the composition (HTML class + GSAP timeline if needed).

---

## By type

`;

  for (const type of catalog.types) {
    const effects = (byType[type] || []).sort(sortById);
    if (!effects.length) continue;
    md += `\n### ${type} (${effects.length})\n\n`;
    md += effects.map(fmt).join(" · ") + "\n";
  }

  if (byType.other?.length) {
    md += `\n### other / unclassified (${byType.other.length})\n\n`;
    md += byType.other.sort(sortById).map(fmt).join(" · ") + "\n";
  }

  md += `\n---\n\n## By register\n\n*Effects matching each register's mood. Effects can match multiple registers.*\n`;

  for (const register of catalog.registers) {
    const effects = (byRegister[register] || []).sort(sortById);
    if (!effects.length) continue;
    md += `\n### ${register} (${effects.length})\n\n`;
    md += effects.map(fmt).join(" · ") + "\n";
  }

  if (byRegister.any?.length) {
    md += `\n### any register / undetermined (${byRegister.any.length})\n\n`;
    md += byRegister.any.sort(sortById).slice(0, 50).map(fmt).join(" · ");
    if (byRegister.any.length > 50) md += `\n\n*...and ${byRegister.any.length - 50} more — see CATALOG.json*`;
    md += `\n`;
  }

  md += `\n---\n\n## By phase\n\n*When in the scene this effect fires.*\n`;

  for (const phase of catalog.phases) {
    const effects = (byPhase[phase] || []).sort(sortById);
    if (!effects.length) continue;
    md += `\n### ${phase} (${effects.length})\n\n`;
    md += effects.map(fmt).join(" · ") + "\n";
  }

  md += `\n---\n\n## Already ported to design/\n\n*Effects with extracted CSS in \`design/\` (or \`videos/<brand>/\`) — reusable without porting again.*\n\n`;
  const ported = catalog.effects.filter(e => e.ported_to).sort(sortById);
  md += ported.length
    ? ported.map(e => `- \`${e.id}\` ${e.name} → \`${e.ported_to}\``).join("\n")
    : `*(none yet — ports happen as effects get used)*`;
  md += `\n`;

  fs.writeFileSync(indexPath, md);
  console.log(`Wrote ${indexPath}`);
}

// ---- Run --------------------------------------------------------------------

console.log("Building effects catalog...\n");
const catalog = buildCatalog();
buildIndex(catalog);
console.log(`\nDone. ${catalog.total} effects cataloged.`);
