// Platform-safe child_process spawning without DEP0190 or .cmd-shim hazards.
//
// Background:
//   Node 22 emits DEP0190 — "Passing args to a child process with shell option
//   true can lead to security vulnerabilities" — whenever spawn() is called
//   with both an `args` array and `shell: true`.
//
//   Historically we used `shell: true` on Windows because Node's PATH lookup
//   only finds `.cmd` shims (`npx.cmd`, `npm.cmd`) when a shell expands the
//   extension. Naming the `.cmd` file directly *also* doesn't work: since
//   CVE-2024-27980 (Node 18.20.2 / 20.12.2 / 22+), `child_process.spawn` of a
//   `.cmd` or `.bat` file without `shell: true` errors with EINVAL.
//
//   So `shell: true` warns, and `npx.cmd` direct fails. The escape: spawn
//   the actual JS entry of each CLI through Node itself (no shell, no
//   batch file), using `process.execPath` for the node binary.
//
// What this module exports:
//   - `node` (string): absolute path to the running Node binary.
//   - `npmCliJs` (string): absolute path to the `npm-cli.js` shipped alongside
//     this Node — used by `npmArgs(...)` to build the argv for `npm run X`.
//   - `npmArgs(scriptName, extraArgs)` (string[]): full argv to pass after
//     `node` so it runs `npm run <scriptName> -- <extraArgs>`.
//   - `npxRunArgs(localBin, extraArgs)` (string[]): full argv that, when
//     spawned with `node`, runs `<localBin>` from `node_modules/.bin`. We
//     resolve the package's `bin` field so we never depend on PATH or `.cmd`.
//     `localBin` is the package's bin name (e.g. `"hyperframes"`); the package
//     must be installed locally (we look up `package.json` via require.resolve).
//
// Why a resolver instead of simply `npx`:
//   `npx` is a `.cmd` on Windows. Even when called via Node, `npx` would still
//   fork another node, slowing every spawn. By resolving the package's `bin`
//   entry (`node_modules/<pkg>/<bin-script>`) and running it via `node` we
//   skip the `.cmd` entirely and save a process.
//
// Limitations:
//   - `npxRunArgs` only resolves locally-installed packages (the common case
//     in this repo). If a script ever needs a global package, fall back to
//     spawning with `shell: true` and a single command-string argv (no `args`
//     array) — that doesn't trip DEP0190.

import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export const isWin = process.platform === "win32";
export const node = process.execPath;

// `npm-cli.js` ships next to the Node binary in every official Node install
// (Windows: `C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`;
// POSIX: `<prefix>/lib/node_modules/npm/bin/npm-cli.js`). Compute once.
export const npmCliJs = (() => {
  const nodeDir = path.dirname(process.execPath);
  // Two layouts in the wild — Windows MSI and Unix prefix-style. Probe both.
  const candidates = [
    path.join(nodeDir, "node_modules", "npm", "bin", "npm-cli.js"),
    path.join(nodeDir, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
  ];
  for (const c of candidates) {
    try {
      // fs.existsSync is fine here — startup-only, single check.
      // eslint-disable-next-line no-restricted-syntax
      if (require("fs").existsSync(c)) return c;
    } catch {}
  }
  // Last resort: let the caller see undefined and decide what to do.
  return null;
})();

// Build argv for `node <npm-cli.js> run <scriptName> [-- ...extraArgs]`.
// Keeps the npm-cli.js path centralised so callers don't have to recompute it.
export function npmArgs(scriptName, extraArgs = []) {
  if (!npmCliJs) {
    throw new Error(
      "platform-bin: could not locate npm-cli.js next to process.execPath. " +
      "Ensure Node was installed with bundled npm."
    );
  }
  const args = [npmCliJs, "run", scriptName];
  if (extraArgs && extraArgs.length) args.push("--", ...extraArgs);
  return args;
}

// Resolve a locally-installed package's executable JS entry, then build the
// argv to run it via `node`. Avoids the `.cmd` shim and any shell at all.
//
// Example: npxRunArgs("hyperframes", ["render", ...passThrough])
//   → [".../node_modules/hyperframes/dist/cli.js", "render", ...]
export function npxRunArgs(packageName, extraArgs = []) {
  const pkgPath = require.resolve(`${packageName}/package.json`);
  const pkgDir = path.dirname(pkgPath);
  const pkg = require(pkgPath);
  let binPath;
  if (typeof pkg.bin === "string") {
    binPath = path.join(pkgDir, pkg.bin);
  } else if (pkg.bin && typeof pkg.bin === "object") {
    // Prefer a bin entry matching the package name; otherwise take the first.
    const binRel = pkg.bin[packageName] || Object.values(pkg.bin)[0];
    if (!binRel) {
      throw new Error(`platform-bin: package "${packageName}" has no bin entry`);
    }
    binPath = path.join(pkgDir, binRel);
  } else {
    throw new Error(`platform-bin: package "${packageName}" has no bin field`);
  }
  return [binPath, ...extraArgs];
}
