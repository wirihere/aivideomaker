// Asset / module / token usage tracker.
//
// Builds a graph of which compositions reference which files
// (assets/**, design/**, sub-compositions). Output is a 4-section
// report: 0-references, 1-reference, 2+ references, and "hot" files
// used by 10+ compositions.
//
// Pure read-only — no files are modified or deleted. The operator
// decides what to do with the cleanup candidates.
//
// Usage:
//   node scripts/usage.mjs                 # full 4-section report
//   node scripts/usage.mjs --json          # JSON for scripts/CI
//   node scripts/usage.mjs --unused        # 0-ref paths, one per line
//   node scripts/usage.mjs --filter=glob   # show only matching paths
//   node scripts/usage.mjs --by-comp=path  # show one composition's deps
//
// No external deps. Sorts everything for determinism.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// ---------- Args -------------------------------------------------------------

const args = process.argv.slice(2);
const flags = {
  json: args.includes("--json"),
  unused: args.includes("--unused"),
  filter: getFlag("--filter"),
  byComp: getFlag("--by-comp"),
};

function getFlag(name) {
  const a = args.find((s) => s.startsWith(name + "="));
  return a ? a.slice(name.length + 1) : null;
}

// ---------- Discovery --------------------------------------------------------

const SCAN_ROOTS = ["compositions", "assets", "design"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".cache",
  "renders",
  "debug",
  "archive",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile()) out.push(full);
  }
  return out;
}

function relPosix(absPath) {
  return path.relative(projectRoot, absPath).split(path.sep).join("/");
}

const allFiles = [];
for (const r of SCAN_ROOTS) allFiles.push(...walk(path.join(projectRoot, r)));
const indexHtml = path.join(projectRoot, "index.html");
if (fs.existsSync(indexHtml)) allFiles.push(indexHtml);

allFiles.sort();

const compositions = allFiles
  .filter(
    (f) =>
      f === indexHtml ||
      (f.includes(path.sep + "compositions" + path.sep) && f.endsWith(".html")),
  )
  .sort();

const assets = allFiles
  .filter((f) => f.startsWith(path.join(projectRoot, "assets") + path.sep))
  .sort();

const designFiles = allFiles
  .filter(
    (f) =>
      f.startsWith(path.join(projectRoot, "design") + path.sep) &&
      /\.(css|js|html|svg|png|jpg|jpeg|webp|woff2?)$/i.test(f),
  )
  .sort();

// All "trackable" files (things compositions might reference)
const trackable = new Set([
  ...assets.map(relPosix),
  ...designFiles.map(relPosix),
  ...compositions.filter((f) => f !== indexHtml).map(relPosix),
]);

// ---------- Reference extraction --------------------------------------------

// Strip HTML comments + JS/CSS block comments to reduce false positives
// from "see foo.css" prose in templates. For JS files, also strip
// line comments. For HTML, line comments are too risky to strip globally
// (would eat closing quotes after protocol-relative URLs), so we strip
// them only within <script>...</script> blocks.
function stripComments(text, sourcePath) {
  let s = text.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");
  const isJs = /\.m?js$/i.test(sourcePath);
  if (isJs) {
    s = s.replace(/(^|[^:])\/\/[^\n\r]*/g, "$1");
  } else {
    // Inside HTML <script> blocks, strip line comments.
    s = s.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (_, a, body, c) => {
      const cleaned = body.replace(/(^|[^:])\/\/[^\n\r]*/g, "$1");
      return a + cleaned + c;
    });
  }
  return s;
}

const REF_PATTERNS = [
  // src="..." (img, video, audio, source, script)
  /\bsrc\s*=\s*["']([^"']+)["']/gi,
  // href="..." (link rel=stylesheet, anchors — we filter externals later)
  /\bhref\s*=\s*["']([^"']+)["']/gi,
  // CSS url(...) — handles unquoted, "...", '...'
  /\burl\(\s*(?:["']([^"')]+)["']|([^"')\s]+))\s*\)/gi,
  // data-composition-src="..."
  /\bdata-composition-src\s*=\s*["']([^"']+)["']/gi,
  // import "..." / import x from "..."
  /\bimport\s+(?:[^"';]+\s+from\s+)?["']([^"']+)["']/g,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
];

function extractRefs(text) {
  const refs = new Set();
  for (const pat of REF_PATTERNS) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(text)) !== null) {
      const ref = m[1] || m[2];
      if (!ref) continue;
      const trimmed = ref.trim();
      if (!trimmed) continue;
      // Drop externals + data: + fragment-only
      if (/^(https?:|data:|mailto:|tel:|#|javascript:)/i.test(trimmed)) continue;
      // Drop SVG fragment refs (filter: url(#fx-glass))
      if (trimmed.startsWith("#")) continue;
      refs.add(trimmed);
    }
  }
  return refs;
}

function resolveRef(ref, sourceAbs, trackableSet) {
  // Strip query string + hash fragment
  let r = ref.replace(/[?#].*$/, "");
  if (!r) return null;

  const candidates = [];
  // 1. Relative to the source file's dir (standard)
  candidates.push(path.resolve(path.dirname(sourceAbs), r));
  // 2. Relative to project root — some compositions in compositions/ are
  //    authored "as if at root" (paths like `assets/...` not `../assets/...`).
  if (!r.startsWith("..") && !path.isAbsolute(r)) {
    candidates.push(path.resolve(projectRoot, r));
  }

  for (const abs of candidates) {
    if (!abs.startsWith(projectRoot)) continue;
    const rel = relPosix(abs);
    if (trackableSet.has(rel)) return rel;
  }
  // Fall back to the first candidate so callers can debug;
  // it will be filtered later because it's not in trackableSet.
  const firstAbs = candidates[0];
  if (!firstAbs.startsWith(projectRoot)) return null;
  return relPosix(firstAbs);
}

// ---------- Build graph ------------------------------------------------------

// asset → Set<composition>
const incoming = new Map();
// composition → Set<asset>
const outgoing = new Map();

for (const t of trackable) incoming.set(t, new Set());

for (const compAbs of compositions) {
  const compRel = relPosix(compAbs);
  const out = new Set();
  outgoing.set(compRel, out);
  let text;
  try {
    text = fs.readFileSync(compAbs, "utf8");
  } catch {
    continue;
  }
  const stripped = stripComments(text, compAbs);
  const refs = extractRefs(stripped);
  for (const ref of refs) {
    const resolved = resolveRef(ref, compAbs, trackable);
    if (!resolved) continue;
    if (!trackable.has(resolved)) continue;
    out.add(resolved);
    incoming.get(resolved).add(compRel);
  }
}

// Also crawl design CSS files for transitive refs (e.g. tokens.css → fonts).
// We mark a design file as "used" if any *composition* directly or transitively
// reaches it. Single-hop transitive is enough for this project; we follow
// design/* → design/*.
const designRel = new Set(designFiles.map(relPosix));
for (const dAbs of designFiles) {
  const dRel = relPosix(dAbs);
  let text;
  try {
    text = fs.readFileSync(dAbs, "utf8");
  } catch {
    continue;
  }
  const stripped = stripComments(text, dAbs);
  const refs = extractRefs(stripped);
  for (const ref of refs) {
    const resolved = resolveRef(ref, dAbs, trackable);
    if (!resolved) continue;
    if (!trackable.has(resolved)) continue;
    // Inherit referers from the design file that points at this resolved one.
    const referers = incoming.get(dRel);
    if (!referers) continue;
    const target = incoming.get(resolved);
    for (const r of referers) target.add(r);
  }
}

// ---------- Filter / format --------------------------------------------------

function matchesFilter(p) {
  if (!flags.filter) return true;
  // simple substring match (cheap "glob"); also support trailing /
  return p.includes(flags.filter);
}

const allEntries = [...incoming.entries()]
  .filter(([p]) => matchesFilter(p))
  .map(([p, s]) => ({ path: p, refs: [...s].sort(), count: s.size }))
  .sort((a, b) => {
    if (a.count !== b.count) return a.count - b.count;
    return a.path.localeCompare(b.path);
  });

const unused = allEntries.filter((e) => e.count === 0);
const single = allEntries.filter((e) => e.count === 1);
const shared = allEntries
  .filter((e) => e.count >= 2 && e.count < 10)
  .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));
const hot = allEntries
  .filter((e) => e.count >= 10)
  .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path));

function groupByDir(entries) {
  const by = new Map();
  for (const e of entries) {
    const dir = path.posix.dirname(e.path);
    if (!by.has(dir)) by.set(dir, []);
    by.get(dir).push(e);
  }
  return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

// ---------- Output modes -----------------------------------------------------

function outputJson() {
  const payload = {
    generatedAt: new Date(0).toISOString(), // deterministic placeholder
    counts: {
      compositions: compositions.length,
      tracked: trackable.size,
      unused: unused.length,
      single: single.length,
      shared: shared.length,
      hot: hot.length,
    },
    unused: unused.map((e) => e.path),
    single: single.map((e) => ({ path: e.path, by: e.refs[0] })),
    shared: shared.map((e) => ({ path: e.path, count: e.count, by: e.refs })),
    hot: hot.map((e) => ({ path: e.path, count: e.count, by: e.refs })),
    byComposition: Object.fromEntries(
      [...outgoing.entries()].sort().map(([k, v]) => [k, [...v].sort()]),
    ),
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
}

function outputUnused() {
  for (const e of unused) process.stdout.write(e.path + "\n");
}

function outputByComp() {
  const target = flags.byComp.replace(/\\/g, "/");
  const refs = outgoing.get(target);
  if (!refs) {
    process.stderr.write(
      `usage: composition not found: ${target}\n` +
        `known compositions:\n` +
        [...outgoing.keys()]
          .sort()
          .map((k) => "  " + k)
          .join("\n") +
        "\n",
    );
    process.exit(1);
  }
  const sorted = [...refs].sort();
  process.stdout.write(`${target} → ${sorted.length} reference(s)\n`);
  for (const r of sorted) process.stdout.write("  " + r + "\n");
}

function outputReport() {
  const lines = [];
  lines.push(
    `Asset usage report — ${compositions.length} compositions, ${trackable.size} tracked files`,
  );
  lines.push("=".repeat(72));
  lines.push("");

  // 1. Unused
  lines.push(`[1] Used by 0 compositions — ${unused.length} cleanup candidates`);
  lines.push("-".repeat(72));
  if (unused.length === 0) {
    lines.push("  (none — every tracked file is referenced)");
  } else {
    for (const [dir, items] of groupByDir(unused)) {
      lines.push(`  ${dir}/  (${items.length})`);
      for (const e of items) lines.push(`    ${e.path}`);
    }
  }
  lines.push("");

  // 2. Single use
  lines.push(`[2] Used by 1 composition — ${single.length} files`);
  lines.push("-".repeat(72));
  if (single.length === 0) {
    lines.push("  (none)");
  } else {
    for (const e of single) lines.push(`  ${e.path}  ←  ${e.refs[0]}`);
  }
  lines.push("");

  // 3. Shared (2-9)
  lines.push(`[3] Used by 2-9 compositions — ${shared.length} files`);
  lines.push("-".repeat(72));
  if (shared.length === 0) {
    lines.push("  (none)");
  } else {
    for (const e of shared) {
      lines.push(`  ${String(e.count).padStart(3)}×  ${e.path}`);
    }
  }
  lines.push("");

  // 4. Hot (10+)
  lines.push(`[4] Hot files — used by 10+ compositions — ${hot.length} files`);
  lines.push("-".repeat(72));
  if (hot.length === 0) {
    lines.push("  (none)");
  } else {
    for (const e of hot) {
      lines.push(`  ${String(e.count).padStart(3)}×  ${e.path}`);
    }
  }
  lines.push("");
  lines.push(
    "Tip: --unused for cleanup candidates, --by-comp=<path> for one composition's deps, --json for machine-readable.",
  );
  process.stdout.write(lines.join("\n") + "\n");
}

// ---------- Main -------------------------------------------------------------

if (flags.byComp) {
  outputByComp();
} else if (flags.unused) {
  outputUnused();
} else if (flags.json) {
  outputJson();
} else {
  outputReport();
}
