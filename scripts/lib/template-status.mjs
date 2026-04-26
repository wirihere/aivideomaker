// template-status.mjs — read docs/template-models.md to determine the
// production-readiness status of a registered template.
//
// Statuses (per docs/template-models.md):
//   locked-vN   — user-approved at this tag. Render allowed. Gates run as guards.
//   iterating   — actively in build/fix loop. Render blocked unless --allow-watch.
//   legacy      — built before the gated process. Render blocked unless --use-legacy.
//   unlisted    — template in TEMPLATE_REGISTRY but not in the table → treat as iterating.
//
// The status registry lives in docs/template-models.md as a markdown pipe-table.
// First column is the template file basename without `.html` (e.g.
// `community-app-tour-30s`); second column is the status.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const MODELS_PATH = path.join(projectRoot, "docs", "template-models.md");

const STATUS_KINDS = new Set(["locked", "iterating", "legacy"]);

// Returns Map<templateName, { status, tag, lockedDate, brands }>.
// templateName matches the template's file basename without .html.
export function readTemplateStatuses() {
  const out = new Map();
  if (!fs.existsSync(MODELS_PATH)) return out;
  const md = fs.readFileSync(MODELS_PATH, "utf8");
  // Find the first markdown table whose header row contains `template` and `status`.
  const lines = md.split(/\r?\n/);
  let inTable = false;
  let columnsAvailable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!inTable) {
      if (!/^\|/.test(trimmed)) continue;
      const headerCells = trimmed.split("|").map(c => c.trim()).filter(Boolean);
      if (headerCells.length < 2) continue;
      const lc = headerCells.map(c => c.toLowerCase());
      if (lc.includes("template") && lc.includes("status")) {
        inTable = true;
        columnsAvailable = true;
      }
      continue;
    }
    // Inside the table — skip the separator row (---|---|...).
    if (/^\|[\s|:\-]+$/.test(trimmed)) continue;
    if (!/^\|/.test(trimmed)) {
      // Table ended.
      if (columnsAvailable) break;
      continue;
    }
    const cells = trimmed.split("|").map(c => c.trim());
    // Pipe-tables produce empty leading/trailing cells — strip.
    const filtered = cells[0] === "" ? cells.slice(1) : cells;
    const compacted = filtered[filtered.length - 1] === ""
      ? filtered.slice(0, -1)
      : filtered;
    if (compacted.length < 2) continue;
    const [templateRaw, statusRaw, tagRaw, lockedDateRaw, brandsRaw] = compacted;
    const template = (templateRaw || "").trim();
    const status = (statusRaw || "").trim();
    if (!template || template === "—" || template === "---") continue;
    out.set(template, {
      template,
      status,
      tag: (tagRaw || "—").trim(),
      lockedDate: (lockedDateRaw || "—").trim(),
      brands: (brandsRaw || "—").trim(),
    });
  }
  return out;
}

// Convenience: get status for a single template name (registry key, e.g.
// "community-app-tour"), or its file basename ("community-app-tour-30s").
// Returns the status string or "unlisted" if not found.
export function statusFor(templateNameOrBasename) {
  const map = readTemplateStatuses();
  // Try exact match on file basename.
  if (map.has(templateNameOrBasename)) return map.get(templateNameOrBasename).status;
  // Try with -30s / -45s / -60s / -20s / -15s suffixes appended.
  for (const suffix of ["-30s", "-45s", "-60s", "-20s", "-15s"]) {
    const try1 = `${templateNameOrBasename}${suffix}`;
    if (map.has(try1)) return map.get(try1).status;
  }
  return "unlisted";
}

// Classify a status string. Returns one of:
//   "locked"     (any "locked-*" status — render allowed)
//   "iterating"  (treat as iterating — block unless --allow-watch)
//   "legacy"     (block unless --use-legacy)
//   "unlisted"   (block unless --allow-watch — treat as iterating)
export function classifyStatus(status) {
  if (!status) return "unlisted";
  if (status.startsWith("locked-")) return "locked";
  if (status === "iterating") return "iterating";
  if (status === "legacy") return "legacy";
  if (status === "unlisted") return "unlisted";
  // Unknown status string — be conservative.
  return "iterating";
}

// CLI entry — print the status registry as a small table.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const map = readTemplateStatuses();
  if (map.size === 0) {
    console.log("(no template statuses found in docs/template-models.md)");
    process.exit(0);
  }
  const rows = [...map.values()];
  const w = (k) => Math.max(k.length, ...rows.map(r => String(r[k] ?? "").length));
  const cols = [
    { key: "template", width: w("template") },
    { key: "status", width: w("status") },
    { key: "tag", width: w("tag") },
    { key: "lockedDate", width: w("lockedDate") },
    { key: "brands", width: Math.min(40, w("brands")) },
  ];
  const fmt = (r) => cols.map(c => String(r[c.key] ?? "").padEnd(c.width)).join("  ");
  console.log(fmt({ template: "TEMPLATE", status: "STATUS", tag: "TAG", lockedDate: "LOCKED", brands: "BRANDS" }));
  console.log(cols.map(c => "-".repeat(c.width)).join("  "));
  for (const r of rows) console.log(fmt(r));
}
