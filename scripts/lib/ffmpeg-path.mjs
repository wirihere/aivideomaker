// Resolve the path to an ffmpeg binary, preferring the npm-bundled
// @ffmpeg-installer/ffmpeg over the system PATH.
//
// Why bundled by default: the winget Windows install puts ffmpeg.exe at a
// path that isn't on the default bash PATH for new shells (LEARNINGS §2 / §4).
// Every fresh Claude Code session paid that "FFmpeg not found" tax once.
// Bundling moves the binary into node_modules so any `npm install` machine
// has it ready — no PATH munging, no winget pre-req.
//
// Resolution order:
//   1. process.env.FFMPEG  — explicit override always wins (CI / debugging).
//   2. @ffmpeg-installer/ffmpeg  — bundled, platform-detected by the package.
//   3. literal "ffmpeg"  — fall through to whatever's on the system PATH.
//
// Usage (in any .mjs script):
//   import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";
//   const ffmpeg = await getFfmpegPath();
//   spawn(ffmpeg, args, { cwd: projectRoot });
//
// Run this file directly to print the resolved path:
//   node scripts/lib/ffmpeg-path.mjs

import fs from "fs";
import { fileURLToPath } from "url";

let cached = null;

export async function getFfmpegPath() {
  if (cached) return cached;

  // 1. Explicit override.
  if (process.env.FFMPEG) {
    cached = process.env.FFMPEG;
    return cached;
  }

  // 2. Bundled binary via @ffmpeg-installer/ffmpeg.
  try {
    const mod = await import("@ffmpeg-installer/ffmpeg");
    // CommonJS module exports its object on `default` when imported from ESM.
    const pkg = mod.default ?? mod;
    if (pkg && pkg.path && fs.existsSync(pkg.path)) {
      cached = pkg.path;
      return cached;
    }
  } catch {
    // Package not installed or platform-specific binary missing — fall through.
  }

  // 3. System ffmpeg via PATH lookup.
  cached = "ffmpeg";
  return cached;
}

// CLI: print the resolved path when executed directly.
if (import.meta.url === `file://${process.argv[1]}` ||
    fileURLToPath(import.meta.url) === process.argv[1]) {
  const p = await getFfmpegPath();
  console.log(p);
}
