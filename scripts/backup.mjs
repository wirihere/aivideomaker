// backup.mjs — checkpoint + rollback the bits of the workspace that matter.
//
// The pipeline grew a manual `archive/` stash for "snapshot before risky
// change → rollback if broken". This script gives that workflow a verb:
//   save    — copy the composition surface into .backups/<ts>-<label>/
//   list    — show what we have
//   restore — diff + (with --apply) restore a snapshot
//   prune   — drop oldest snapshots (with --apply)
//
// Snapshot scope is intentionally narrow: the *authored* surface
// (HTML compositions, brand tokens, project metadata, learnings). Renders,
// fetched media, node_modules, and the smoke baseline are excluded — they're
// big and regenerable. Operators can use git for actual commits; this is the
// in-flight safety net.
//
// Read-only by default for restore/prune. --apply commits the destructive op.
// Saves are atomic: write to .backups/<dir>.tmp then rename. No partial dirs.
//
// Usage:
//   node scripts/backup.mjs save [--name=<label>] [--dry-run]
//   node scripts/backup.mjs list
//   node scripts/backup.mjs restore <timestamp-or-label> [--apply] [--dry-run]
//   node scripts/backup.mjs prune [--keep-last=N] [--apply]
//   node scripts/backup.mjs --help
//
// No npm deps. Pure fs/path/crypto + a one-shot git rev probe.

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const backupsDir = path.join(projectRoot, ".backups");

// --- snapshot scope ---------------------------------------------------------
// Patterns are evaluated relative to projectRoot. Each entry is one of:
//   { kind: "file",     rel }                  — single file (optional)
//   { kind: "dir",      rel, exts }            — recurse, filter by extension
//   { kind: "glob-top", rel, exts }            — only top-level entries
const SCOPE = [
  { kind: "file", rel: "index.html" },
  { kind: "file", rel: "meta.json" },
  { kind: "file", rel: "transcript.json" },
  { kind: "file", rel: "LEARNINGS.md" },
  { kind: "glob-top", rel: "design", exts: [".css"], match: /^tokens-.*\.css$/i },
  { kind: "dir", rel: "compositions/templates", exts: [".html"] },
  { kind: "dir", rel: "compositions/verticals", exts: [".html"] },
  { kind: "glob-top", rel: "compositions", exts: [".html"] },
];

// --- arg parsing ------------------------------------------------------------
const argv = process.argv.slice(2);
if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
  printHelp();
  process.exit(argv.length === 0 ? 2 : 0);
}

const command = argv[0];
const positional = argv.slice(1).filter(a => !a.startsWith("--"));
const flags = {};
for (const a of argv.slice(1)) {
  if (!a.startsWith("--")) continue;
  const [k, v] = a.replace(/^--/, "").split("=");
  flags[k] = v ?? true;
}

// --- entry point ------------------------------------------------------------
try {
  switch (command) {
    case "save":    await cmdSave();    break;
    case "list":    await cmdList();    break;
    case "restore": await cmdRestore(positional[0]); break;
    case "prune":   await cmdPrune();   break;
    default:
      console.error(`✗ unknown command: ${command}`);
      printHelp();
      process.exit(2);
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
}

// --- save -------------------------------------------------------------------

async function cmdSave() {
  const label = sanitizeLabel(flags.name || "snapshot");
  const dryRun = flags["dry-run"] === true;
  const files = await collectScope();

  if (files.length === 0) {
    console.log("◇ snapshot scope is empty — nothing to save.");
    return;
  }

  const stamp = stampNow();
  const dirName = `${stamp}-${label}`;
  const finalDir = path.join(backupsDir, dirName);
  const tmpDir   = path.join(backupsDir, `${dirName}.tmp`);

  console.log("▶ backup save");
  console.log(`  label:    ${label}`);
  console.log(`  target:   ${path.relative(projectRoot, finalDir).replace(/\\/g, "/")}`);
  console.log(`  files:    ${files.length}`);
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  console.log(`  size:     ${fmtBytes(totalBytes)}`);

  if (dryRun) {
    console.log("");
    console.log("Would copy:");
    for (const f of files) console.log(`  ${f.rel}  (${fmtBytes(f.size)})`);
    console.log("");
    console.log("◇ dry-run only — pass without --dry-run to write.");
    return;
  }

  // Atomic write: tmp dir → rename. If anything throws mid-flight, clean up.
  await fs.mkdir(backupsDir, { recursive: true });
  // Belt-and-braces: clear stale tmp from a prior crash before reusing.
  if (fsSync.existsSync(tmpDir)) await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    for (const f of files) {
      const dest = path.join(tmpDir, f.rel);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(f.abs, dest);
    }

    const manifest = {
      savedAt: new Date().toISOString(),
      label,
      fileCount: files.length,
      totalBytes,
      gitRev: gitHeadShort(),
    };
    await fs.writeFile(
      path.join(tmpDir, ".manifest.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );

    // If the final dir already exists (same-second collision with same label),
    // rename it out of the way so the new save wins. Old snapshot is moved to
    // <dir>.collision-<rand> rather than deleted — operator can review.
    if (fsSync.existsSync(finalDir)) {
      const stash = `${finalDir}.collision-${crypto.randomBytes(3).toString("hex")}`;
      await fs.rename(finalDir, stash);
      console.log(`  (collision: prior ${dirName} stashed at ${path.basename(stash)})`);
    }
    await fs.rename(tmpDir, finalDir);
  } catch (err) {
    // Roll back the tmp dir so we never leave half-written state behind.
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
    throw err;
  }

  console.log("");
  console.log(`◇ saved ${files.length} file(s) → ${path.relative(projectRoot, finalDir).replace(/\\/g, "/")}`);
}

// --- list -------------------------------------------------------------------

async function cmdList() {
  const snapshots = await listSnapshots();
  if (snapshots.length === 0) {
    console.log("◇ no snapshots in .backups/");
    return;
  }
  console.log(`▶ backup list — ${snapshots.length} snapshot(s)`);
  console.log("");
  // Columns: savedAt | label | files | size | keep | name
  const header = ["saved",            "label",          "files", "size",   "keep", "dir"];
  const widths = [20, 24, 6, 9, 4, 0];
  console.log("  " + header.map((c, i) => i === header.length - 1 ? c : String(c).padEnd(widths[i])).join("  "));
  console.log("  " + widths.map(w => "-".repeat(Math.max(w, 4))).join("  "));
  for (const s of snapshots) {
    const m = s.manifest;
    const saved = (m?.savedAt || "?").replace("T", " ").replace(/\..*$/, "").slice(0, 19);
    console.log("  " + [
      saved.padEnd(widths[0]),
      String(m?.label || "?").padEnd(widths[1]).slice(0, widths[1]),
      String(m?.fileCount ?? "?").padEnd(widths[2]),
      fmtBytes(m?.totalBytes ?? 0).padEnd(widths[3]),
      (m?.keep ? "yes" : "-").padEnd(widths[4]),
      s.name,
    ].join("  "));
  }
}

// --- restore ----------------------------------------------------------------

async function cmdRestore(target) {
  if (!target) throw new Error("restore: missing <timestamp-or-label> argument");
  const apply = flags.apply === true;
  // --dry-run is the default; explicit flag is a no-op for clarity.
  const snapshot = await resolveSnapshot(target);

  console.log("▶ backup restore");
  console.log(`  source:   ${snapshot.name}`);
  if (snapshot.manifest) {
    console.log(`  saved:    ${snapshot.manifest.savedAt}`);
    console.log(`  label:    ${snapshot.manifest.label}`);
    if (snapshot.manifest.gitRev) console.log(`  gitRev:   ${snapshot.manifest.gitRev}`);
  }
  console.log("");

  // Walk the snapshot dir, classify each file vs the live workspace.
  const snapshotFiles = await walkAll(snapshot.dir, snapshot.dir);
  let added = 0, modified = 0, unchanged = 0;
  const plan = [];
  for (const rel of snapshotFiles) {
    if (rel === ".manifest.json") continue;
    const src = path.join(snapshot.dir, rel);
    const dest = path.join(projectRoot, rel);
    const liveExists = fsSync.existsSync(dest);
    const same = liveExists && (await sha256OfFile(src)) === (await sha256OfFile(dest));
    let status;
    if (!liveExists)       { status = "added";     added++; }
    else if (same)         { status = "unchanged"; unchanged++; }
    else                   { status = "modified";  modified++; }
    plan.push({ rel, src, dest, status });
  }

  console.log(`Plan: ${plan.length} file(s) — ${added} added, ${modified} modified, ${unchanged} unchanged`);
  console.log("");
  for (const p of plan) {
    if (p.status === "unchanged") continue;
    console.log(`  ${p.status === "added" ? "+" : "~"} ${p.rel}`);
  }
  if (added + modified === 0) {
    console.log("  (no changes)");
  }
  console.log("");

  if (!apply) {
    console.log("◇ dry-run — pass --apply to commit destructive copy.");
    return;
  }

  // Mutate. We only touch files that differ; unchanged files are skipped to
  // keep mtimes stable and the diff readable.
  let written = 0;
  for (const p of plan) {
    if (p.status === "unchanged") continue;
    await fs.mkdir(path.dirname(p.dest), { recursive: true });
    await fs.copyFile(p.src, p.dest);
    written++;
  }
  console.log(`◇ restored ${written} file(s) from ${snapshot.name}`);
}

// --- prune ------------------------------------------------------------------

async function cmdPrune() {
  const keepLast = flags["keep-last"] !== undefined ? Number(flags["keep-last"]) : 10;
  if (!Number.isFinite(keepLast) || keepLast < 0) {
    throw new Error(`--keep-last must be a non-negative integer (got: ${flags["keep-last"]})`);
  }
  const apply = flags.apply === true;
  const snapshots = await listSnapshots();

  // Sort newest-first by savedAt (manifest) with dirname fallback so a
  // missing manifest doesn't crash prune.
  snapshots.sort((a, b) => {
    const ta = a.manifest?.savedAt ?? a.name;
    const tb = b.manifest?.savedAt ?? b.name;
    return ta < tb ? 1 : ta > tb ? -1 : 0;
  });

  const protectedKeep = [];
  const youngSurvived = [];
  const toDelete = [];
  snapshots.forEach((s, idx) => {
    if (s.manifest?.keep) { protectedKeep.push(s); return; }
    if (idx < keepLast)   { youngSurvived.push(s); return; }
    toDelete.push(s);
  });

  console.log("▶ backup prune");
  console.log(`  policy:    keep-last=${keepLast}`);
  console.log(`  total:     ${snapshots.length}`);
  console.log(`  protected: ${protectedKeep.length} (manifest.keep=true)`);
  console.log(`  newest:    ${youngSurvived.length}`);
  console.log(`  to delete: ${toDelete.length}`);
  if (toDelete.length) {
    console.log("");
    console.log(apply ? "Deleting:" : "Would delete:");
    for (const s of toDelete) {
      const saved = s.manifest?.savedAt ?? "?";
      console.log(`  - ${s.name}  (saved ${saved})`);
    }
  }
  console.log("");

  if (!apply) {
    console.log("◇ dry-run only — pass --apply to delete.");
    return;
  }
  if (!toDelete.length) {
    console.log("◇ nothing to delete.");
    return;
  }

  let deleted = 0, failed = 0;
  for (const s of toDelete) {
    try { await fs.rm(s.dir, { recursive: true, force: true }); deleted++; }
    catch (err) { console.error(`  ✗ ${s.name}: ${err.message}`); failed++; }
  }
  console.log(`◇ deleted ${deleted}/${toDelete.length}${failed ? ` (${failed} failed)` : ""}`);
  if (failed) process.exit(1);
}

// --- helpers ----------------------------------------------------------------

function printHelp() {
  console.log("backup.mjs — snapshot + restore the composition surface");
  console.log("");
  console.log("Commands:");
  console.log("  save [--name=<label>] [--dry-run]    snapshot index.html, tokens, templates, etc.");
  console.log("  list                                  list snapshots in .backups/");
  console.log("  restore <ts-or-label> [--apply]       restore a snapshot (dry-run by default)");
  console.log("  prune [--keep-last=N] [--apply]       drop oldest snapshots (dry-run by default)");
  console.log("");
  console.log("Scope: index.html, meta.json, LEARNINGS.md, transcript.json, design/tokens-*.css,");
  console.log("       compositions/*.html (top-level), compositions/templates/**, compositions/verticals/**.");
  console.log("       Excludes renders/, assets/, node_modules/, smoke/, archive/.");
}

function sanitizeLabel(raw) {
  // alphanumeric + dash; collapse runs; trim; default if empty.
  const cleaned = String(raw).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "snapshot";
}

function stampNow() {
  // YYYY-MM-DD_HH-mm — sortable, filename-safe across OSes.
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

function gitHeadShort() {
  // Best-effort. If git is missing or this isn't a repo, return null.
  try {
    const r = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: projectRoot, encoding: "utf8" });
    if (r.status === 0) return r.stdout.trim();
  } catch {}
  return null;
}

function fmtBytes(b) {
  if (b < 1024) return `${b}B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)}KB`;
  return `${(b/(1024*1024)).toFixed(2)}MB`;
}

async function sha256OfFile(p) {
  const buf = await fs.readFile(p);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function collectScope() {
  const out = [];
  for (const entry of SCOPE) {
    const abs = path.join(projectRoot, entry.rel);
    if (!fsSync.existsSync(abs)) continue;
    if (entry.kind === "file") {
      const st = await fs.stat(abs);
      if (st.isFile()) out.push({ rel: entry.rel.replace(/\\/g, "/"), abs, size: st.size });
    } else if (entry.kind === "glob-top") {
      const names = await fs.readdir(abs);
      for (const name of names) {
        const child = path.join(abs, name);
        const st = await fs.stat(child);
        if (!st.isFile()) continue;
        if (entry.exts && !entry.exts.includes(path.extname(name).toLowerCase())) continue;
        if (entry.match && !entry.match.test(name)) continue;
        out.push({ rel: path.posix.join(entry.rel, name), abs: child, size: st.size });
      }
    } else if (entry.kind === "dir") {
      const recursed = await walkAll(abs, abs);
      for (const rel of recursed) {
        if (entry.exts && !entry.exts.includes(path.extname(rel).toLowerCase())) continue;
        const child = path.join(abs, rel);
        const st = await fs.stat(child);
        out.push({ rel: path.posix.join(entry.rel, rel.replace(/\\/g, "/")), abs: child, size: st.size });
      }
    }
  }
  // Stable order — same workspace + same label produces a manifest-equivalent
  // backup (modulo timestamp/gitRev fields).
  out.sort((a, b) => a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0);
  return out;
}

async function walkAll(root, dir) {
  // Returns POSIX-style relative paths under `root`.
  const out = [];
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await walkAll(root, full);
      for (const s of sub) out.push(s);
    } else if (e.isFile()) {
      out.push(path.relative(root, full).replace(/\\/g, "/"));
    }
  }
  return out;
}

async function listSnapshots() {
  if (!fsSync.existsSync(backupsDir)) return [];
  const entries = await fs.readdir(backupsDir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.endsWith(".tmp")) continue;  // ignore in-flight or crashed saves
    const dir = path.join(backupsDir, e.name);
    const manifestPath = path.join(dir, ".manifest.json");
    let manifest = null;
    if (fsSync.existsSync(manifestPath)) {
      try { manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")); }
      catch {}
    }
    out.push({ name: e.name, dir, manifest });
  }
  // Newest-first (manifest.savedAt, fallback to dirname).
  out.sort((a, b) => {
    const ta = a.manifest?.savedAt ?? a.name;
    const tb = b.manifest?.savedAt ?? b.name;
    return ta < tb ? 1 : ta > tb ? -1 : 0;
  });
  return out;
}

async function resolveSnapshot(target) {
  const all = await listSnapshots();
  // Exact dirname match wins.
  const exact = all.find(s => s.name === target);
  if (exact) return exact;
  // Prefix match on dirname (timestamp prefix).
  const prefix = all.filter(s => s.name.startsWith(target));
  if (prefix.length === 1) return prefix[0];
  if (prefix.length > 1) {
    throw new Error(`restore: "${target}" matches ${prefix.length} snapshots:\n  - ${prefix.map(s => s.name).join("\n  - ")}`);
  }
  // Label match (manifest.label exact).
  const byLabel = all.filter(s => s.manifest?.label === target);
  if (byLabel.length === 1) return byLabel[0];
  if (byLabel.length > 1) {
    throw new Error(`restore: label "${target}" matches ${byLabel.length} snapshots — use timestamp prefix instead.`);
  }
  throw new Error(`restore: no snapshot matching "${target}". Run "node scripts/backup.mjs list".`);
}
