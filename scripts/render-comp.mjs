// Render a composition by path — without the fragile manual cp / git-checkout dance.
//
// The render pipeline (scripts/render.mjs) renders whatever sits at root
// index.html. The normal hand-flow is: `cp videos/<brand>/compositions/X.html
// index.html`, render, then `git checkout -- index.html`. That caused a real
// incident (LEARNINGS / binsparkle README trap #7: a mid-session backup
// restore overwrote ANOTHER brand's composition). This wrapper does the swap
// safely so you never have to touch index.html by hand.
//
// What it does:
//   1. Derives the brand slug from the composition path (videos/<slug>/...).
//   2. Backs up root index.html IN MEMORY + a PID-keyed .bak file (no collision
//      with other sessions; restore never reads a stale shared .bak).
//   3. Copies the target composition over index.html.
//   4. Runs `node scripts/render.mjs --slug=<slug> <forwarded args>` (render.mjs
//      itself is untouched).
//   5. Moves the new outputs from renders/ root into renders/<slug>/, renamed
//      from `aivideomaker_<ts>` to `<slug>_<ts>` (per STRUCTURE.md — outputs go
//      to renders/<brand>/).
//   6. Restores index.html from the in-memory copy (finally). The .bak is only
//      a fallback if the process dies before reaching the finally.
//
// Usage:
//   node scripts/render-comp.mjs --comp=<path> [render.mjs args] [-- hyperframes args]
//
// Examples:
//   node scripts/render-comp.mjs --comp=videos/binsparkle/compositions/binsparkle-customer.html
//   node scripts/render-comp.mjs --comp=videos/binsparkle/compositions/binsparkle-customer.html --lut=warm
//   node scripts/render-comp.mjs --comp=videos/binsparkle/compositions/binsparkle-customer.html -- --gpu -w 2
//   npm run render:comp -- --comp=videos/binsparkle/compositions/binsparkle-customer.html
//   npm run render:comp -- --comp=videos/.../customer.html --judge   # + auto-critique the output
//
// Output folder: renders/<brand>/<concept>/ by default (concept derived from the
// comp filename, e.g. binsparkle-wanted-video.html → renders/binsparkle/wanted/).
// Override with --out=<dir>. A concept's stills (render-still) + video land together.
//
// --judge (opt-in): after the render lands, auto-runs judge-video.mjs on the
// newest output. Cost-guarded by the daily cap (RUNWARE_DAILY_CAP, default $2).
//
// render.mjs stays 100% untouched — `npm run render` (no --comp) behaves identically.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- parse --comp out of argv; pass everything else through to render.mjs --

const argv = process.argv.slice(2);
const compIdx = argv.findIndex(a => a.startsWith("--comp="));
if (compIdx < 0) {
  console.error(`render-comp — render a composition by path (no manual index.html swap)

Usage:
  node scripts/render-comp.mjs --comp=<path> [render.mjs args] [-- hyperframes args]

Example:
  node scripts/render-comp.mjs --comp=videos/binsparkle/compositions/binsparkle-customer.html`);
  process.exit(2);
}
const compPath = argv[compIdx].slice("--comp=".length);
// Parse optional --out=<dir> to override the per-concept output folder. Stripped
// from the args forwarded to render.mjs (render.mjs doesn't understand --out).
const outIdx = argv.findIndex(a => a.startsWith("--out="));
const outOverride = outIdx >= 0 ? argv[outIdx].slice("--out=".length) : null;
const dropIdx = new Set([compIdx, outIdx]);
const renderArgs = argv.filter((_, i) => !dropIdx.has(i)); // keep "--" + passthrough verbatim

const compAbs = path.resolve(projectRoot, compPath);
const compRel = path.relative(projectRoot, compAbs).replace(/\\/g, "/");
if (!compRel.startsWith("videos/") || !fs.existsSync(compAbs) || !compAbs.endsWith(".html")) {
  console.error("✗ --comp must be an existing .html composition under videos/<brand>/");
  process.exit(2);
}
const slugMatch = compRel.match(/^videos\/([^/]+)\//);
const slug = slugMatch ? slugMatch[1] : "aivideomaker";
// Per-concept output folder by default: renders/<brand>/<concept>/ — so a
// concept's video + stills (render-still) land together. Concept is derived
// from the comp filename by stripping "<slug>-" and "-video".
const compBase = path.basename(compRel, ".html");
const concept = compBase.replace(new RegExp(`^${slug}-`), "").replace(/-video$/, "") || compBase;

const indexPath = path.join(projectRoot, "index.html");
const bakPath = path.join(projectRoot, `.index.html.bak.${process.pid}`);
const rendersDir = path.join(projectRoot, "renders");

// Snapshot files at renders/ *root* (not recursive) so we can move only the
// files this render produced.
function snapshotRendersRoot() {
  if (!fs.existsSync(rendersDir)) return new Set();
  return new Set(fs.readdirSync(rendersDir).filter(f => {
    try { return fs.statSync(path.join(rendersDir, f)).isFile(); } catch { return false; }
  }));
}
const beforeFiles = snapshotRendersRoot();

let originalIndex = null;
try {
  // Backup index.html (in-memory primary; PID-keyed .bak fallback for orphans).
  if (fs.existsSync(indexPath)) {
    originalIndex = fs.readFileSync(indexPath);
    fs.copyFileSync(indexPath, bakPath);
  }
  // Promote the composition to the render entry point.
  fs.copyFileSync(compAbs, indexPath);
  console.log(`▶ render-comp: ${compRel}  (slug=${slug})`);

  // Run render.mjs with --slug=<slug> + forwarded args. process.execPath is
  // the absolute node binary — no shell, no .cmd shim (matches render.mjs style).
  const child = spawn(process.execPath, ["scripts/render.mjs", `--slug=${slug}`, ...renderArgs], {
    cwd: projectRoot,
    stdio: "inherit",
  });
  const code = await new Promise((res) => {
    child.on("close", res);
    child.on("error", (e) => { console.error("✗ spawn error:", e.message); res(1); });
  });
  if (code !== 0) throw new Error(`render.mjs exited ${code}`);

  // Namespace the new outputs into renders/<slug>/<concept>/ with the brand name.
  const slugDir = outOverride ? path.resolve(projectRoot, outOverride) : path.join(rendersDir, slug, concept);
  fs.mkdirSync(slugDir, { recursive: true });
  const afterFiles = snapshotRendersRoot();
  let moved = 0;
  for (const f of afterFiles) {
    if (beforeFiles.has(f)) continue;
    const src = path.join(rendersDir, f);
    const newName = f.startsWith("aivideomaker_") ? f.replace(/^aivideomaker_/, `${slug}_`) : f;
    fs.renameSync(src, path.join(slugDir, newName));
    console.log(`✓ ${path.relative(projectRoot, path.join(slugDir, newName))}`);
    moved++;
  }
  if (moved === 0) console.log("⚠ no new render files detected to move (render may have used --replace or failed silently)");
  // --judge: after a successful render, auto-critique the newest output via
  // judge-video (cost-guarded by the daily cap in lib/runware-vision.mjs).
  if (argv.includes("--judge")) {
    const mps = fs.readdirSync(slugDir).filter(f => f.endsWith(".mp4"))
      .map(f => ({ f, t: fs.statSync(path.join(slugDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    if (mps.length) {
      const newest = path.join(slugDir, mps[0].f);
      console.log(`▶ --judge: critiquing ${path.relative(projectRoot, newest)}`);
      const j = spawn(process.execPath, ["scripts/judge-video.mjs", `--video=${newest}`], { cwd: projectRoot, stdio: "inherit" });
      await new Promise(r => j.on("close", r));
    } else {
      console.log("⚠ --judge: no .mp4 found in output to critique");
    }
  }
  console.log("✓ render-comp done");
} catch (err) {
  console.error("✗", err.message);
  process.exitCode = 1;
} finally {
  // Restore index.html from the in-memory copy. The PID .bak is only a
  // fallback if the process was killed before reaching here.
  try {
    if (originalIndex !== null) fs.writeFileSync(indexPath, originalIndex);
    if (fs.existsSync(bakPath)) fs.unlinkSync(bakPath);
  } catch (e) {
    console.error(`⚠ could not restore index.html from memory. Manual fallback: .bak at ${path.relative(projectRoot, bakPath)}`);
  }
}
