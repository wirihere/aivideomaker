#!/usr/bin/env node
// Pre-commit guard — re-run build:bundle when any composition template,
// vertical, or design module is staged for commit. Without this, multi-agent
// edits drift from `design/compose-head.html` and `npm run check:heads` fails
// until someone manually runs `npm run build:bundle`.
//
// Usage:
//   node scripts/pre-commit-build.mjs            # run as the actual hook
//   node scripts/pre-commit-build.mjs --install  # install into .git/hooks/pre-commit
//   node scripts/pre-commit-build.mjs --check    # exit 1 if hook isn't installed
//
// Behaviour as the hook:
//   1. Read `git diff --cached --name-only` to find staged files.
//   2. If any staged file matches the trigger globs below, run
//      `node scripts/build-bundle.mjs`.
//   3. Re-stage the regenerated files (`design/modules/all.{css,js}` and any
//      hydrated `compositions/templates/*.html` + `compositions/verticals/*.html`).
//   4. Exit 0 on success — the commit proceeds with the rebuilt bundle.
//   5. Exit 1 if rebuild fails, blocking the commit so the user fixes it.
//
// Trigger globs (any one matched in the staged set is enough):
//   - design/modules/text-fx.{css,js}
//   - design/modules/effect-fx.{css,js}
//   - design/modules/glitter-fx.{css,js}
//   - design/modules/combo-fx.{css,js}
//   - scripts/lib/amp-bind.js          (bundled into all.js)
//   - design/compose-head.html         (HEAD-INCLUDE source)
//   - compositions/templates/*.html    (HEAD-INCLUDE consumers)
//   - compositions/verticals/*.html    (HEAD-INCLUDE consumers)
//   - design/effects-batch-*.css       (template-referenced shared resource)
//
// Why a single file: per the bug brief, this is the simplest delivery — no
// husky dependency, no .githooks/ scaffolding. `--install` writes the hook
// into .git/hooks/pre-commit (a single shim that re-invokes this script).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const TRIGGER_PATTERNS = [
  /^design\/modules\/(text-fx|effect-fx|glitter-fx|combo-fx)\.(css|js)$/,
  /^scripts\/lib\/amp-bind\.js$/,
  /^design\/compose-head\.html$/,
  /^compositions\/templates\/.*\.html$/,
  /^compositions\/verticals\/.*\.html$/,
  /^design\/effects-batch-\d+\.css$/,
];

function shouldRebuild(stagedFiles) {
  return stagedFiles.some((f) =>
    TRIGGER_PATTERNS.some((re) => re.test(f.replace(/\\/g, "/"))),
  );
}

function getStagedFiles() {
  const out = spawnSync("git", ["diff", "--cached", "--name-only"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (out.status !== 0) {
    process.stderr.write(`[pre-commit-build] git diff failed: ${out.stderr}\n`);
    return [];
  }
  return out.stdout.split(/\r?\n/).filter(Boolean);
}

function runBuildBundle() {
  const result = spawnSync(
    process.execPath,
    [path.join(projectRoot, "scripts", "build-bundle.mjs")],
    { cwd: projectRoot, stdio: "inherit" },
  );
  return result.status === 0;
}

function restageRegenerated() {
  // Re-stage outputs that build-bundle may have rewritten. Use --update so
  // we only restage paths that already had staged or unstaged changes — we
  // don't pull in anything new the user didn't intend.
  const candidates = [
    "design/modules/all.css",
    "design/modules/all.js",
  ];
  // Also restage any hydrated template/vertical that the rebuild touched.
  // `git add --update` does this for us: it picks up modifications to files
  // that were already tracked but not necessarily staged.
  const adds = spawnSync(
    "git",
    ["add", "--update", ...candidates, "compositions/templates", "compositions/verticals"],
    { cwd: projectRoot, stdio: "inherit" },
  );
  return adds.status === 0;
}

function asHook() {
  const staged = getStagedFiles();
  if (staged.length === 0) {
    return 0;
  }
  if (!shouldRebuild(staged)) {
    return 0;
  }
  process.stderr.write("[pre-commit-build] template/design change detected — running build:bundle...\n");
  if (!runBuildBundle()) {
    process.stderr.write("[pre-commit-build] build:bundle failed — commit blocked.\n");
    return 1;
  }
  if (!restageRegenerated()) {
    process.stderr.write("[pre-commit-build] failed to re-stage regenerated files — commit blocked.\n");
    return 1;
  }
  process.stderr.write("[pre-commit-build] bundle rebuilt and re-staged.\n");
  return 0;
}

function installHook() {
  const hooksDir = path.join(projectRoot, ".git", "hooks");
  if (!fs.existsSync(hooksDir)) {
    process.stderr.write(`[pre-commit-build] .git/hooks not found — is this a git repo?\n`);
    return 1;
  }
  const hookPath = path.join(hooksDir, "pre-commit");
  // POSIX shim that re-invokes this script via node. Works on Windows with
  // Git Bash / Git for Windows because `.git/hooks/pre-commit` is run via the
  // bundled bash interpreter.
  // The hook is invoked by `git commit` with cwd = the repo root. We resolve
  // the script path relative to the hook file itself (one dir → repo root,
  // then into scripts/) so the path stays correct even if git ever changes
  // cwd semantics.
  const shim = `#!/bin/sh
# Auto-installed by scripts/pre-commit-build.mjs --install
# Re-runs design bundle when templates/modules are staged. See:
#   scripts/pre-commit-build.mjs
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HOOK_DIR/../.." && pwd)"
exec node "$REPO_ROOT/scripts/pre-commit-build.mjs"
`;
  fs.writeFileSync(hookPath, shim, { mode: 0o755 });
  // chmod again for safety on POSIX (Windows ignores).
  try { fs.chmodSync(hookPath, 0o755); } catch {}
  process.stdout.write(`[pre-commit-build] installed hook at ${path.relative(projectRoot, hookPath)}\n`);
  return 0;
}

function checkInstalled() {
  const hookPath = path.join(projectRoot, ".git", "hooks", "pre-commit");
  if (!fs.existsSync(hookPath)) {
    process.stderr.write(`[pre-commit-build] hook NOT installed. Run: node scripts/pre-commit-build.mjs --install\n`);
    return 1;
  }
  const body = fs.readFileSync(hookPath, "utf8");
  if (!/pre-commit-build\.mjs/.test(body)) {
    process.stderr.write(`[pre-commit-build] .git/hooks/pre-commit exists but does not invoke pre-commit-build.mjs — overwrite with --install if intended.\n`);
    return 1;
  }
  process.stdout.write(`[pre-commit-build] hook installed and current.\n`);
  return 0;
}

const arg = process.argv[2];
if (arg === "--install") {
  process.exit(installHook());
} else if (arg === "--check") {
  process.exit(checkInstalled());
} else {
  process.exit(asHook());
}
