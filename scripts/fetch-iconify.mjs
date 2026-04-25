// Fetch SVG icons from Iconify (https://iconify.design) — no API key needed.
//
// Iconify aggregates 200+ icon sets behind a single public API:
//   https://api.iconify.design/<set>/<name>.svg?<options>
//
// Common sets:
//   lucide, mdi, tabler, heroicons, ph (phosphor), bi (bootstrap),
//   fa6-solid, ic (material), carbon, octicon, simple-icons (brand logos)
//
// Usage:
//   node scripts/fetch-iconify.mjs lucide:home,lucide:search,mdi:rocket
//   node scripts/fetch-iconify.mjs lucide:home --color=4f46e5 --size=64
//   node scripts/fetch-iconify.mjs --preset=ui-essentials
//
// Output: assets/icons/<set>/<name>.svg

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outRoot = path.join(projectRoot, "assets", "icons");

// --- Curated presets ----------------------------------------------------------
const PRESETS = {
  "ui-essentials": [
    "lucide:home", "lucide:search", "lucide:menu", "lucide:x",
    "lucide:check", "lucide:chevron-right", "lucide:chevron-down",
    "lucide:settings", "lucide:user", "lucide:bell", "lucide:heart",
    "lucide:star", "lucide:share-2", "lucide:download", "lucide:upload",
    "lucide:trash-2", "lucide:edit-3", "lucide:plus", "lucide:minus",
    "lucide:arrow-right", "lucide:arrow-left", "lucide:arrow-up", "lucide:arrow-down",
  ],
  "social-brands": [
    "simple-icons:youtube", "simple-icons:instagram", "simple-icons:tiktok",
    "simple-icons:x", "simple-icons:facebook", "simple-icons:linkedin",
    "simple-icons:github", "simple-icons:discord", "simple-icons:slack",
    "simple-icons:reddit", "simple-icons:pinterest",
  ],
  "weather": [
    "lucide:sun", "lucide:cloud", "lucide:cloud-rain", "lucide:cloud-snow",
    "lucide:cloud-lightning", "lucide:wind", "lucide:droplets",
    "lucide:umbrella", "lucide:thermometer", "lucide:moon",
  ],
  "tech": [
    "lucide:cpu", "lucide:hard-drive", "lucide:wifi", "lucide:bluetooth",
    "lucide:database", "lucide:cloud", "lucide:server", "lucide:lock",
    "lucide:unlock", "lucide:key", "lucide:zap", "lucide:battery",
  ],
  "money": [
    "lucide:dollar-sign", "lucide:credit-card", "lucide:wallet",
    "lucide:banknote", "lucide:trending-up", "lucide:trending-down",
    "lucide:pie-chart", "lucide:bar-chart-3", "lucide:line-chart",
    "lucide:receipt", "lucide:shopping-cart", "lucide:package",
  ],
  "communication": [
    "lucide:mail", "lucide:message-circle", "lucide:message-square",
    "lucide:phone", "lucide:video", "lucide:mic", "lucide:headphones",
    "lucide:send", "lucide:at-sign", "lucide:hash",
  ],
  "media": [
    "lucide:play", "lucide:pause", "lucide:square", "lucide:skip-back",
    "lucide:skip-forward", "lucide:volume-2", "lucide:volume-x",
    "lucide:image", "lucide:film", "lucide:music", "lucide:camera",
  ],
};

// --- Args ---------------------------------------------------------------------
const args = process.argv.slice(2);
let icons = [];
const opts = { color: null, size: null };

for (const a of args) {
  if (a.startsWith("--preset=")) {
    const name = a.slice("--preset=".length);
    if (!PRESETS[name]) {
      console.error(`Unknown preset: ${name}. Available: ${Object.keys(PRESETS).join(", ")}`);
      process.exit(1);
    }
    icons.push(...PRESETS[name]);
  } else if (a.startsWith("--color=")) {
    opts.color = a.slice("--color=".length).replace(/^#/, "");
  } else if (a.startsWith("--size=")) {
    opts.size = a.slice("--size=".length);
  } else if (!a.startsWith("--")) {
    icons.push(...a.split(","));
  }
}

if (icons.length === 0) {
  console.log(`Usage:
  node scripts/fetch-iconify.mjs <set:name>[,<set:name>,...] [--color=4f46e5] [--size=64]
  node scripts/fetch-iconify.mjs --preset=<name>

Available presets: ${Object.keys(PRESETS).join(", ")}

Examples:
  node scripts/fetch-iconify.mjs lucide:home
  node scripts/fetch-iconify.mjs lucide:home,mdi:rocket --color=4f46e5
  node scripts/fetch-iconify.mjs --preset=ui-essentials --color=0f172a`);
  process.exit(0);
}

// --- Fetch --------------------------------------------------------------------
fs.mkdirSync(outRoot, { recursive: true });

let ok = 0;
let fail = 0;

for (const ref of icons) {
  const [set, name] = ref.split(":");
  if (!set || !name) {
    console.warn(`[skip] malformed: ${ref} (expected set:name)`);
    fail++;
    continue;
  }

  const params = new URLSearchParams();
  if (opts.color) params.set("color", "%23" + opts.color);
  if (opts.size) params.set("height", opts.size);
  const qs = params.toString();
  // Iconify expects %23 literally for color, so build URL by hand
  const colorPart = opts.color ? `color=%23${opts.color}` : "";
  const sizePart = opts.size ? `height=${opts.size}` : "";
  const query = [colorPart, sizePart].filter(Boolean).join("&");
  const url = `https://api.iconify.design/${set}/${name}.svg${query ? `?${query}` : ""}`;

  const setDir = path.join(outRoot, set);
  fs.mkdirSync(setDir, { recursive: true });
  const outPath = path.join(setDir, `${name}.svg`);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("<svg")) throw new Error(`not an SVG`);
    fs.writeFileSync(outPath, text, "utf8");
    console.log(`[ok]   ${ref}  →  ${path.relative(projectRoot, outPath)}`);
    ok++;
  } catch (err) {
    console.error(`[fail] ${ref}  (${err.message})`);
    fail++;
  }
}

console.log(`\nFetched ${ok}/${ok + fail} icons.`);
process.exitCode = fail > 0 ? 1 : 0;
