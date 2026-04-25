// backup.mjs — checkpoint + rollback the bits of the workspace that matter.
// `archive/` was the manual "snapshot before risky change" stash; this gives
// it a verb. Scope: authored surface (HTML comps, brand tokens, project
// metadata, learnings). Renders, fetched media, node_modules, smoke baselines
// excluded — big and regenerable. Operators use git for actual commits.
// Saves are atomic (.tmp → rename); restore/prune are dry-run by default,
// --apply commits the destructive op. See printHelp() for usage.

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const backupsDir = path.join(projectRoot, ".backups");

// Snapshot scope. `file` = single optional file; `glob-top` = top-level only,
// optionally filtered by extension + filename regex; `dir` = recurse and filter
// by extension. Excludes are by omission (renders/, assets/, node_modules/...).
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

// --- arg parsing + dispatch -------------------------------------------------
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
try {
  switch (command) {
    case "save":    await cmdSave();    break;
    case "list":    await cmdList();    break;
    case "restore": await cmdRestore(positional[0]); break;
    case "prune":   await cmdPrune();   break;
    default: console.error(`✗ unknown command: ${command}`); printHelp(); process.exit(2);
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
  if (files.length === 0) { console.log("◇ snapshot scope is empty — nothing to save."); return; }
  const dirName = `${stampNow()}-${label}`;
  const finalDir = path.join(backupsDir, dirName);
  const tmpDir   = path.join(backupsDir, `${dirName}.tmp`);
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  console.log(`▶ backup save\n  label:    ${label}\n  target:   ${rel(finalDir)}\n  files:    ${files.length}\n  size:     ${fmtBytes(totalBytes)}`);
  if (dryRun) {
    console.log("\nWould copy:");
    for (const f of files) console.log(`  ${f.rel}  (${fmtBytes(f.size)})`);
    console.log("\n◇ dry-run only — pass without --dry-run to write.");
    return;
  }

  // Atomic write: tmp dir → rename. Clean up tmp on any throw — never leave
  // partial dirs behind.
  await fs.mkdir(backupsDir, { recursive: true });
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
      label, fileCount: files.length, totalBytes,
      gitRev: gitHeadShort(),
    };
    await fs.writeFile(path.join(tmpDir, ".manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

    // Same-second collision with same label: stash the prior dir aside rather
    // than overwriting — operator can review and delete.
    if (fsSync.existsSync(finalDir)) {
      const stash = `${finalDir}.collision-${crypto.randomBytes(3).toString("hex")}`;
      await fs.rename(finalDir, stash);
      console.log(`  (collision: prior ${dirName} stashed at ${path.basename(stash)})`);
    }
    await fs.rename(tmpDir, finalDir);
  } catch (err) {
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
    throw err;
  }
  console.log(`\n◇ saved ${files.length} file(s) → ${rel(finalDir)}`);
}

// --- list -------------------------------------------------------------------
async function cmdList() {
  const snapshots = await listSnapshots();
  if (snapshots.length === 0) { console.log("◇ no snapshots in .backups/"); return; }
  console.log(`▶ backup list — ${snapshots.length} snapshot(s)\n`);
  const w = [20, 24, 6, 9, 4];
  const cols = ["saved", "label", "files", "size", "keep"];
  console.log("  " + cols.map((c, i) => String(c).padEnd(w[i])).join("  ") + "  dir");
  console.log("  " + w.map(x => "-".repeat(x)).join("  ") + "  ----");
  for (const s of snapshots) {
    const m = s.manifest || {};
    const saved = (m.savedAt || "?").replace("T", " ").replace(/\..*$/, "").slice(0, 19);
    console.log("  " + [
      saved.padEnd(w[0]),
      String(m.label || "?").slice(0, w[1]).padEnd(w[1]),
      String(m.fileCount ?? "?").padEnd(w[2]),
      fmtBytes(m.totalBytes ?? 0).padEnd(w[3]),
      (m.keep ? "yes" : "-").padEnd(w[4]),
      s.name,
    ].join("  "));
  }
}

// --- restore ----------------------------------------------------------------
async function cmdRestore(target) {
  if (!target) throw new Error("restore: missing <timestamp-or-label> argument");
  const apply = flags.apply === true;
  const snapshot = await resolveSnapshot(target);
  console.log(`▶ backup restore\n  source:   ${snapshot.name}`);
  if (snapshot.manifest) {
    console.log(`  saved:    ${snapshot.manifest.savedAt}\n  label:    ${snapshot.manifest.label}`);
    if (snapshot.manifest.gitRev) console.log(`  gitRev:   ${snapshot.manifest.gitRev}`);
  }
  // Walk the snapshot dir, classify each file vs the live workspace.
  const snapshotFiles = await walkAll(snapshot.dir, snapshot.dir);
  let added = 0, modified = 0, unchanged = 0;
  const plan = [];
  for (const r of snapshotFiles) {
    if (r === ".manifest.json") continue;
    const src = path.join(snapshot.dir, r);
    const dest = path.join(projectRoot, r);
    const liveExists = fsSync.existsSync(dest);
    const same = liveExists && (await sha256(src)) === (await sha256(dest));
    let status;
    if (!liveExists) { status = "added";     added++; }
    else if (same)   { status = "unchanged"; unchanged++; }
    else             { status = "modified";  modified++; }
    plan.push({ rel: r, src, dest, status });
  }

  console.log(`\nPlan: ${plan.length} file(s) — ${added} added, ${modified} modified, ${unchanged} unchanged\n`);
  for (const p of plan) {
    if (p.status !== "unchanged") console.log(`  ${p.status === "added" ? "+" : "~"} ${p.rel}`);
  }
  if (added + modified === 0) console.log("  (no changes)");
  console.log("");
  if (!apply) { console.log("◇ dry-run — pass --apply to commit destructive copy."); return; }
  // Mutate. Skip unchanged files to keep mtimes stable and the diff readable.
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
  const snapshots = await listSnapshots();   // already newest-first

  const protectedKeep = [], youngSurvived = [], toDelete = [];
  snapshots.forEach((s, idx) => {
    if (s.manifest?.keep)   { protectedKeep.push(s); return; }
    if (idx < keepLast)     { youngSurvived.push(s); return; }
    toDelete.push(s);
  });

  console.log(
    `▶ backup prune\n  policy:    keep-last=${keepLast}\n  total:     ${snapshots.length}` +
    `\n  protected: ${protectedKeep.length} (manifest.keep=true)\n  newest:    ${youngSurvived.length}` +
    `\n  to delete: ${toDelete.length}`
  );
  if (toDelete.length) {
    console.log(apply ? "\nDeleting:" : "\nWould delete:");
    for (const s of toDelete) console.log(`  - ${s.name}  (saved ${s.manifest?.savedAt ?? "?"})`);
  }
  console.log("");

  if (!apply) { console.log("◇ dry-run only — pass --apply to delete."); return; }
  if (!toDelete.length) { console.log("◇ nothing to delete."); return; }

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
  console.log([
    "backup.mjs — snapshot + restore the composition surface",
    "",
    "Commands:",
    "  save [--name=<label>] [--dry-run]    snapshot index.html, tokens, templates, etc.",
    "  list                                  list snapshots in .backups/",
    "  restore <ts-or-label> [--apply]       restore a snapshot (dry-run by default)",
    "  prune [--keep-last=N] [--apply]       drop oldest snapshots (dry-run by default)",
    "",
    "Scope: index.html, meta.json, LEARNINGS.md, transcript.json, design/tokens-*.css,",
    "       compositions/*.html (top-level), compositions/templates/**, compositions/verticals/**.",
    "       Excludes renders/, assets/, node_modules/, smoke/, archive/.",
  ].join("\n"));
}

function sanitizeLabel(raw) {
  // alphanumeric + dash; collapse runs; trim; default if empty.
  const cleaned = String(raw).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "snapshot";
}

function stampNow() {
  // YYYY-MM-DD_HH-mm — sortable, filename-safe across OSes.
  const d = new Date(), pad = (n) => String(n).padStart(2, "0");
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

function rel(p) { return path.relative(projectRoot, p).replace(/\\/g, "/"); }

async function sha256(p) {
  return crypto.createHash("sha256").update(await fs.readFile(p)).digest("hex");
}

async function collectScope() {
  const out = [];
  const push = async (relPath, abs) => {
    const st = await fs.stat(abs);
    if (st.isFile()) out.push({ rel: relPath.replace(/\\/g, "/"), abs, size: st.size });
  };
  for (const e of SCOPE) {
    const abs = path.join(projectRoot, e.rel);
    if (!fsSync.existsSync(abs)) continue;
    if (e.kind === "file") {
      await push(e.rel, abs);
    } else if (e.kind === "glob-top") {
      for (const name of await fs.readdir(abs)) {
        if (e.exts && !e.exts.includes(path.extname(name).toLowerCase())) continue;
        if (e.match && !e.match.test(name)) continue;
        await push(path.posix.join(e.rel, name), path.join(abs, name));
      }
    } else if (e.kind === "dir") {
      for (const r of await walkAll(abs, abs)) {
        if (e.exts && !e.exts.includes(path.extname(r).toLowerCase())) continue;
        await push(path.posix.join(e.rel, r), path.join(abs, r));
      }
    }
  }
  // Stable order — same workspace + same label = manifest-equivalent backup
  // (modulo timestamp/gitRev).
  out.sort((a, b) => a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0);
  return out;
}

async function walkAll(root, dir) {
  // Returns POSIX-style relative paths under `root`.
  const out = [];
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) for (const s of await walkAll(root, full)) out.push(s);
    else if (e.isFile()) out.push(path.relative(root, full).replace(/\\/g, "/"));
  }
  return out;
}

async function listSnapshots() {
  if (!fsSync.existsSync(backupsDir)) return [];
  const out = [];
  for (const e of await fs.readdir(backupsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.endsWith(".tmp") || e.name.includes(".collision-")) continue;
    const dir = path.join(backupsDir, e.name);
    const manifestPath = path.join(dir, ".manifest.json");
    let manifest = null;
    if (fsSync.existsSync(manifestPath)) {
      try { manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")); } catch {}
    }
    out.push({ name: e.name, dir, manifest });
  }
  // Newest-first (manifest.savedAt, fallback to dirname).
  out.sort((a, b) => {
    const ta = a.manifest?.savedAt ?? a.name, tb = b.manifest?.savedAt ?? b.name;
    return ta < tb ? 1 : ta > tb ? -1 : 0;
  });
  return out;
}

async function resolveSnapshot(target) {
  const all = await listSnapshots();
  // Exact dirname > prefix (timestamp) > exact label.
  const exact = all.find(s => s.name === target);
  if (exact) return exact;
  const matches = all.filter(s => s.name.startsWith(target));
  if (matches.length === 0) {
    const byLabel = all.filter(s => s.manifest?.label === target);
    if (byLabel.length === 1) return byLabel[0];
    if (byLabel.length > 1) throw new Error(`restore: label "${target}" matches ${byLabel.length} snapshots — use timestamp prefix instead.`);
    throw new Error(`restore: no snapshot matching "${target}". Run "node scripts/backup.mjs list".`);
  }
  if (matches.length === 1) return matches[0];
  throw new Error(`restore: "${target}" matches ${matches.length} snapshots:\n  - ${matches.map(s => s.name).join("\n  - ")}`);
}
