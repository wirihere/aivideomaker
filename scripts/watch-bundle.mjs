// Watch design/modules/ + scripts/lib/ and rebuild the bundle on save.
// Removes the "did I run npm run build:bundle?" step.
//
// Usage:
//   node scripts/watch-bundle.mjs       # watch + rebuild on change
//   npm run watch:bundle                # via package.json
//
// Uses Node's built-in fs.watch (no chokidar dep). Debounced 200ms so a
// burst of saves triggers one rebuild.

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const watchDirs = [
  path.join(projectRoot, "design", "modules"),
  path.join(projectRoot, "scripts", "lib"),
];

let timer = null;
let pending = false;

function rebuild() {
  if (pending) return;
  pending = true;
  console.log("\n▶ rebuild bundle...");
  const child = spawn("node", [path.join(projectRoot, "scripts", "build-bundle.mjs")], {
    cwd: projectRoot, stdio: "inherit",
  });
  child.on("close", (code) => {
    pending = false;
    console.log(code === 0
      ? `  watching... (Ctrl+C to stop)`
      : `  ✗ rebuild failed (exit ${code})\n  watching...`);
  });
}

function trigger(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`  change: ${reason}`);
    rebuild();
  }, 200);
}

console.log(`▶ watch-bundle: ${watchDirs.map(d => path.relative(projectRoot, d)).join(", ")}`);

// Initial build so the bundle is fresh on startup.
rebuild();

for (const dir of watchDirs) {
  if (!fs.existsSync(dir)) continue;
  fs.watch(dir, { recursive: false }, (event, filename) => {
    if (!filename) return;
    // Skip the bundle outputs themselves (avoid loop).
    if (filename === "all.js" || filename === "all.css") return;
    if (!/\.(js|css)$/i.test(filename)) return;
    trigger(`${path.basename(dir)}/${filename}`);
  });
}
