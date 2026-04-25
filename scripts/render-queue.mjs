// Render queue — sequentially render multiple composition files to MP4.
// (This file is scripts/render-queue.mjs.)
//
// Usage:
//   npm run render:queue -- compositions/text-fx-demo.html compositions/effect-fx-demo.html
//   npm run render:queue -- "compositions/*.html"          # glob (quote it!)
//   npm run render:queue -- --list=todo.txt                # one path per line
//   npm run render:queue -- --dry-run compositions/foo.html # skip render, print plan
//   npm run render:queue -- --watermark "compositions/*.html"  # stamp every render
//
// Watermark / grade flags are forwarded verbatim to scripts/render.mjs:
//   --watermark[=path]  --watermark-text  --watermark-pos  --watermark-opacity
//   --watermark-font    --no-watermark    --no-grade       --lut       --strength
//   --replace
//
// Behaviour:
//   1. Resolve input paths (explicit args, glob, or list file).
//   2. Back up current index.html to archive/.queue-backup-<ts>.html (once).
//   3. For each comp:
//        - Copy into index.html, rewriting `../design/` → `design/` so
//          assets resolve from project root.
//        - Run `npm run check`. On failure: log + skip to next comp.
//        - Run `node scripts/render.mjs <forwarded flags>` (post-grade and
//          optional watermark are handled inside render.mjs).
//        - Move the new MP4(s) to renders/queue-<comp-stem>-<ts>.mp4.
//   4. Restore original index.html from backup.
//   5. Print summary: rendered, skipped, failed, total time.
//
// Constraints:
//   - Strictly sequential — never spawn renders in parallel.
//   - Spawned with shell:true so npm.cmd is found on Windows.
//   - Deterministic in spirit: timestamp and ordering are the only mutable state.

import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const rendersDir = path.join(projectRoot, "renders");
const archiveDir = path.join(projectRoot, "archive");
const indexPath = path.join(projectRoot, "index.html");

// ---------------------------------------------------------------------------
// arg parsing
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (const a of argv) {
  if (a.startsWith("--")) {
    const [k, v] = a.replace(/^--/, "").split("=");
    flags[k] = v ?? true;
  } else {
    positional.push(a);
  }
}

const dryRun = flags["dry-run"] === true;
const listFile = typeof flags.list === "string" ? flags.list : null;

// Flags forwarded to scripts/render.mjs. The set is intentionally narrow —
// queue-only flags (--list, --dry-run) are NOT forwarded; render-relevant
// flags ARE. Unknown flags get a warning so typos don't silently no-op.
const FORWARDED_FLAGS = new Set([
  "watermark", "watermark-text", "watermark-pos", "watermark-opacity",
  "watermark-font", "no-watermark",
  "lut", "strength", "no-grade", "replace",
  "no-progress",
]);
const QUEUE_OWN_FLAGS = new Set(["dry-run", "list"]);

const renderFlagArgs = [];
for (const [k, v] of Object.entries(flags)) {
  if (QUEUE_OWN_FLAGS.has(k)) continue;
  if (FORWARDED_FLAGS.has(k)) {
    renderFlagArgs.push(v === true ? `--${k}` : `--${k}=${v}`);
  } else {
    console.warn(`! unknown flag --${k} — not forwarded to render.mjs`);
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
  );
}

function listMp4sBefore() {
  if (!fs.existsSync(rendersDir)) return new Set();
  return new Set(
    fs.readdirSync(rendersDir)
      .filter((f) => f.endsWith(".mp4"))
      .map((f) => path.join(rendersDir, f))
  );
}

function newMp4sSince(before) {
  if (!fs.existsSync(rendersDir)) return [];
  const candidates = fs.readdirSync(rendersDir)
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => path.join(rendersDir, f))
    .filter((p) => !before.has(p));
  candidates.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  return candidates;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on("error", reject);
  });
}

function adjustDesignPaths(html) {
  // Composition files live in compositions/ and reference `../design/...`.
  // When promoted to root index.html, those need to become `design/...`.
  // Cover both href= and src= attributes, with single or double quotes.
  return html.replace(/(["'])\.\.\/design\//g, "$1design/");
}

function resolveInputs() {
  // 1. --list=path mode wins over positional args if explicitly given.
  if (listFile) {
    const listPath = path.resolve(projectRoot, listFile);
    if (!fs.existsSync(listPath)) {
      console.error(`✗ list file not found: ${listPath}`);
      process.exit(1);
    }
    const lines = fs.readFileSync(listPath, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    return expandGlobs(lines);
  }
  if (positional.length === 0) {
    console.error("✗ no compositions specified.");
    console.error("  Usage:");
    console.error("    npm run render:queue -- compositions/text-fx-demo.html");
    console.error("    npm run render:queue -- \"compositions/*.html\"");
    console.error("    npm run render:queue -- --list=todo.txt");
    process.exit(1);
  }
  return expandGlobs(positional);
}

function expandGlobs(patterns) {
  const out = [];
  const seen = new Set();
  for (const pat of patterns) {
    if (pat.includes("*") || pat.includes("?")) {
      // fs.globSync exists in Node 22+; we're on Node 24.
      const matches = fs.globSync(pat, { cwd: projectRoot });
      for (const m of matches) {
        const abs = path.resolve(projectRoot, m);
        if (!seen.has(abs)) {
          seen.add(abs);
          out.push(abs);
        }
      }
    } else {
      const abs = path.resolve(projectRoot, pat);
      if (!seen.has(abs)) {
        seen.add(abs);
        out.push(abs);
      }
    }
  }
  return out;
}

function bytesToMb(n) {
  return (n / (1024 * 1024)).toFixed(1);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const t0 = Date.now();
const queue = resolveInputs();

// Validate every entry exists & is HTML before we start mutating index.html.
const missing = queue.filter((p) => !fs.existsSync(p));
if (missing.length) {
  console.error("✗ comp files not found:");
  for (const m of missing) console.error("  -", path.relative(projectRoot, m));
  process.exit(1);
}
const nonHtml = queue.filter((p) => !p.toLowerCase().endsWith(".html"));
if (nonHtml.length) {
  console.error("✗ non-HTML entries in queue:");
  for (const m of nonHtml) console.error("  -", path.relative(projectRoot, m));
  process.exit(1);
}

// Sanity check: the user's current index.html is THE thing we're swapping.
// If they passed it as a queue item explicitly, that's fine, but warn so the
// behaviour (it's both backed up and rendered) isn't surprising.
const queueHasIndex = queue.some((p) => path.resolve(p) === indexPath);
if (queueHasIndex && queue.length === 1) {
  console.error("✗ queue contains only the current index.html — nothing to do.");
  console.error("  Specify other compositions, e.g. compositions/*.html.");
  process.exit(1);
}

console.log(`▶ render-queue: ${queue.length} composition${queue.length === 1 ? "" : "s"}`);
for (const p of queue) console.log("  -", path.relative(projectRoot, p));
if (dryRun) console.log("  (dry run — will skip render, print spawn args)");

// Back up the current index.html exactly once.
if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
const backupTs = timestamp();
const backupPath = path.join(archiveDir, `.queue-backup-${backupTs}.html`);
fs.copyFileSync(indexPath, backupPath);
console.log(`✓ backed up index.html → ${path.relative(projectRoot, backupPath)}`);

const results = [];

try {
  for (let i = 0; i < queue.length; i++) {
    const compPath = queue[i];
    const compRel = path.relative(projectRoot, compPath);
    const compStem = path.basename(compPath, path.extname(compPath));
    const ts = timestamp();
    const tag = `[${i + 1}/${queue.length}] ${compStem}`;
    const result = {
      comp: compRel,
      stem: compStem,
      status: "pending",
      reason: null,
      outputs: [],
      seconds: 0,
    };
    const tStart = Date.now();
    console.log("");
    console.log(`▶ ${tag}`);

    // 1. Copy comp → index.html with `../design/` → `design/` rewrite.
    try {
      const html = fs.readFileSync(compPath, "utf8");
      const adjusted = adjustDesignPaths(html);
      fs.writeFileSync(indexPath, adjusted);
      console.log(`  ✓ copied (${bytesToMb(adjusted.length)}MB) with design/ paths fixed`);
    } catch (err) {
      result.status = "failed";
      result.reason = `copy: ${err.message}`;
      result.seconds = ((Date.now() - tStart) / 1000).toFixed(1);
      results.push(result);
      console.error(`  ✗ copy failed: ${err.message}`);
      continue;
    }

    // 2. Lint + smoke (npm run check). On failure, skip render but keep going.
    try {
      console.log("  ▶ npm run check");
      await run("npm", ["run", "check"], { cwd: projectRoot });
      console.log("  ✓ check passed");
    } catch (err) {
      result.status = "skipped";
      result.reason = `check failed: ${err.message}`;
      result.seconds = ((Date.now() - tStart) / 1000).toFixed(1);
      results.push(result);
      console.error(`  ✗ check failed — skipping render for ${compStem}`);
      continue;
    }

    // 3. Render.
    const before = listMp4sBefore();
    const renderArgs = ["scripts/render.mjs", ...renderFlagArgs];
    const renderCmdLine = `node ${renderArgs.join(" ")}`;
    if (dryRun) {
      console.log(`  ⏭  --dry-run: would spawn \`${renderCmdLine}\` (cwd=${projectRoot}, shell=true)`);
      result.status = "dry-run-ok";
      result.reason = null;
      result.seconds = ((Date.now() - tStart) / 1000).toFixed(1);
      results.push(result);
      continue;
    }

    try {
      console.log(`  ▶ ${renderCmdLine}`);
      await run("node", renderArgs, { cwd: projectRoot });
    } catch (err) {
      result.status = "failed";
      result.reason = `render failed: ${err.message}`;
      result.seconds = ((Date.now() - tStart) / 1000).toFixed(1);
      results.push(result);
      console.error(`  ✗ render failed: ${err.message}`);
      continue;
    }

    // 4. Find the produced MP4(s) and rename to queue-<stem>-<ts>.mp4.
    const fresh = newMp4sSince(before);
    if (fresh.length === 0) {
      result.status = "failed";
      result.reason = "no new MP4 detected after render";
      result.seconds = ((Date.now() - tStart) / 1000).toFixed(1);
      results.push(result);
      console.error("  ✗ no new MP4 in renders/ — render may have failed silently");
      continue;
    }

    // Render produces a raw MP4 + optional -graded + optional -wm
    // (watermarked). Preserve those suffixes when renaming so the queue
    // output mirrors the per-comp set: queue-<stem>-<ts>.mp4 (raw),
    // -graded.mp4, -graded-wm.mp4, -wm.mp4 (watermarked-no-grade).
    for (const orig of fresh) {
      const origBase = path.basename(orig, ".mp4");
      // Match longest suffix first so -graded-wm doesn't lose its -graded.
      const suffix = ["-graded-wm", "-graded", "-wm"]
        .find((s) => origBase.endsWith(s)) || "";
      const dest = path.join(rendersDir, `queue-${compStem}-${ts}${suffix}.mp4`);
      fs.renameSync(orig, dest);
      result.outputs.push(path.relative(projectRoot, dest));
      console.log(`  ✓ ${path.relative(projectRoot, dest)}`);
    }

    result.status = "ok";
    result.seconds = ((Date.now() - tStart) / 1000).toFixed(1);
    results.push(result);
  }
} finally {
  // 5. Always restore the original index.html, even if we crashed mid-way.
  try {
    fs.copyFileSync(backupPath, indexPath);
    console.log("");
    console.log(`✓ restored index.html from ${path.relative(projectRoot, backupPath)}`);
  } catch (err) {
    console.error(`✗ FAILED to restore index.html from ${backupPath}: ${err.message}`);
    console.error("  Your original index.html is still in the backup file above.");
  }
}

// ---------------------------------------------------------------------------
// summary
// ---------------------------------------------------------------------------

const totalSecs = ((Date.now() - t0) / 1000).toFixed(1);
const ok = results.filter((r) => r.status === "ok");
const dry = results.filter((r) => r.status === "dry-run-ok");
const skipped = results.filter((r) => r.status === "skipped");
const failed = results.filter((r) => r.status === "failed");

console.log("");
console.log("─── render-queue summary ───────────────────────────────────");
console.log(`  total:   ${results.length} comp(s) in ${totalSecs}s`);
console.log(`  ok:      ${ok.length}`);
if (dry.length) console.log(`  dry:     ${dry.length}`);
console.log(`  skipped: ${skipped.length}`);
console.log(`  failed:  ${failed.length}`);
console.log("");
for (const r of results) {
  const icon = r.status === "ok" ? "✓"
             : r.status === "dry-run-ok" ? "▷"
             : r.status === "skipped" ? "⏭"
             : "✗";
  console.log(`  ${icon} ${r.comp} (${r.seconds}s)`);
  if (r.reason) console.log(`      ${r.reason}`);
  for (const out of r.outputs) console.log(`      → ${out}`);
}
console.log("");
console.log(`  backup: ${path.relative(projectRoot, backupPath)}`);

if (failed.length) process.exit(1);
