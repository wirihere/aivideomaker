// renders-prune.mjs — list / dry-run / prune MP4s in renders/.
//
// Disk hygiene for the renders/ dir, which grows ~5MB per run with no purge.
// Always defaults to dry-run; --apply is required to actually delete.
//
// Usage:
//   node scripts/renders-prune.mjs --list                  # table of MP4s, sorted newest-first
//   node scripts/renders-prune.mjs                         # dry-run with default policy
//   node scripts/renders-prune.mjs --apply                 # actually delete
//   node scripts/renders-prune.mjs --keep-last=5           # keep 5 newest (default 10)
//   node scripts/renders-prune.mjs --older-than=14d        # only consider files older than 14 days
//   node scripts/renders-prune.mjs --dry-run --keep-last=10
//
// Safety nets:
//   - --apply is required to delete; any other invocation is a preview.
//   - A sibling zero-byte sentinel file `<name>.keep` shields its MP4 forever.
//   - --keep-last always preserves the newest N regardless of age filter.
//
// ffprobe duration is best-effort. If neither bundled nor system ffprobe is
// available, the duration column shows "?" — the script still functions.
//
// Grade tags parsed from the filename suffix: -graded, -wm (watermark).

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const rendersDir = path.join(projectRoot, "renders");

// --- arg parsing ------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = {};
for (const a of argv) {
  if (!a.startsWith("--")) continue;
  const [k, v] = a.replace(/^--/, "").split("=");
  flags[k] = v ?? true;
}
const wantList = flags.list === true;
const wantApply = flags.apply === true;
// --dry-run is the default unless --apply is set; explicit --dry-run is a no-op
// alias for clarity in scripts.
const wantDryRun = !wantApply;
const keepLast = flags["keep-last"] !== undefined ? Number(flags["keep-last"]) : 10;
const olderThanDays = flags["older-than"] !== undefined ? parseDays(flags["older-than"]) : null;

if (Number.isNaN(keepLast) || keepLast < 0) {
  console.error(`✗ --keep-last must be a non-negative integer (got: ${flags["keep-last"]})`);
  process.exit(2);
}

// --- helpers ----------------------------------------------------------------

// Accept "14d", "14", "336h" — minutes/seconds out of scope. Returns whole days.
function parseDays(input) {
  const m = String(input).trim().match(/^(\d+)\s*(d|h)?$/i);
  if (!m) {
    console.error(`✗ --older-than must look like "14d" or "336h" (got: ${input})`);
    process.exit(2);
  }
  const n = Number(m[1]);
  return (m[2] && m[2].toLowerCase() === "h") ? n / 24 : n;
}

// Resolve ffprobe by substituting ffmpeg.exe → ffprobe.exe in the bundled
// path. The @ffmpeg-installer package only ships ffmpeg, but a sibling
// ffprobe.exe is sometimes manually placed there. Fall back to "ffprobe" on
// PATH (winget Gyan installs do have it). Returns null if no probe is usable.
let cachedProbe = null;
async function resolveFfprobe() {
  if (cachedProbe !== null) return cachedProbe || null;

  if (process.env.FFPROBE && fsSync.existsSync(process.env.FFPROBE)) {
    cachedProbe = process.env.FFPROBE;
    return cachedProbe;
  }

  // Try sibling of the bundled ffmpeg.
  const ff = await getFfmpegPath();
  const sibling = ff.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");
  if (sibling !== ff && fsSync.existsSync(sibling)) {
    cachedProbe = sibling;
    return cachedProbe;
  }

  // Fall back to system PATH; spawn a quick "-version" probe so we can return
  // null when it's missing (rather than failing later per-file).
  try {
    const r = spawnSync("ffprobe", ["-version"], { stdio: "ignore" });
    if (r.status === 0) {
      cachedProbe = "ffprobe";
      return cachedProbe;
    }
  } catch {}

  cachedProbe = "";  // sentinel: probed and absent
  return null;
}

function durationOf(ffprobe, file) {
  if (!ffprobe) return null;
  const r = spawnSync(ffprobe, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ], { encoding: "utf8" });
  if (r.status !== 0) return null;
  const n = parseFloat((r.stdout || "").trim());
  return Number.isFinite(n) ? n : null;
}

function fmtMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
function fmtDuration(seconds) {
  if (seconds == null) return "?";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m${String(s).padStart(2, "0")}s`;
}
function fmtCtime(d) {
  // Compact yyyy-mm-dd HH:MM
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function gradeTags(name) {
  const tags = [];
  if (/-graded(?:-|\.)/.test(name)) tags.push("graded");
  if (/-wm(?:-|\.)/.test(name))     tags.push("wm");
  return tags;
}

// --- collect ----------------------------------------------------------------

if (!fsSync.existsSync(rendersDir)) {
  console.log(`▶ renders-prune: no renders/ dir at ${rendersDir} — nothing to do.`);
  process.exit(0);
}

const ffprobe = await resolveFfprobe();
const entries = await fs.readdir(rendersDir);
const mp4s = entries.filter(e => e.toLowerCase().endsWith(".mp4"));
const keepNames = new Set(entries.filter(e => e.toLowerCase().endsWith(".keep")).map(e => e.slice(0, -5)));

const records = [];
for (const name of mp4s) {
  const full = path.join(rendersDir, name);
  const st = await fs.stat(full);
  records.push({
    name,
    full,
    size: st.size,
    ctime: st.ctime,
    mtime: st.mtime,
    duration: durationOf(ffprobe, full),
    keep: keepNames.has(name),
    tags: gradeTags(name),
  });
}

// Sort newest-first by ctime (creation time on Windows; on Linux
// status-change time, which is close enough for our hygiene purposes).
records.sort((a, b) => b.ctime - a.ctime);

const totalBytes = records.reduce((sum, r) => sum + r.size, 0);

// --- list mode --------------------------------------------------------------
if (wantList) {
  printTable(records, { title: `renders/ — ${records.length} file(s), ${fmtMB(totalBytes)} MB total` });
  if (!ffprobe) console.log("  (ffprobe not found — duration column shows '?')");
  process.exit(0);
}

// --- prune planning ---------------------------------------------------------
// Selection logic: a file is a deletion candidate iff
//   1. NOT in the newest `keepLast` (already sorted desc by ctime), AND
//   2. (no --older-than filter OR ctime is older than the cutoff), AND
//   3. has no .keep sentinel.
const now = Date.now();
const cutoffMs = olderThanDays != null ? now - olderThanDays * 86400 * 1000 : null;

const toDelete = [];
const protectedKeep = [];
const youngSurvived = [];
const tooNew = [];

records.forEach((r, idx) => {
  const inNewestN = idx < keepLast;
  if (r.keep) { protectedKeep.push(r); return; }
  if (inNewestN) { youngSurvived.push(r); return; }
  if (cutoffMs != null && r.ctime.getTime() > cutoffMs) {
    tooNew.push(r);
    return;
  }
  toDelete.push(r);
});

const reclaim = toDelete.reduce((s, r) => s + r.size, 0);

console.log("▶ renders-prune");
console.log(`  dir:         ${rendersDir}`);
console.log(`  policy:      keep-last=${keepLast}${olderThanDays != null ? `, older-than=${olderThanDays}d` : ""}`);
console.log(`  total:       ${records.length} mp4(s), ${fmtMB(totalBytes)} MB`);
console.log(`  protected:   ${protectedKeep.length} (.keep sentinel)`);
console.log(`  newest kept: ${youngSurvived.length}`);
if (cutoffMs != null) console.log(`  too-new:     ${tooNew.length} (under age cutoff)`);
console.log(`  candidates:  ${toDelete.length}, would reclaim ${fmtMB(reclaim)} MB`);
console.log("");

if (toDelete.length) {
  printTable(toDelete, { title: wantApply ? "Deleting:" : "Would delete:" });
}

if (!wantApply) {
  console.log("");
  console.log(wantDryRun && flags["dry-run"]
    ? "◇ dry-run only — pass --apply to delete."
    : "◇ no --apply flag — run again with --apply to delete.");
  process.exit(0);
}

// --- apply ------------------------------------------------------------------
if (!toDelete.length) {
  console.log("◇ nothing to delete.");
  process.exit(0);
}

let deleted = 0;
let failed = 0;
for (const r of toDelete) {
  try {
    await fs.unlink(r.full);
    deleted++;
  } catch (err) {
    console.error(`  ✗ ${r.name}: ${err.message}`);
    failed++;
  }
}
console.log("");
console.log(`◇ deleted ${deleted}/${toDelete.length}, reclaimed ${fmtMB(reclaim)} MB${failed ? ` (${failed} failed)` : ""}`);
process.exit(failed === 0 ? 0 : 1);

// --- output -----------------------------------------------------------------
function printTable(rows, { title }) {
  console.log(title);
  console.log("");
  // Columns: ctime | size MB | dur | tags | keep | name
  const header = ["ctime",            "size",  "dur",   "tags",   "keep", "name"];
  const widths = [16, 7, 7, 10, 4, 0];
  const fmtRow = (cols) => cols
    .map((c, i) => i === cols.length - 1 ? c : String(c).padEnd(widths[i]))
    .join("  ");
  console.log("  " + fmtRow(header));
  console.log("  " + fmtRow(widths.map(w => "-".repeat(Math.max(w, 4)))));
  for (const r of rows) {
    console.log("  " + fmtRow([
      fmtCtime(r.ctime),
      fmtMB(r.size),
      fmtDuration(r.duration),
      r.tags.join(",") || "-",
      r.keep ? "yes" : "-",
      r.name,
    ]));
  }
}
