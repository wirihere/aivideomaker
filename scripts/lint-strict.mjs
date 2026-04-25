// lint-strict.mjs — CI-gateable strict linter for the recurring §4 pitfalls.
//
// Wraps scripts/fix.mjs (in detect-only / --json mode) so we never duplicate
// detector logic. Exit code is gated on **error-severity** findings only —
// `warn`/`info` are allowed through so the standard quality gate doesn't
// turn into a noise factory. The output is the same pass()/fail()/warn()
// style as scripts/smoke.mjs so CI logs read consistently.
//
// Usage:
//   node scripts/lint-strict.mjs                        # default, error-gated
//   node scripts/lint-strict.mjs --ignore=cdn,bundle    # skip pitfall ids (forwarded to fix.mjs)
//   node scripts/lint-strict.mjs --quiet                # only print fails / final summary
//
// Exit codes:
//   0 — no error-severity findings
//   1 — at least one error-severity finding (or fix.mjs crashed)

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- arg parsing ------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = {};
for (const a of argv) {
  if (!a.startsWith("--")) continue;
  const [k, v] = a.replace(/^--/, "").split("=");
  flags[k] = v ?? true;
}
const wantQuiet = flags.quiet === true;
// Forward --ignore=<csv> to fix.mjs (same semantics).
const ignoreArg = typeof flags.ignore === "string" ? `--ignore=${flags.ignore}` : null;

// --- output helpers (smoke.mjs style) ---------------------------------------
const ok = []; const fails = []; const warns = [];
const pass = (msg) => ok.push(msg);
const fail = (msg) => fails.push(msg);
const warn = (msg) => warns.push(msg);

// Which detector ids have a deterministic mechanical fix in fix.mjs.
// Kept in sync with FIX_APPLIERS in scripts/fix.mjs — if you add a new applier
// there, mirror it here so the CI output advertises `npm run fix:apply`.
const AUTO_FIX_IDS = new Set(["script-close", "autoplay-guard", "cdn"]);

// --- main -------------------------------------------------------------------
const t0 = Date.now();
console.log("▶ lint:strict — error-gated detectors from scripts/fix.mjs");

const fixArgs = ["scripts/fix.mjs", "--json"];
if (ignoreArg) fixArgs.push(ignoreArg);

const proc = spawnSync(process.execPath, fixArgs, {
  cwd: projectRoot,
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});

if (proc.error) {
  console.error(`✗ failed to run scripts/fix.mjs: ${proc.error.message}`);
  process.exit(1);
}
// fix.mjs sets exit code 1 only when it found error-severity issues — but
// we still want to parse stdout in either case to surface them ourselves.
if (proc.stderr && proc.stderr.trim()) {
  // fix.mjs only writes to stderr when a detector itself crashed (not on
  // findings). Surface that as a hard failure — broken detector is a CI bug.
  for (const line of proc.stderr.trim().split(/\r?\n/)) {
    fail(`fix.mjs: ${line}`);
  }
}

let payload = null;
try {
  payload = JSON.parse(proc.stdout || "null");
} catch (err) {
  fail(`could not parse fix.mjs JSON output: ${err.message}`);
  // Dump first 400 chars of stdout for diagnosis.
  const head = (proc.stdout || "").slice(0, 400).replace(/\n/g, " ");
  if (head) fail(`raw: ${head}`);
  report();
  process.exit(1);
}

if (!payload || !Array.isArray(payload.files)) {
  fail("fix.mjs JSON payload missing files[]");
  report();
  process.exit(1);
}

// --- aggregate findings -----------------------------------------------------
const totals = { error: 0, warn: 0, info: 0 };
const errorFindings = [];   // [{ file, finding }]
const warnFindings = [];
const infoFindings = [];

for (const fileEntry of payload.files) {
  for (const f of fileEntry.findings || []) {
    totals[f.severity] = (totals[f.severity] || 0) + 1;
    const item = { file: fileEntry.file, finding: f };
    if (f.severity === "error") errorFindings.push(item);
    else if (f.severity === "warn") warnFindings.push(item);
    else infoFindings.push(item);
  }
}

// --- emit per-finding lines (errors as fail, warnings as warn) --------------
function locStr(file, line) {
  return `${file}:${line}`;
}
function autoFixHint(id) {
  if (!AUTO_FIX_IDS.has(id)) return null;
  return "auto-fix available — run: npm run fix:apply";
}

for (const { file, finding } of errorFindings) {
  // Compose the multi-line message smoke.mjs's reporter prints verbatim.
  // Each \n shows up as a separate line under the same ✗ glyph.
  const head = `${locStr(file, finding.line)} [${finding.id}] ${finding.message}`;
  const lines = [head, `  fix: ${finding.suggestion}`];
  const auto = autoFixHint(finding.id);
  if (auto) lines.push(`  ${auto}`);
  fail(lines.join("\n  "));
}

if (!wantQuiet) {
  for (const { file, finding } of warnFindings) {
    const auto = autoFixHint(finding.id);
    const tail = auto ? `  (${auto})` : "";
    warn(`${locStr(file, finding.line)} [${finding.id}] ${finding.message}${tail}`);
  }
  for (const { file, finding } of infoFindings) {
    // Surface infos as "passed-through warns" for visibility but don't gate.
    warn(`${locStr(file, finding.line)} [${finding.id}] ${finding.message}`);
  }
}

// Headline pass for the no-errors case so the green-line summary is meaningful
// even on a clean run.
if (totals.error === 0) {
  const scanned = payload.files.length;
  const advisory = totals.warn + totals.info;
  pass(`scanned ${scanned} composition${scanned === 1 ? "" : "s"} — 0 errors`);
  if (advisory > 0) {
    pass(`${advisory} advisory finding${advisory === 1 ? "" : "s"} (warn/info — not gated)`);
  }
}

// --- report -----------------------------------------------------------------
function report() {
  const dt = ((Date.now() - t0) / 1000).toFixed(2);
  console.log("");
  for (const m of ok)    console.log(`  ✓ ${m}`);
  for (const m of warns) console.log(`  ⚠ ${m}`);
  for (const m of fails) console.log(`  ✗ ${m}`);
  console.log("");
  console.log(`◇ ${ok.length} passed · ${warns.length} warnings · ${fails.length} failed (${dt}s)`);
}

report();
process.exit(fails.length === 0 ? 0 : 1);
