// Composition versioning manifest — record shared-resource versions per comp.
//
// Compositions reference shared resources (cards.css, templates/<vibe>.css,
// tokens-<brand>.css, modules/all.{js,css}, effects-batch-*.css, vendor/gsap.min.js).
// When those shared files change, an old comp can render differently than it did
// at creation time. This script writes a `compositions/<slug>.meta.json` snapshot
// so renders are reproducible — and detects drift before re-rendering.
//
// Usage:
//   npm run comp:write -- <slug>           # snapshot shared-resource hashes
//   npm run comp:check -- <slug>           # diff current hashes vs manifest
//   npm run comp:list                      # table of all manifests + drift status
//
// Manifest is intentionally a pure "creation snapshot" — render does NOT touch it.
// To re-baseline after intentional resource updates, run `comp:write` again.
//
// Notes:
//   - Resolves relative paths in the comp's <head> (../design/cards.css from
//     compositions/<slug>.html → design/cards.css from project root).
//   - Skips https:// references (CDN-loaded fonts, etc.) — only tracks local files.
//   - No npm deps. sha256 via Node's crypto module.
//   - Manifest is checked into git as the contract of the comp (renderedAt is
//     null when written; intentionally not auto-stamped on render).

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const compsDir = path.join(projectRoot, "compositions");

// --- args -----------------------------------------------------------------

const argv = process.argv.slice(2);
const subcommand = argv[0];
const positional = argv.slice(1).filter(a => !a.startsWith("--"));

const VALID_SUBCOMMANDS = ["write", "check", "list"];
if (!VALID_SUBCOMMANDS.includes(subcommand)) {
  console.error("Usage: node scripts/comp-manifest.mjs <write|check|list> [slug]");
  console.error("");
  console.error("Subcommands:");
  console.error("  write <slug>   write compositions/<slug>.meta.json with current shared-resource hashes");
  console.error("  check <slug>   compare current hashes against manifest, exit 1 on drift");
  console.error("  list           table of all manifests with drift status");
  process.exit(1);
}

// --- helpers --------------------------------------------------------------

function sha256OfFile(absPath) {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

// Pull every <link rel="stylesheet" href=...> and <script src=...> reference
// from the <head> of an HTML file. Returns a list of { kind, raw }.
//
// We deliberately scan only the <head> — inline <script> blocks at the end of
// <body> are composition-local (per-comp animation logic), not shared resources.
function extractHeadRefs(html) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : html;

  const refs = [];

  // <link ... href="..."> — match any link tag with stylesheet rel (or no rel,
  // for safety) that isn't a favicon. We resolve hrefs.
  for (const m of head.matchAll(/<link\b[^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const tag = m[0];
    const href = m[1];
    // Skip rel="icon", rel="shortcut icon", rel="apple-touch-icon", rel="manifest"
    if (/\brel\s*=\s*["'][^"']*\b(?:icon|manifest|preconnect|dns-prefetch)\b[^"']*["']/i.test(tag)) {
      continue;
    }
    refs.push({ kind: "link", raw: href });
  }

  // <script src="...">
  for (const m of head.matchAll(/<script\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    refs.push({ kind: "script", raw: m[1] });
  }

  return refs;
}

// Resolve a raw href from a comp file to a project-relative path. Returns null
// for external (https://) refs and for files that don't exist on disk (so the
// caller can warn rather than crash).
function resolveLocalRef(rawHref, compAbsPath) {
  if (/^(?:https?:)?\/\//i.test(rawHref) || rawHref.startsWith("data:")) {
    return null; // remote — skip
  }
  // Strip a leading "./", strip query/hash.
  let href = rawHref.replace(/[?#].*$/, "");
  // Resolve relative to the comp file's directory.
  const compDir = path.dirname(compAbsPath);
  const absResolved = path.resolve(compDir, href);
  if (!fs.existsSync(absResolved)) {
    return { exists: false, projectRel: path.relative(projectRoot, absResolved).replace(/\\/g, "/") };
  }
  // Normalise to forward-slash project-relative — manifest is platform-portable.
  const rel = path.relative(projectRoot, absResolved).replace(/\\/g, "/");
  return { exists: true, abs: absResolved, projectRel: rel };
}

function compPathForSlug(slug) {
  return path.join(compsDir, `${slug}.html`);
}

function manifestPathForSlug(slug) {
  return path.join(compsDir, `${slug}.meta.json`);
}

// Build a fresh manifest object (without writing).
function buildManifest(slug) {
  const compPath = compPathForSlug(slug);
  if (!fs.existsSync(compPath)) {
    throw new Error(`composition not found: compositions/${slug}.html`);
  }
  const html = fs.readFileSync(compPath, "utf8");
  const refs = extractHeadRefs(html);

  const sharedResources = [];
  const missing = [];
  const skipped = [];
  const seen = new Set();

  for (const ref of refs) {
    const resolved = resolveLocalRef(ref.raw, compPath);
    if (!resolved) {
      skipped.push(ref.raw);
      continue;
    }
    if (!resolved.exists) {
      missing.push(resolved.projectRel);
      continue;
    }
    if (seen.has(resolved.projectRel)) continue;
    seen.add(resolved.projectRel);
    sharedResources.push({
      path: resolved.projectRel,
      sha256: sha256OfFile(resolved.abs),
    });
  }

  // Sort for stable diffs.
  sharedResources.sort((a, b) => a.path.localeCompare(b.path));

  return {
    manifest: {
      slug,
      writtenAt: new Date().toISOString(),
      comp: {
        path: `compositions/${slug}.html`,
        sha256: sha256OfFile(compPath),
      },
      sharedResources,
      renderedAt: null,
    },
    missing,
    skipped,
  };
}

// --- subcommand: write ----------------------------------------------------

function cmdWrite(slug) {
  if (!slug) {
    console.error("Usage: npm run comp:write -- <slug>");
    process.exit(1);
  }
  let result;
  try {
    result = buildManifest(slug);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }
  const { manifest, missing, skipped } = result;
  const outPath = manifestPathForSlug(slug);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✓ wrote compositions/${slug}.meta.json`);
  console.log(`  comp sha256:       ${manifest.comp.sha256.slice(0, 12)}…`);
  console.log(`  shared resources:  ${manifest.sharedResources.length}`);
  for (const r of manifest.sharedResources) {
    console.log(`    ${r.sha256.slice(0, 12)}…  ${r.path}`);
  }
  if (missing.length) {
    console.log(`  ⚠ ${missing.length} referenced file(s) not on disk (skipped):`);
    for (const m of missing) console.log(`      ${m}`);
  }
  if (skipped.length) {
    console.log(`  ℹ ${skipped.length} remote ref(s) skipped (CDN/external)`);
  }
}

// --- subcommand: check ----------------------------------------------------

function cmdCheck(slug) {
  if (!slug) {
    console.error("Usage: npm run comp:check -- <slug>");
    process.exit(1);
  }
  const manifestPath = manifestPathForSlug(slug);
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ no manifest at compositions/${slug}.meta.json — run \`npm run comp:write -- ${slug}\` first`);
    process.exit(1);
  }
  const stored = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  let result;
  try {
    result = buildManifest(slug);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }
  const fresh = result.manifest;

  const drift = [];

  // Comp file itself.
  if (stored.comp.sha256 !== fresh.comp.sha256) {
    drift.push({
      path: stored.comp.path,
      kind: "comp",
      expected: stored.comp.sha256,
      actual: fresh.comp.sha256,
    });
  }

  // Shared resources — compare by path. Note added / removed too.
  const storedByPath = new Map(stored.sharedResources.map(r => [r.path, r.sha256]));
  const freshByPath = new Map(fresh.sharedResources.map(r => [r.path, r.sha256]));

  for (const [p, expected] of storedByPath) {
    if (!freshByPath.has(p)) {
      drift.push({ path: p, kind: "removed", expected, actual: null });
      continue;
    }
    const actual = freshByPath.get(p);
    if (actual !== expected) {
      drift.push({ path: p, kind: "changed", expected, actual });
    }
  }
  for (const [p, actual] of freshByPath) {
    if (!storedByPath.has(p)) {
      drift.push({ path: p, kind: "added", expected: null, actual });
    }
  }

  if (drift.length === 0) {
    console.log(`✓ all shared resources match manifest (${fresh.sharedResources.length} files, comp + ${fresh.sharedResources.length} deps)`);
    process.exit(0);
  }

  console.log(`✗ drift detected for ${slug}: ${drift.length} difference(s)`);
  for (const d of drift) {
    if (d.kind === "added") {
      console.log(`  + ${d.path} (added — not in manifest, hash ${d.actual.slice(0, 12)}…)`);
    } else if (d.kind === "removed") {
      console.log(`  - ${d.path} (removed — was ${d.expected.slice(0, 12)}…, now missing)`);
    } else {
      console.log(`  ✗ ${d.path} changed since manifest (expected ${d.expected.slice(0, 12)}…, got ${d.actual.slice(0, 12)}…)`);
    }
  }
  console.log("");
  console.log(`  Re-baseline with \`npm run comp:write -- ${slug}\` once you've reviewed the changes.`);
  process.exit(1);
}

// --- subcommand: list -----------------------------------------------------

function humanAge(ms) {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

function cmdList() {
  const manifests = fs.readdirSync(compsDir)
    .filter(f => f.endsWith(".meta.json"))
    .map(f => f.replace(/\.meta\.json$/, ""))
    .sort();

  if (manifests.length === 0) {
    console.log("no manifests found in compositions/");
    console.log("create one with: npm run comp:write -- <slug>");
    return;
  }

  // Compute drift status without printing details.
  const rows = [];
  for (const slug of manifests) {
    const manifestPath = manifestPathForSlug(slug);
    let stored;
    try {
      stored = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (err) {
      rows.push({ slug, age: "—", status: `err: ${err.message}` });
      continue;
    }
    const writtenMs = Date.now() - new Date(stored.writtenAt).getTime();
    const age = humanAge(writtenMs);

    if (!fs.existsSync(compPathForSlug(slug))) {
      rows.push({ slug, age, status: "comp HTML missing" });
      continue;
    }
    let fresh;
    try {
      fresh = buildManifest(slug).manifest;
    } catch (err) {
      rows.push({ slug, age, status: `err: ${err.message}` });
      continue;
    }
    const compChanged = stored.comp.sha256 !== fresh.comp.sha256;
    const storedByPath = new Map(stored.sharedResources.map(r => [r.path, r.sha256]));
    const freshByPath = new Map(fresh.sharedResources.map(r => [r.path, r.sha256]));
    let driftCount = 0;
    for (const [p, hash] of storedByPath) {
      if (freshByPath.get(p) !== hash) driftCount++;
    }
    for (const p of freshByPath.keys()) {
      if (!storedByPath.has(p)) driftCount++;
    }
    let status;
    if (compChanged && driftCount === 0) status = "comp changed";
    else if (compChanged) status = `comp+${driftCount} dep drift`;
    else if (driftCount === 0) status = "ok";
    else status = `${driftCount} dep drift`;
    rows.push({ slug, age, status });
  }

  const slugW = Math.max(4, ...rows.map(r => r.slug.length));
  const ageW  = Math.max(3, ...rows.map(r => r.age.length));
  const statusW = Math.max(6, ...rows.map(r => r.status.length));
  const pad = (s, w) => String(s).padEnd(w);
  console.log(`${pad("slug", slugW)}  ${pad("age", ageW)}  ${pad("status", statusW)}`);
  console.log(`${"-".repeat(slugW)}  ${"-".repeat(ageW)}  ${"-".repeat(statusW)}`);
  for (const r of rows) {
    console.log(`${pad(r.slug, slugW)}  ${pad(r.age, ageW)}  ${pad(r.status, statusW)}`);
  }
  // Exit non-zero if any drift, so list can be used in CI as a gate.
  const anyDrift = rows.some(r => r.status !== "ok");
  process.exit(anyDrift ? 1 : 0);
}

// --- dispatch -------------------------------------------------------------

if (subcommand === "write") cmdWrite(positional[0]);
else if (subcommand === "check") cmdCheck(positional[0]);
else if (subcommand === "list") cmdList();
