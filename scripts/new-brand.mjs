// scripts/new-brand.mjs — scaffold a new per-brand video project folder.
//
// Copies videos/_template/ to videos/<brand-slug>/ and substitutes <BRAND> /
// <brand-slug> placeholders. The result is the canonical per-brand layout
// from STRUCTURE.md, ready for Stage 1 (capture) of the founding doc.
//
// Usage:
//   node scripts/new-brand.mjs <slug> [<display-name>] [<url>]
//
// Examples:
//   node scripts/new-brand.mjs jobfinder
//   node scripts/new-brand.mjs jobfinder "JobFinder NZ" "https://jobfinder.nz"

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const [, , slug, ...rest] = process.argv;

if (!slug) {
  console.error("Usage: node scripts/new-brand.mjs <slug> [<display-name>] [<url>]");
  process.exit(1);
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`✗ Invalid slug "${slug}" — must be lowercase letters / digits / hyphens, starting with a letter or digit.`);
  process.exit(1);
}

const templateDir = path.join(projectRoot, "videos/_template");
const targetDir = path.join(projectRoot, "videos", slug);

if (!fs.existsSync(templateDir)) {
  console.error(`✗ Template not found at ${templateDir}`);
  process.exit(1);
}

if (fs.existsSync(targetDir)) {
  console.error(`✗ videos/${slug}/ already exists. Refusing to overwrite.`);
  process.exit(1);
}

// Display name + URL (fall back to sensible defaults)
const displayName = rest[0] && !rest[0].startsWith("http") ? rest[0] : slug;
const url = rest.find(a => a.startsWith("http")) || `https://${slug}.nz`;

// Recursive copy
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(templateDir, targetDir);

// Substitute placeholders in markdown + css files
function substitute(p) {
  let text = fs.readFileSync(p, "utf8");
  text = text
    .replaceAll("<BRAND>", displayName)
    .replaceAll("<brand-slug>", slug)
    .replaceAll("<url>", url);
  fs.writeFileSync(p, text);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(md|css|html|txt)$/i.test(entry.name)) substitute(p);
  }
}

walk(targetDir);

// Create per-brand renders/<slug>/ as well
const rendersDir = path.join(projectRoot, "renders", slug);
if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });

console.log(`✓ Scaffolded videos/${slug}/`);
console.log(`  - DESIGN.md, SCRIPT.md, STORYBOARD.md, README.md (placeholders filled with: ${displayName} / ${url})`);
console.log(`  - tokens.css (defaults — replace with brand palette after Stage 1)`);
console.log(`  - capture/, compositions/, voiceover/, assets/ (empty subfolders)`);
console.log(`✓ Created renders/${slug}/`);
console.log(``);
console.log(`Next: run Stage 1 (capture).`);
console.log(`  npx hyperframes capture ${url} -o videos/${slug}/capture`);
