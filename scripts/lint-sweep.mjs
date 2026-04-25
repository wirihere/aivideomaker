#!/usr/bin/env node
/**
 * Composition lint sweep — treats every composition under compositions/**\/*.html
 * as the project root in turn, captures the lint result, and writes a summary
 * report to docs/lint-report.md.
 *
 * Strategy:
 *   1. Backup current index.html → .lint-backup.html
 *   2. For each composition:
 *        a. Copy comp into index.html (rewriting ../../design/ and ../design/ → design/)
 *        b. If body references tokens-PLACEHOLDER.css, rewrite to tokens-kindred.css
 *        c. Run `npx hyperframes lint --verbose --json` and capture findings
 *   3. ALWAYS restore index.html from backup (try/finally)
 *   4. Write docs/lint-report.md
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const INDEX = path.join(ROOT, "index.html");
// IMPORTANT: keep the backup OUTSIDE the project root so the linter doesn't
// pick it up as a duplicate root composition (rule: multiple_root_compositions).
const BACKUP = path.join(os.tmpdir(), `aivideomaker-lint-backup-${process.pid}.html`);
const COMPS_DIR = path.join(ROOT, "compositions");
const REPORT = path.join(ROOT, "docs", "lint-report.md");

function findCompositions(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findCompositions(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function rewriteForRoot(html) {
  // Rewrite design imports so the file works as a project root.
  return html
    .replace(/\.\.\/\.\.\/design\//g, "design/")
    .replace(/\.\.\/design\//g, "design/")
    .replace(/tokens-PLACEHOLDER\.css/g, "tokens-kindred.css");
}

function runLint() {
  // --json gives us a structured payload. Run with cwd=ROOT.
  // hyperframes lint exits non-zero if there are errors; we want to capture either way.
  let stdout = "";
  let stderr = "";
  let exitCode = 0;
  try {
    stdout = execSync("npx hyperframes lint --verbose --json", {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (err) {
    stdout = err.stdout?.toString() ?? "";
    stderr = err.stderr?.toString() ?? "";
    exitCode = err.status ?? 1;
  }

  // Parse JSON; if it can't parse, treat as a hard failure for that comp.
  let payload = null;
  try {
    // The output may have trailing whitespace or warnings; find the first { or [.
    const trimmed = stdout.trim();
    payload = trimmed ? JSON.parse(trimmed) : null;
  } catch (e) {
    return {
      ok: false,
      exitCode,
      parseError: e.message,
      raw: stdout.slice(0, 4000),
      stderr: stderr.slice(0, 2000),
      findings: [],
    };
  }

  // Normalise: payload may be { findings: [...] } or an array
  let findings = [];
  if (Array.isArray(payload)) findings = payload;
  else if (payload && Array.isArray(payload.findings)) findings = payload.findings;
  else if (payload && Array.isArray(payload.issues)) findings = payload.issues;
  else if (payload && Array.isArray(payload.results)) findings = payload.results;

  return { ok: true, exitCode, findings, raw: stdout.slice(0, 0) };
}

function bucketFindings(findings) {
  const errors = [];
  const warnings = [];
  const infos = [];
  for (const f of findings) {
    const sev = (f.severity || f.level || f.type || "").toLowerCase();
    if (sev === "error" || sev === "err") errors.push(f);
    else if (sev === "warning" || sev === "warn") warnings.push(f);
    else infos.push(f);
  }
  return { errors, warnings, infos };
}

function describeFinding(f) {
  const msg = f.message || f.msg || f.title || JSON.stringify(f).slice(0, 160);
  const loc = f.file || f.path || f.location || "";
  const rule = f.rule || f.code || "";
  return [rule && `[${rule}]`, msg, loc && `(${loc})`].filter(Boolean).join(" ");
}

async function main() {
  if (!fs.existsSync(INDEX)) throw new Error("index.html not found at " + INDEX);

  // Capture original title for verification
  const originalIndexContent = fs.readFileSync(INDEX, "utf8");
  const titleMatch = originalIndexContent.match(/<title>([^<]+)<\/title>/);
  const originalTitle = titleMatch ? titleMatch[1] : "(no title)";
  console.log(`Original index.html title: ${originalTitle}`);

  // Backup index.html
  fs.copyFileSync(INDEX, BACKUP);
  console.log(`Backed up index.html → .lint-backup.html`);

  const compositions = findCompositions(COMPS_DIR).sort();
  console.log(`Found ${compositions.length} compositions to sweep\n`);

  const results = [];

  try {
    for (const comp of compositions) {
      const rel = path.relative(ROOT, comp).replace(/\\/g, "/");
      process.stdout.write(`  ${rel} ... `);

      const compContent = fs.readFileSync(comp, "utf8");
      const rewritten = rewriteForRoot(compContent);
      fs.writeFileSync(INDEX, rewritten, "utf8");

      const lint = runLint();
      let row;
      if (!lint.ok) {
        row = {
          comp: rel,
          errors: 1,
          warnings: 0,
          infos: 0,
          firstError: `lint output unparseable: ${lint.parseError}`,
          status: "parse-fail",
        };
        console.log("PARSE-FAIL");
      } else {
        const { errors, warnings, infos } = bucketFindings(lint.findings);
        const firstError = errors[0] ? describeFinding(errors[0]) : "";
        row = {
          comp: rel,
          errors: errors.length,
          warnings: warnings.length,
          infos: infos.length,
          firstError,
          status:
            errors.length > 0
              ? "errors"
              : warnings.length > 0
              ? "warnings"
              : "clean",
        };
        console.log(
          `${errors.length}E / ${warnings.length}W / ${infos.length}I ${
            errors.length === 0 ? "OK" : "FAIL"
          }`
        );
      }
      results.push(row);
    }
  } finally {
    // ALWAYS restore index.html
    if (fs.existsSync(BACKUP)) {
      fs.copyFileSync(BACKUP, INDEX);
      console.log(`\nRestored index.html from backup`);
    } else {
      console.error("\n!! BACKUP MISSING — index.html may be corrupted !!");
    }
  }

  // Verify restoration matches original by title
  const restoredContent = fs.readFileSync(INDEX, "utf8");
  const restoredTitleMatch = restoredContent.match(/<title>([^<]+)<\/title>/);
  const restoredTitle = restoredTitleMatch ? restoredTitleMatch[1] : "(no title)";
  if (restoredTitle !== originalTitle) {
    throw new Error(
      `Restoration FAILED: title is "${restoredTitle}" but should be "${originalTitle}"`
    );
  }
  console.log(`Verified restoration: title = "${restoredTitle}"`);

  // Build report
  const total = results.length;
  const cleanCount = results.filter((r) => r.status === "clean").length;
  const errCompCount = results.filter((r) => r.errors > 0).length;
  const totalErrors = results.reduce((a, r) => a + r.errors, 0);
  const totalWarnings = results.reduce((a, r) => a + r.warnings, 0);
  const totalInfos = results.reduce((a, r) => a + r.infos, 0);

  const lines = [];
  lines.push(`# Composition lint sweep — ${new Date().toISOString()}`);
  lines.push("");
  lines.push(
    "Each composition was treated as the project root in turn (swap-and-restore on `index.html`)."
  );
  lines.push(
    "Design imports were rewritten (`../../design/` and `../design/` → `design/`) and `tokens-PLACEHOLDER.css` was substituted with `tokens-kindred.css` so the linter could resolve assets."
  );
  lines.push("");
  lines.push("| Composition | Errors | Warnings | Infos | Status |");
  lines.push("|-------------|--------|----------|-------|--------|");
  for (const r of results) {
    const status =
      r.status === "clean"
        ? "clean"
        : r.status === "warnings"
        ? "warnings only"
        : r.status === "parse-fail"
        ? `parse-fail — ${r.firstError}`
        : r.firstError
        ? `error — ${r.firstError.replace(/\|/g, "\\|")}`
        : "error";
    lines.push(
      `| ${r.comp} | ${r.errors} | ${r.warnings} | ${r.infos} | ${status} |`
    );
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Total: ${total} compositions`);
  lines.push(`- Clean: ${cleanCount}`);
  lines.push(
    `- Errors: ${totalErrors} (across ${errCompCount} composition${
      errCompCount === 1 ? "" : "s"
    })`
  );
  lines.push(`- Warnings: ${totalWarnings}`);
  lines.push(`- Infos: ${totalInfos}`);
  lines.push("");
  lines.push("## Notes");
  lines.push(
    "- Card / overlay / background sub-compositions begin with `<template id=\"...\">` rather than a full `<!doctype html>` shell. They are intended to be referenced via `data-composition-src` from a parent composition, not used as the project root."
  );
  lines.push(
    "- The sweep rewrote relative design paths during the test only; original files were not modified."
  );

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, lines.join("\n") + "\n", "utf8");
  console.log(`\nReport written to ${path.relative(ROOT, REPORT)}`);

  // Cleanup backup once verified
  fs.unlinkSync(BACKUP);
  console.log("Cleaned up .lint-backup.html");

  console.log(
    `\nDone. ${cleanCount}/${total} clean. ${errCompCount} with errors, ${totalWarnings} warnings, ${totalInfos} infos.`
  );
}

main().catch((err) => {
  console.error("FATAL:", err);
  // Last-ditch restore attempt
  try {
    if (fs.existsSync(BACKUP)) {
      fs.copyFileSync(BACKUP, INDEX);
      console.error("Emergency restore from backup completed.");
    }
  } catch (e) {
    console.error("Emergency restore FAILED:", e);
  }
  process.exit(1);
});
