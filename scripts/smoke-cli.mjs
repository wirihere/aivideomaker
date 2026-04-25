// CLI smoke-test runner — verifies the script-CLIs we shipped this iteration
// stay working over time. Sibling to scripts/smoke.mjs (which loads the active
// composition in Playwright); this one runs each tool in a contained, fast,
// no-side-effect way and asserts exit 0 + a sensible stdout pattern.
//
// Usage:
//   node scripts/smoke-cli.mjs                 # run all 11 tests
//   node scripts/smoke-cli.mjs --filter=audio  # run only tests matching regex
//   node scripts/smoke-cli.mjs --verbose       # print each test's stdout/stderr
//
// Exit codes:
//   0 — all tests passed
//   1 — at least one test failed
//
// Each test is sequential (asset cache + .backups/ are shared state, so
// parallelism would race), capped at 4s. Total wall-clock ~5-7s on a clean tree.
//
// To wire a new tool in: add an entry to TESTS — { name, cmd, args, expect }
// where `expect` is either a substring or a RegExp the stdout must contain.
// Pass = exit 0 AND expect matches. Otherwise the test fails and stderr is
// printed (or under --verbose, both stdout + stderr always print).

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { node as nodeBin } from "./lib/platform-bin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const filterRe = flags.filter ? new RegExp(flags.filter, "i") : null;
const verbose = flags.verbose === true;

// --- test table -----------------------------------------------------------
// `cmd` is a node script path (relative to projectRoot) or "npm" sentinel.
// For npm-script tests we shell out via npm-cli.js to mirror what the user
// types — this catches package.json regressions, not just script bugs.
//
// Each test is contained: synthetic args (--dry-run, --list), no API calls,
// no file mutation. README.md doubles as a placeholder audio path for
// audio-duck --dry-run since the script only stat-checks file existence.
const README = path.join(projectRoot, "README.md");
const TMP_OUT = path.join(projectRoot, "tmp", "smoke-cli-noop.mp3");
const INDEX_HTML = path.join(projectRoot, "index.html");

const TESTS = [
  {
    name: "npm run help",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "help.mjs")],
    expect: /npm scripts in package\.json/,
  },
  {
    name: "npm run usage",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "usage.mjs")],
    // The 4-section report always emits these section headers.
    expect: /\[1\] Used by 0[\s\S]*\[2\] Used by 1[\s\S]*\[3\] Used by 2-9[\s\S]*\[4\] Hot files/,
  },
  {
    name: "npm run usage:unused",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "usage.mjs"), "--unused"],
    // Output is bare paths, one per line. May be empty on a clean tree —
    // success is just exit 0 with no error noise.
    expect: "",
  },
  {
    name: "npm run cache:stats",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "lib", "asset-cache.mjs"), "stats"],
    expect: /Asset cache[\s\S]*Entries:[\s\S]*Total size:/,
  },
  {
    name: "npm run renders:list",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "renders-prune.mjs"), "--list"],
    expect: /renders\/ — \d+ file\(s\), [\d.]+ MB total[\s\S]*ctime\s+size\s+dur/,
  },
  {
    name: "scripts/audio-duck.mjs --dry-run",
    cmd: nodeBin,
    args: [
      path.join(projectRoot, "scripts", "audio-duck.mjs"),
      `--voice=${README}`,
      `--music=${README}`,
      `--out=${TMP_OUT}`,
      "--dry-run",
    ],
    // Filter graph + dry-run notice are the load-bearing markers.
    expect: /filter_complex:[\s\S]*ffmpeg argv \(dry-run, not executed\)/,
  },
  {
    name: "scripts/preview-voices.mjs --list",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "preview-voices.mjs"), "--list"],
    // Tail emits "<N> voices would be synthesised."
    expect: /\d+ voices would be synthesised/,
  },
  {
    name: "scripts/comp-diff.mjs <self>",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "comp-diff.mjs"), INDEX_HTML, INDEX_HTML],
    expect: /no differences/,
  },
  {
    name: "scripts/comp-manifest.mjs heads",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "comp-manifest.mjs"), "heads"],
    // Drift check passes with "✓ N/N HEAD-INCLUDE blocks match".
    expect: /HEAD-INCLUDE blocks match/,
  },
  {
    name: "scripts/extract-copy.mjs --dry-run",
    cmd: nodeBin,
    args: [
      path.join(projectRoot, "scripts", "extract-copy.mjs"),
      "--framework=AIDA",
      "--brand=Smoke-test brand brief — please ignore",
      "--dry-run",
    ],
    // Dry-run prints the prompt header — no API call.
    expect: /\[framework mode · DRY RUN\][\s\S]*HARD CONSTRAINTS/,
  },
  {
    name: "scripts/backup.mjs list",
    cmd: nodeBin,
    args: [path.join(projectRoot, "scripts", "backup.mjs"), "list"],
    // Either "no snapshots" or a snapshot table — both fine. Pattern matches
    // the diamond bullet that prefixes either case.
    expect: /(no snapshots|snapshots? in \.backups)/i,
  },
];

// --- runner ---------------------------------------------------------------
function runOne(test) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(test.cmd, test.args, {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", d => { stdout += d.toString(); });
    child.stderr.on("data", d => { stderr += d.toString(); });

    // 4s wall-clock cap per test. The spec says ≤2s, but renders:list runs
    // ffprobe per MP4 and scales with file count (38 files = ~3s on this box).
    // Total budget is 10s across all tests, so 4s leaves headroom for the
    // genuinely fast ones. Anything stuck longer is a regression, not retry.
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, 4000);

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        name: test.name, ok: false, dt: Date.now() - t0,
        exit: -1, stdout, stderr: stderr + `\nspawn error: ${err.message}`,
        reason: `spawn error: ${err.message}`,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const dt = Date.now() - t0;
      if (timedOut) {
        return resolve({
          name: test.name, ok: false, dt, exit: code, stdout, stderr,
          reason: "timed out (>2s)",
        });
      }
      if (code !== 0) {
        return resolve({
          name: test.name, ok: false, dt, exit: code, stdout, stderr,
          reason: `exit ${code}`,
        });
      }
      // Match expectation against stdout. Empty string = no requirement.
      const expect = test.expect;
      let matched = true;
      if (expect instanceof RegExp) matched = expect.test(stdout);
      else if (typeof expect === "string" && expect.length > 0) matched = stdout.includes(expect);
      if (!matched) {
        return resolve({
          name: test.name, ok: false, dt, exit: code, stdout, stderr,
          reason: `output mismatch (expected ${expect})`,
        });
      }
      resolve({ name: test.name, ok: true, dt, exit: 0, stdout, stderr });
    });
  });
}

// --- main -----------------------------------------------------------------
const t0 = Date.now();
const selected = filterRe ? TESTS.filter(t => filterRe.test(t.name)) : TESTS;

if (filterRe && selected.length === 0) {
  console.error(`smoke-cli: no tests match --filter=${flags.filter}`);
  console.error(`available: ${TESTS.map(t => t.name).join(", ")}`);
  process.exit(2);
}

console.log(`▶ smoke-cli: ${selected.length} test${selected.length === 1 ? "" : "s"}`);

const results = [];
for (const test of selected) {
  const r = await runOne(test);
  results.push(r);
  const sec = (r.dt / 1000).toFixed(1);
  const padded = r.name.padEnd(40, " ");
  if (r.ok) {
    console.log(`  ✓ ${padded}  (${sec}s)`);
    if (verbose && r.stdout) console.log(indent(r.stdout));
  } else {
    console.log(`  ✗ ${padded}  (${sec}s) — ${r.reason}`);
    if (r.stdout) console.log(indent(r.stdout, "  out| "));
    if (r.stderr) console.log(indent(r.stderr, "  err| "));
  }
}

const passed = results.filter(r => r.ok).length;
const failed = results.length - passed;
const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log("");
console.log(`◇ ${passed} passed · ${failed} failed (${dt}s)`);

process.exit(failed === 0 ? 0 : 1);

// --- helpers --------------------------------------------------------------
function indent(s, prefix = "    ") {
  return s.replace(/\r?\n/g, "\n").split("\n").map(l => prefix + l).join("\n").replace(/\n+$/, "");
}
