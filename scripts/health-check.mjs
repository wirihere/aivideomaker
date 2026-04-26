#!/usr/bin/env node
// scripts/health-check.mjs — fast read-only project pre-flight audit.
//
// Surfaces project-state problems in <5 seconds. Run as `npm run health`.
// Read-only: never mutates anything; safe to call before/after any task.
//
// Strategy for the 5s budget:
//   - npm run lint --json  AND  npm run smoke:cli  spawn in parallel up front
//     (longest pole — ~1.5s + ~6s sequential, but they run alongside each other
//     and the FS scans below). On wall-clock the script finishes when smoke:cli
//     does; lint and the FS checks finish well before.
//   - Everything else is filesystem walks + a single tiny git call. No
//     Playwright, no FFmpeg, no network, no asset cache mutation.
//
// Output is one short report (see the README). Exit code:
//   0 = all green
//   1 = warnings only
//   2 = errors (lint errors, smoke failure, missing baseline files)

import { spawn } from "child_process";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { node as nodeBin, npmArgs } from "./lib/platform-bin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---- knobs --------------------------------------------------------------
// Disk-size warn thresholds. Spec defaults: renders 2GB, .cache 1GB, tmp 500MB.
const RENDERS_WARN_BYTES = 2 * 1024 ** 3;
const CACHE_WARN_BYTES   = 1 * 1024 ** 3;
const TMP_WARN_BYTES     = 500 * 1024 ** 2;
const COMBO_BASELINE     = 16;
const LEDGER_LOOKBACK    = 12; // last N verdicts to summarise

// ---- helpers ------------------------------------------------------------
// Glyphs match the rest of the project (audio-duck, backup, build-bundle,
// smoke, comp-manifest, …). The trailing space normalises the column.
const ICON = { ok: "✓", warn: "⚠", err: "✗", info: "ⓘ" };

function fmtBytes(n) {
  if (n >= 1024 ** 3) return (n / 1024 ** 3).toFixed(1) + "GB";
  if (n >= 1024 ** 2) return (n / 1024 ** 2).toFixed(1) + "MB";
  if (n >= 1024)      return (n / 1024).toFixed(1) + "KB";
  return n + "B";
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Spawn a child, capture stdout. Resolves to {code, stdout, stderr, dt}.
// Never rejects — failure is reported via `code !== 0` so callers can decide.
function spawnCapture(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let stdout = "";
    let stderr = "";
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => resolve({ code: -1, stdout, stderr: stderr + "\n" + err.message, dt: Date.now() - t0 }));
    child.on("close", (code) => resolve({ code, stdout, stderr, dt: Date.now() - t0 }));
  });
}

// Recursive directory size in bytes. Safe on missing dirs (returns 0). Walks
// each directory sequentially: deeply parallel `Promise.all(stat...)` was
// silently dropping stats on Windows when fan-out got too wide (EMFILE-class
// races inside `renders/.vite-frames-*` which contain ~hundreds of pngs).
// Callers can still parallelise across multiple ROOTS — see checkDisk().
async function dirSize(dir) {
  let total = 0;
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    try {
      if (e.isDirectory()) {
        total += await dirSize(p);
      } else if (e.isFile()) {
        const st = await fsp.stat(p);
        total += st.size;
      }
    } catch {
      // ignore unreadable entries — health is best-effort
    }
  }
  return total;
}

async function readFileSafe(p) {
  try { return await fsp.readFile(p, "utf8"); } catch { return null; }
}

async function listGlob(dir, predicate) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && predicate(e.name))
    .map((e) => path.join(dir, e.name));
}

// ---- check tasks --------------------------------------------------------

// 1. Lint state — npm run lint --json. Counts errors+warnings from JSON tail.
async function checkLint() {
  const args = npmArgs("lint", ["--json"]);
  const r = await spawnCapture(nodeBin, args);
  // The JSON object is the last { ... } block in stdout. Find it robustly.
  const start = r.stdout.indexOf("{");
  let parsed = null;
  if (start >= 0) {
    try { parsed = JSON.parse(r.stdout.slice(start)); } catch { /* fall through */ }
  }
  if (!parsed) {
    return {
      key: "lint",
      level: r.code === 0 ? "warn" : "err",
      label: "lint",
      detail: r.code === 0 ? "ran but output unparsed" : `exit ${r.code}`,
    };
  }
  const errs = parsed.errorCount ?? 0;
  const warns = parsed.warningCount ?? 0;
  return {
    key: "lint",
    level: errs > 0 ? "err" : warns > 0 ? "warn" : "ok",
    label: "lint",
    detail: `${errs} error${errs === 1 ? "" : "s"}, ${warns} warning${warns === 1 ? "" : "s"}`,
  };
}

// 2. Smoke state — npm run smoke:cli, filtered to the fast subset so health
//    fits inside its 5s budget. We skip `renders:list` (~3.5s, ffprobe per
//    MP4) and `video.mjs --dry-run` (~1.4s) — the heaviest two. Everything
//    else still runs and exercises the same shared state (asset cache,
//    .backups/, comp-manifest). Run `npm run smoke:cli` directly for the
//    full suite.
const SMOKE_SKIP_FILTER = "^(?!.*(renders:list|video\\.mjs)).+$";
async function checkSmoke() {
  const args = npmArgs("smoke:cli", [`--filter=${SMOKE_SKIP_FILTER}`]);
  const r = await spawnCapture(nodeBin, args);
  // smoke-cli prints a tail like "◇ 12 passed · 1 failed (6.4s)".
  const m = r.stdout.match(/(\d+)\s+passed(?:\s+·\s+(\d+)\s+failed)?\s+\(([\d.]+)s\)/);
  if (!m) {
    return {
      key: "smoke",
      level: r.code === 0 ? "warn" : "err",
      label: "smoke:cli",
      detail: r.code === 0 ? "ran but output unparsed" : `exit ${r.code}`,
    };
  }
  const passed = +m[1];
  const failed = +(m[2] || 0);
  const total = passed + failed;
  const sec = m[3];
  return {
    key: "smoke",
    level: failed > 0 ? "err" : "ok",
    label: "smoke:cli",
    detail: `${passed}/${total} pass (${sec}s)`,
  };
}

// 3. Templates — count compositions/templates/*.html and verify each contains
//    a HEAD-INCLUDE block whose body matches design/compose-head.html.
//    "Drift" here means presence/match: any template missing the marker, or
//    whose marker body diverges from the canonical fragment, is counted.
async function checkTemplates() {
  const tplDir = path.join(ROOT, "compositions", "templates");
  const headSrc = await readFileSafe(path.join(ROOT, "design", "compose-head.html"));
  if (headSrc == null) {
    return { key: "templates", level: "err", label: "templates", detail: "design/compose-head.html missing" };
  }
  // Canonical body: the link/script tags inside the fragment, normalised by
  // collapsing whitespace. The fragment file's leading <!-- ... --> is
  // metadata; what we actually inject is the tag block after it. We just
  // normalise by stripping all comments and excess whitespace.
  const norm = (s) => s.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim();
  const canonical = norm(headSrc);
  const tpls = await listGlob(tplDir, (n) => n.endsWith(".html"));
  let drifted = 0;
  for (const f of tpls) {
    const txt = await readFileSafe(f);
    if (!txt) { drifted++; continue; }
    const m = txt.match(/<!--\s*HEAD-INCLUDE\s*-->([\s\S]*?)<!--\s*\/HEAD-INCLUDE\s*-->/);
    if (!m) { drifted++; continue; }
    if (!norm(m[1]).includes(canonical) && norm(m[1]) !== canonical) drifted++;
  }
  const total = tpls.length;
  const matched = total - drifted;
  return {
    key: "templates",
    level: drifted > 0 ? "warn" : (total === 0 ? "err" : "ok"),
    label: "templates",
    detail: drifted > 0
      ? `${matched}/${total} (head-include drift on ${drifted})`
      : `${total}/${total} (head-include current)`,
  };
}

// 4. Brand tokens — count design/tokens-*.css and verify each defines the
//    canonical card variables (same set we use everywhere else: --card-accent,
//    --card-paper, --card-slate at minimum).
async function checkTokens() {
  const designDir = path.join(ROOT, "design");
  const tokenFiles = await listGlob(designDir, (n) => n.startsWith("tokens-") && n.endsWith(".css"));
  const REQUIRED = ["--card-accent", "--card-paper", "--card-slate"];
  let valid = 0;
  for (const f of tokenFiles) {
    const txt = await readFileSafe(f);
    if (!txt) continue;
    if (REQUIRED.every((v) => txt.includes(v))) valid++;
  }
  const total = tokenFiles.length;
  return {
    key: "tokens",
    level: total === 0 ? "warn" : (valid < total ? "warn" : "ok"),
    label: "tokens",
    detail: valid === total
      ? `${total} brands cached`
      : `${valid}/${total} brands valid (missing --card-* in ${total - valid})`,
  };
}

// 5. Music shortlists — every JSON in assets/music-shortlists/ must have a
//    non-empty `tracks` array.
async function checkMusic() {
  const dir = path.join(ROOT, "assets", "music-shortlists");
  const files = await listGlob(dir, (n) => n.endsWith(".json"));
  let withTracks = 0;
  for (const f of files) {
    const txt = await readFileSafe(f);
    if (!txt) continue;
    try {
      const j = JSON.parse(txt);
      if (Array.isArray(j.tracks) && j.tracks.length > 0) withTracks++;
    } catch { /* malformed — counts as missing */ }
  }
  const total = files.length;
  return {
    key: "music",
    level: total === 0 ? "warn" : (withTracks < total ? "warn" : "ok"),
    label: "music shortlists",
    detail: `${withTracks} / ${total} with tracks`,
  };
}

// 6. Combo coverage — design/modules/combo-fx.js exposes a global comboFx
//    registry near EOF: `global.comboFx = { name1, name2, ... };`. We parse
//    that block and count keys. Baseline (from LEARNINGS) is COMBO_BASELINE.
async function checkCombos() {
  const txt = await readFileSafe(path.join(ROOT, "design", "modules", "combo-fx.js"));
  if (!txt) return { key: "combos", level: "err", label: "combos", detail: "combo-fx.js missing" };
  const m = txt.match(/global\.comboFx\s*=\s*\{([\s\S]*?)\}/);
  if (!m) return { key: "combos", level: "err", label: "combos", detail: "registry block not found" };
  const body = m[1];
  // Each entry is an identifier followed by , or end. Strip comments first.
  const clean = body.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const ids = clean.split(",").map((s) => s.trim()).filter(Boolean);
  const count = ids.length;
  return {
    key: "combos",
    level: count < COMBO_BASELINE ? "warn" : "ok",
    label: "combos",
    detail: `${count} (${count >= COMBO_BASELINE ? ">=" : "<"} ${COMBO_BASELINE} baseline)`,
  };
}

// 7. Compositions — count compositions/*.html and list any missing an <audio>
//    element (suggests narration or music never wired).
async function checkCompositions() {
  const dir = path.join(ROOT, "compositions");
  const files = await listGlob(dir, (n) => n.endsWith(".html"));
  const missing = [];
  for (const f of files) {
    const txt = await readFileSafe(f);
    if (!txt) continue;
    if (!/<audio\b/i.test(txt)) missing.push(path.basename(f, ".html"));
  }
  const total = files.length;
  const m = missing.length;
  let detail;
  if (m === 0) {
    detail = `${total}/${total} with audio wired`;
  } else {
    const preview = missing.slice(0, 3).join(", ");
    const more = missing.length > 3 ? ", +" + (missing.length - 3) + " more" : "";
    detail = `${m} of ${total} missing audio (${preview}${more})`;
  }
  return {
    key: "comps",
    level: m > 0 ? "warn" : "ok",
    label: "compositions",
    detail,
  };
}

// 8. Disk hygiene — sizes of renders/, assets/.cache/, tmp/. Each warns over
//    its own threshold; report rolls them up into a single-line summary.
async function checkDisk() {
  const [renders, cache, tmp] = await Promise.all([
    dirSize(path.join(ROOT, "renders")),
    dirSize(path.join(ROOT, "assets", ".cache")),
    dirSize(path.join(ROOT, "tmp")),
  ]);
  const findings = [];
  if (renders > RENDERS_WARN_BYTES) findings.push({ name: "renders", size: renders, hint: "run `npm run renders:prune`" });
  if (cache > CACHE_WARN_BYTES)     findings.push({ name: "assets/.cache", size: cache, hint: "run `npm run cache:clear`" });
  if (tmp > TMP_WARN_BYTES)         findings.push({ name: "tmp", size: tmp, hint: "manual prune ok" });
  if (findings.length === 0) {
    return {
      key: "disk",
      level: "ok",
      label: "disk",
      detail: `renders ${fmtBytes(renders)} · cache ${fmtBytes(cache)} · tmp ${fmtBytes(tmp)}`,
    };
  }
  // Surface only the first over-threshold dir on the headline; the rest
  // appear as additional rows so each gets its own bullet.
  const rows = findings.map((f) => ({
    key: "disk:" + f.name,
    level: "warn",
    label: "disk: " + f.name,
    detail: `${fmtBytes(f.size)} (over warn threshold — ${f.hint})`,
  }));
  return rows;
}

// 9. Git state — counts uncommitted changes and lists top untracked entries.
async function checkGit() {
  const r = await spawnCapture("git", ["status", "--porcelain"]);
  if (r.code !== 0) {
    return { key: "git", level: "warn", label: "git", detail: "not a repo or git unavailable" };
  }
  const lines = r.stdout.split(/\r?\n/).filter(Boolean);
  let modified = 0;
  let untracked = 0;
  const untrackedPaths = [];
  for (const l of lines) {
    if (l.startsWith("??")) {
      untracked++;
      if (untrackedPaths.length < 10) untrackedPaths.push(l.slice(3));
    } else {
      modified++;
    }
  }
  const detail = `${modified} modified, ${untracked} untracked`;
  return { key: "git", level: "info", label: "git", detail };
}

// 10. Recent verifier verdicts — read docs/render-learnings/LEDGER.md, take the
//     last LEDGER_LOOKBACK rows, count ship/watch/needs-fix.
async function checkLedger() {
  const txt = await readFileSafe(path.join(ROOT, "docs", "render-learnings", "LEDGER.md"));
  if (!txt) return { key: "ledger", level: "info", label: "ledger", detail: "LEDGER.md missing" };
  // Each data row starts with "| <date>" and the verdict is the last cell.
  const rows = txt.split(/\r?\n/).filter((l) => /^\|\s*\d{4}-\d{2}-\d{2}/.test(l));
  const recent = rows.slice(-LEDGER_LOOKBACK);
  const counts = { ship: 0, watch: 0, "needs-fix": 0, other: 0 };
  for (const row of recent) {
    const cells = row.split("|").map((s) => s.trim()).filter(Boolean);
    const v = (cells[cells.length - 1] || "").toLowerCase();
    if (v.includes("needs-fix")) counts["needs-fix"]++;
    else if (v.includes("ship"))  counts.ship++;
    else if (v.includes("watch")) counts.watch++;
    else counts.other++;
  }
  const detail = `${counts.ship} ship, ${counts.watch} watch, ${counts["needs-fix"]} needs-fix in last ${recent.length} entries`;
  return { key: "ledger", level: "info", label: "ledger", detail };
}

// ---- main ---------------------------------------------------------------

const t0 = Date.now();

// Fire the two slow npm-script children up-front so they overlap with FS work.
const lintP = checkLint();
const smokeP = checkSmoke();

// FS checks run concurrently — each is a few ms.
const [
  templatesR, tokensR, musicR, combosR, compsR, diskR, gitR, ledgerR,
] = await Promise.all([
  checkTemplates(),
  checkTokens(),
  checkMusic(),
  checkCombos(),
  checkCompositions(),
  checkDisk(),
  checkGit(),
  checkLedger(),
]);

const [lintR, smokeR] = await Promise.all([lintP, smokeP]);

// Compose the report in display order. checkDisk may return either a single
// finding (clean) or an array (one per over-threshold dir).
const rows = [];
rows.push(lintR);
rows.push(smokeR);
rows.push(templatesR);
rows.push(tokensR);
rows.push(musicR);
rows.push(combosR);
rows.push(compsR);
if (Array.isArray(diskR)) rows.push(...diskR); else rows.push(diskR);
rows.push(gitR);
rows.push(ledgerR);

// ---- render -------------------------------------------------------------
const totalMs = Date.now() - t0;
console.log("");
console.log(`▶ project health — ${nowStamp()}`);
console.log("");
const widest = rows.reduce((w, r) => Math.max(w, r.label.length), 0);
for (const r of rows) {
  const icon = ICON[r.level] || ICON.info;
  console.log(`  ${icon} ${r.label.padEnd(widest)}   ${r.detail}`);
}
console.log("");

// ---- verdict + exit -----------------------------------------------------
const errs = rows.filter((r) => r.level === "err").length;
const warns = rows.filter((r) => r.level === "warn").length;
let verdict;
let exitCode;
if (errs > 0)        { verdict = `✗ ${errs} error${errs === 1 ? "" : "s"}`; exitCode = 2; }
else if (warns > 0)  { verdict = `⚠ ${warns} warning${warns === 1 ? "" : "s"}, no blockers`; exitCode = 1; }
else                 { verdict = "✓ clean";                                  exitCode = 0; }

console.log(`▶ verdict: ${verdict}  (${(totalMs / 1000).toFixed(1)}s)`);
console.log("");
process.exit(exitCode);
