// Self-documenting help for `npm run <script>`.
//
// Reads package.json's scripts map, then for every entry that runs
// `node scripts/<file>.mjs` it opens the file and pulls its first
// non-shebang comment line as the description. Entries are grouped
// (build / new / preview / render / cache / fetch / lint / catalog /
// tts / verify / other) and printed as an aligned table.
//
// Usage:
//   npm run help            # grouped console table
//   npm run help -- --md    # paste-ready markdown table for QUICKSTART §10
//
// No deps beyond Node built-ins. Pure file reads — runs in <3s.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const pkgPath = path.join(projectRoot, "package.json");

const args = process.argv.slice(2);
const emitMarkdown = args.includes("--md");

const GROUP_ORDER = [
  "build",
  "new",
  "preview",
  "render",
  "renders",
  "video",
  "cache",
  "fetch",
  "lint",
  "catalog",
  "tts",
  "verify",
  "other",
];

function inferGroup(name) {
  if (name === "build:bundle" || name === "watch:bundle" || name.startsWith("build:")) return "build";
  if (name === "new" || name.startsWith("new:")) return "new";
  if (name === "preview" || name.startsWith("preview:") || name === "smoke" || name.startsWith("smoke:")) return "preview";
  if (name === "render" || name.startsWith("render:")) return "render";
  if (name === "renders" || name.startsWith("renders:")) return "renders";
  if (name === "video" || name.startsWith("video:")) return "video";
  if (name === "cache" || name.startsWith("cache:")) return "cache";
  if (name === "fetch" || name.startsWith("fetch:") || name.startsWith("fetch-") || name === "pull:assets" || name === "pick:music") return "fetch";
  if (name === "tts" || name.startsWith("tts:")) return "tts";
  if (name === "lint" || name.startsWith("lint:") || name === "check" || name === "fix" || name.startsWith("fix:")) return "lint";
  if (name === "catalog" || name.startsWith("catalog:") || name.startsWith("comp:")) return "catalog";
  if (name === "verify" || name.startsWith("verify:")) return "verify";
  return "other";
}

// Skip leading lines that are pure path labels (e.g., `scripts/foo.mjs`)
// — they're not real descriptions.
function looksLikePathLabel(s) {
  return /^[\w./-]+\.(mjs|js|ts|tsx)$/.test(s.trim());
}

// Pull the first useful comment line out of a JS file.
// Handles `//`, `#!/usr/bin/env node` shebangs (skip), and `/** ... */` blocks.
function readFirstCommentLine(absPath) {
  let content;
  try {
    content = fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (line === "" || line.startsWith("#!")) continue;
    if (line.startsWith("//")) {
      const text = line.replace(/^\/\/+\s?/, "").trim();
      if (!text) continue;
      if (looksLikePathLabel(text)) continue; // skip path-label and try next line
      return text;
    }
    if (line.startsWith("/**") || line.startsWith("/*")) {
      // Block comment — first non-empty inner line.
      const stripped = line.replace(/^\/\*+\s?/, "").replace(/\*+\/\s*$/, "").trim();
      if (stripped && !looksLikePathLabel(stripped)) return stripped;
      // Walk inner ` * Foo bar` lines.
      for (let j = i + 1; j < lines.length; j++) {
        const inner = lines[j].trim().replace(/^\*+\s?/, "").trim();
        if (inner === "" || inner.startsWith("/")) continue;
        if (looksLikePathLabel(inner)) continue;
        return inner;
      }
      return null;
    }
    // First real code — no leading comment.
    return null;
  }
  return null;
}

// Resolve a description for a single script's command string.
function describeScript(name, command) {
  // Meta-scripts that chain other npm scripts.
  if (/^npm run /.test(command)) {
    const chained = command.match(/npm run [\w:-]+/g) || [];
    const targets = chained.map((c) => c.replace(/^npm run /, "")).join(" + ");
    return `chains: ${targets}`;
  }
  // `npx hyperframes <sub>` — vendor CLI passthroughs.
  const npxMatch = command.match(/^npx hyperframes (\S+)/);
  if (npxMatch) return `hyperframes ${npxMatch[1]} (vendor CLI)`;
  // Echo / no-op test stub.
  if (/^echo /.test(command)) return "(stub)";
  // `node scripts/foo.mjs [...args]`
  const nodeMatch = command.match(/^node\s+(scripts\/\S+\.mjs)(?:\s+(.*))?$/);
  if (nodeMatch) {
    const rel = nodeMatch[1];
    const extra = nodeMatch[2] || "";
    const abs = path.join(projectRoot, rel);
    const desc = readFirstCommentLine(abs);
    if (desc && extra) return `${desc} (args: ${extra.trim()})`;
    if (desc) return desc;
    return "(no description)";
  }
  return command;
}

function loadScripts() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const out = [];
  for (const [name, command] of Object.entries(pkg.scripts || {})) {
    out.push({ name, command, group: inferGroup(name), description: describeScript(name, command) });
  }
  return out;
}

function groupedSorted(rows) {
  const byGroup = new Map();
  for (const r of rows) {
    if (!byGroup.has(r.group)) byGroup.set(r.group, []);
    byGroup.get(r.group).push(r);
  }
  for (const arr of byGroup.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
  // Order: known groups first, then any unknowns alphabetised.
  const ordered = [];
  for (const g of GROUP_ORDER) if (byGroup.has(g)) ordered.push([g, byGroup.get(g)]);
  for (const [g, arr] of [...byGroup.entries()].sort()) {
    if (!GROUP_ORDER.includes(g)) ordered.push([g, arr]);
  }
  return ordered;
}

function printConsole(rows) {
  const ordered = groupedSorted(rows);
  const nameWidth = Math.max(...rows.map((r) => r.name.length));
  console.log(`\n  ${rows.length} npm scripts in package.json — run with \`npm run <name>\`.\n`);
  for (const [group, arr] of ordered) {
    console.log(`  [${group}]`);
    for (const r of arr) {
      const padded = r.name.padEnd(nameWidth, " ");
      console.log(`    ${padded}  ${r.description}`);
    }
    console.log("");
  }
}

function printMarkdown(rows) {
  const ordered = groupedSorted(rows);
  const out = [];
  out.push("| Script | Group | Description |");
  out.push("| ------ | ----- | ----------- |");
  for (const [group, arr] of ordered) {
    for (const r of arr) {
      const desc = r.description.replace(/\|/g, "\\|");
      out.push(`| \`${r.name}\` | ${group} | ${desc} |`);
    }
  }
  console.log(out.join("\n"));
}

const rows = loadScripts();
if (emitMarkdown) printMarkdown(rows);
else printConsole(rows);
