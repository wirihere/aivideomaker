// Verify-fix — auto-iterate the verifier loop on the assembled index.html.
//
// What it does (high level):
//   1. Run scripts/verify-render.mjs against index.html, capture its JSON.
//   2. Walk the findings; for each auto-fixable pattern, apply a minimal
//      patch directly to index.html (always saving the pre-fix HTML first).
//   3. Re-run the verifier. If verdict improved (or held with strictly
//      fewer findings) we keep the change; otherwise we revert from the
//      saved snapshot. Cap at 5 iterations so a flapping fix can't loop.
//   4. Write a per-run journal to docs/render-learnings/auto-fix-<ts>.md
//      with each iteration's diff summary + verdict deltas.
//
// Auto-fixable patterns:
//   - accessibility · contrast: bump the offending element's font-weight by
//     100 and add a soft text-shadow for legibility.
//   - brand asset use · hero pulled but unused: inject a small fallback
//     <img> in scene 1 if there's no #s1-hero img already.
//   - scene visual density · text-only on default bg: paint the scene with
//     a brand-tinted gradient via inline style.
//   - brand palette use · zero var(--card-) refs: WARN + STOP. This is a
//     template-level miss; the assembler swapped tokens and the assembled
//     comp lost them. Auto-patching at this layer would be guesswork.
//
// Usage:
//   node scripts/verify-fix.mjs
//   node scripts/verify-fix.mjs --comp=index.html
//   node scripts/verify-fix.mjs --max=5            # cap iterations (default 5)
//   node scripts/verify-fix.mjs --dry-run          # show plan, write nothing
//
// Constraints (from project brief):
//   - Doesn't touch scripts/video.mjs or scripts/verify-render.mjs.
//   - Doesn't add new dependencies. Standard Node + child_process only.
//   - Every fix is reversible — pre-fix HTML stashed before each attempt.
//   - Caps at 5 iterations regardless. We don't loop forever.

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- arg parsing ----------------------------------------------------------
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const compArg = typeof flags.comp === "string" ? flags.comp : "index.html";
const maxIter = +flags.max > 0 ? Math.min(+flags.max, 5) : 5;
const dryRun = flags["dry-run"] === true;
const compPath = path.isAbsolute(compArg) ? compArg : path.join(projectRoot, compArg);

if (!fs.existsSync(compPath)) {
  console.error(`x comp not found: ${compPath}`);
  process.exit(2);
}

// --- helpers --------------------------------------------------------------
function ts(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function readText(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return ""; }
}

// Verdicts ordered by quality. We compare numerically — higher = better.
const VERDICT_RANK = { "needs-fix": 0, "watch": 1, "ship": 2 };

// Run verify-render.mjs, parse stdout to find the JSON path it printed,
// then read that JSON and return { verdict, findings, jsonPath, stdout }.
function runVerifier() {
  const verifierPath = path.join(__dirname, "verify-render.mjs");
  const args = [verifierPath, `--comp=${compPath}`];
  // Pipe through copy/vtt the same way video.mjs does — the verifier resolves
  // them automatically from slug heuristics, so we trust its defaults here.
  const r = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
  const stdout = (r.stdout || "").toString("utf8");
  const stderr = (r.stderr || "").toString("utf8");
  // The verifier prints lines like:
  //   json: docs/render-learnings/index-20260426-160212.json
  //   md:   docs/render-learnings/index-20260426-160212.md
  //   verdict: ship
  const jsonMatch = stdout.match(/json:\s+(\S+)/);
  const verdictMatch = stdout.match(/verdict:\s+(\S+)/);
  if (!jsonMatch) {
    throw new Error(
      `couldn't parse verifier stdout for json path.\nstderr: ${stderr.slice(-400)}\nstdout: ${stdout.slice(-400)}`
    );
  }
  const jsonRel = jsonMatch[1];
  const jsonAbs = path.isAbsolute(jsonRel) ? jsonRel : path.join(projectRoot, jsonRel);
  let payload = null;
  try { payload = JSON.parse(fs.readFileSync(jsonAbs, "utf8")); }
  catch (err) { throw new Error(`couldn't read verifier JSON ${jsonAbs}: ${err.message}`); }
  return {
    verdict: verdictMatch ? verdictMatch[1] : payload.verdict,
    findings: payload.findings || {},
    sceneCensus: Array.isArray(payload.sceneCensus) ? payload.sceneCensus : [],
    tokenHexes: Array.isArray(payload.tokenHexes) ? payload.tokenHexes : [],
    manifestAssetCount: payload.manifestAssetCount || 0,
    slug: payload.slug,
    jsonPath: jsonAbs,
    stdout,
    stderr,
    exitCode: r.status,
  };
}

// Score findings: lower = better. Sum severities by category. Used to break
// verdict ties (e.g., "watch → watch with one less a11y finding" still wins).
function scoreFindings(findings) {
  const counts = {
    placeholderLeakage: (findings.placeholderLeakage || []).length * 5,
    brandFidelityMissing: (findings.brandFidelity || [])
      .filter((f) => f.kind === "brand-name-missing" || f.kind === "url-missing").length * 4,
    paletteZero: (findings.brandPaletteUse || [])
      .filter((f) => f.kind === "zero-var-refs").length * 4,
    visualIdentityAbsent: (findings.brandAssetUse || [])
      .filter((f) => f.kind === "visual-identity-absent").length * 4,
    consecTextOnly: (findings.sceneVisualDensity || [])
      .filter((f) => f.kind === "consecutive-text-only").length * 3,
    contrast: (findings.accessibility || [])
      .filter((f) => f.kind === "contrast").length,
    smallText: (findings.accessibility || [])
      .filter((f) => f.kind === "small-text").length,
    paletteOff: (findings.brandPaletteUse || [])
      .filter((f) => f.kind === "scene-bg-off-palette").length,
    pacing: (findings.pacing || []).length,
    textOnly: (findings.sceneVisualDensity || [])
      .filter((f) => f.kind === "text-only-scene").length,
    unusedAssets: (findings.brandAssetUse || [])
      .filter((f) => f.kind === "asset-unused").length,
    headlineMiss: (findings.brandFidelity || [])
      .filter((f) => f.kind === "beat-headline-missing").length,
  };
  let total = 0;
  for (const v of Object.values(counts)) total += v;
  return { total, counts };
}

// Strict-monotonic improvement check: better-or-equal verdict AND strictly
// lower score. Equal score with same verdict is a no-op and we revert.
function isImprovement(prev, next) {
  const prevRank = VERDICT_RANK[prev.verdict] ?? 0;
  const nextRank = VERDICT_RANK[next.verdict] ?? 0;
  if (nextRank > prevRank) return true; // strictly better verdict — always keep
  if (nextRank < prevRank) return false; // worse verdict — always revert
  // Same verdict: keep only if score strictly dropped.
  return next.score.total < prev.score.total;
}

// --- fix planners ----------------------------------------------------------
// Each planner inspects findings + current HTML, returns either a candidate
// fix (function that mutates HTML in place returning new text + diff summary)
// or null when there's nothing to do.
//
// Rules of the road for fixers:
//   - Fixers never delete content. Only add inline style or tag attributes.
//   - Fixers must be idempotent enough that a re-run won't double-apply.
//   - Fixers operate on the assembled index.html only — never sibling files.

function findFixForContrast(findings, html) {
  const items = (findings.accessibility || []).filter((f) => f.kind === "contrast" && f.scene);
  if (!items.length) return null;
  // Pick the lowest-ratio item — it's the most painful and the one most
  // likely to actually improve from a font-weight bump + soft text-shadow.
  const target = items.slice().sort((a, b) => (a.ratio ?? 99) - (b.ratio ?? 99))[0];
  const sceneId = target.scene;
  const snippetText = (target.text || "").slice(0, 40);
  // Strategy: locate the scene block in HTML, then within it find the first
  // element whose visible textContent matches our snippet. We can't pick a
  // specific id without DOM, so we widen by tag (h1/h2/p/div/span) and pick
  // the first one whose inner text starts with the snippet (case-sensitive
  // — visible-text scrub preserves case).
  return {
    label: `accessibility · contrast: scene ${sceneId} "${snippetText}" ratio ${(target.ratio ?? 0).toFixed(2)}:1`,
    apply: (currentHtml) => {
      const sceneRe = new RegExp(
        `<div\\b[^>]*\\bid=["']${escapeRegExp(sceneId)}["'][^>]*>([\\s\\S]*?)</div>\\s*(?=<!--|<div\\b[^>]*\\bclass=["'][^"']*\\bscene\\b|</div>\\s*<!--\\s*SVG|</div>\\s*</body>)`,
        "i"
      );
      // Looser fallback: just match the scene's opening div and then find
      // the next element matching our text.
      const openSceneRe = new RegExp(
        `(<div\\b[^>]*\\bid=["']${escapeRegExp(sceneId)}["'][^>]*>)`,
        "i"
      );
      const openMatch = currentHtml.match(openSceneRe);
      if (!openMatch) return null;
      const startIdx = openMatch.index + openMatch[0].length;
      // Walk forward to find the matching </div> for the scene root by
      // counting nested <div> opens. The verify-render comp uses simple
      // 2-3 levels of nesting, so this is safe.
      const sliceEnd = findMatchingCloseDiv(currentHtml, openMatch.index);
      if (sliceEnd < 0) return null;
      const sceneSlice = currentHtml.slice(startIdx, sliceEnd);
      // Find a text-bearing tag (h1/h2/p/div/span) whose inner text starts
      // with our snippet's first 16 chars (matched loosely).
      const snippetProbe = snippetText.replace(/[.\s]+$/, "").slice(0, Math.max(8, Math.min(snippetText.length, 24)));
      // Pattern: opening tag, possibly with style attr, then text containing
      // our probe. We capture the opening tag so we can rewrite its style.
      const tagRe = new RegExp(
        `<(h1|h2|h3|h4|h5|p|div|span|a)\\b([^>]*)>([^<]*${escapeRegExp(snippetProbe)}[^<]*)</\\1>`,
        "i"
      );
      const tagMatch = sceneSlice.match(tagRe);
      if (!tagMatch) return null;
      const tag = tagMatch[1];
      const attrs = tagMatch[2];
      const inner = tagMatch[3];
      // Skip if we've already patched this tag (idempotency guard).
      if (/data-fix-contrast="1"/i.test(attrs)) return null;
      const newAttrs = bumpStyleForContrast(attrs);
      const newTag = `<${tag}${newAttrs} data-fix-contrast="1">${inner}</${tag}>`;
      const patchedSlice = sceneSlice.replace(tagMatch[0], newTag);
      const patched = currentHtml.slice(0, startIdx) + patchedSlice + currentHtml.slice(sliceEnd);
      return {
        html: patched,
        diff: `scene ${sceneId}: bumped <${tag}> font-weight + added soft text-shadow on "${snippetText.slice(0, 32)}"`,
      };
    },
  };
}

// Augment a tag's style="..." (or add one) with font-weight bump + soft
// text-shadow for legibility. Idempotent on style content (we don't strip).
function bumpStyleForContrast(attrs) {
  const styleRe = /style=(["'])([^"']*)\1/i;
  const addition =
    "font-weight:700 !important; text-shadow: 0 0 4px var(--card-paper, white), 0 0 2px var(--card-paper, white);";
  if (styleRe.test(attrs)) {
    return attrs.replace(styleRe, (_, q, val) => `style=${q}${val}; ${addition}${q}`);
  }
  return `${attrs} style="${addition}"`;
}

function findFixForHeroUnused(findings, html, manifestAssets, slug) {
  // Asset findings live under brandAssetUse.{kind:"asset-unused"|"visual-identity-absent"}
  const assetFindings = findings.brandAssetUse || [];
  const heroUnused = assetFindings.find(
    (f) =>
      (f.kind === "asset-unused" && (f.assetKind === "hero" || /hero/i.test(f.assetPath || ""))) ||
      f.kind === "visual-identity-absent"
  );
  if (!heroUnused) return null;
  // Resolve the actual hero asset path from manifest if available; fall back
  // to a slug-based guess so the script still does something useful when
  // manifest parsing failed in the verifier.
  const heroPath =
    (heroUnused.assetPath && /hero/i.test(heroUnused.assetPath) ? heroUnused.assetPath : null) ||
    `assets/${slug}/hero.png`;
  // Bail if the asset doesn't exist on disk — we won't inject a 404.
  const heroAbs = path.isAbsolute(heroPath) ? heroPath : path.join(projectRoot, heroPath);
  if (!fs.existsSync(heroAbs)) {
    return null;
  }
  return {
    label: `brand asset use · hero unused: inject fallback <img> referencing ${heroPath}`,
    apply: (currentHtml) => {
      // Only inject if there's no img with id #s1-hero (real or fallback)
      // already in scene 1's body. Re-runs would otherwise double-stack.
      const scene1OpenRe = /<div\b[^>]*\bid=["']s1["'][^>]*>/i;
      const open = currentHtml.match(scene1OpenRe);
      if (!open) return null;
      const startIdx = open.index + open[0].length;
      const closeIdx = findMatchingCloseDiv(currentHtml, open.index);
      if (closeIdx < 0) return null;
      const slice = currentHtml.slice(startIdx, closeIdx);
      if (/id=["']s1-hero["']|id=["']s1-hero-fallback["']/.test(slice)) return null;
      // Inject a small bottom-right pin so it never collides with center
      // titles or kicker copy. Opacity .3 keeps it subtle.
      const inject =
        `\n      <img id="s1-hero-fallback" src="${heroPath}" alt="" ` +
        `style="position:absolute; bottom:80px; right:80px; width:120px; opacity:0.3; pointer-events:none;">\n    `;
      const patched =
        currentHtml.slice(0, startIdx) +
        inject +
        currentHtml.slice(startIdx);
      return {
        html: patched,
        diff: `injected fallback hero <img id="s1-hero-fallback"> into scene s1 (src=${heroPath})`,
      };
    },
  };
}

function findFixForTextOnlyScenes(findings, html, tokenHexes) {
  // text-only-scene = single-scene warning. Apply a brand-tinted gradient
  // to each offending scene if we have a brand palette to draw from.
  const items = (findings.sceneVisualDensity || []).filter((f) => f.kind === "text-only-scene" && f.scene);
  if (!items.length) return null;
  // Sort by scene id so we patch deterministically (s2 before s3 before s4).
  const sorted = items.slice().sort((a, b) => String(a.scene).localeCompare(String(b.scene)));
  // Take the first scene we haven't already painted on a previous iteration.
  for (const f of sorted) {
    const sceneId = f.scene;
    return {
      label: `scene visual density · text-only: paint scene ${sceneId} with brand-tinted gradient`,
      apply: (currentHtml) => {
        const openRe = new RegExp(
          `(<div\\b[^>]*\\bid=["']${escapeRegExp(sceneId)}["'][^>]*)>`,
          "i"
        );
        const m = currentHtml.match(openRe);
        if (!m) return null;
        // Idempotency guard — if we've already added our marker, skip.
        if (/data-fix-density="1"/i.test(m[0])) return null;
        const styleAddition =
          "background: linear-gradient(135deg, var(--card-slate, var(--card-paper, #F4EFE7)), var(--card-paper, #FFFFFF)) !important;";
        // Inject style + marker. If there's an existing inline style, append
        // ours; otherwise add a new style="..." attribute.
        let newOpen = m[1];
        if (/\bstyle=/.test(newOpen)) {
          newOpen = newOpen.replace(
            /style=(["'])([^"']*)\1/,
            (_, q, val) => `style=${q}${val}; ${styleAddition}${q}`
          );
        } else {
          newOpen = `${newOpen} style="${styleAddition}"`;
        }
        newOpen = `${newOpen} data-fix-density="1">`;
        const patched = currentHtml.replace(m[0], newOpen);
        if (patched === currentHtml) return null;
        return {
          html: patched,
          diff: `scene ${sceneId}: applied brand-tinted gradient surface (linear-gradient(135deg, slate→paper))`,
        };
      },
    };
  }
  return null;
}

// --- low-level html walker -------------------------------------------------
// Find the index where `<div ... >` (starting at openIdx) is closed by its
// matching `</div>`. Returns the index of the `<` of the closing tag, or -1.
function findMatchingCloseDiv(html, openIdx) {
  // Move past the opening tag's `>`.
  const ge = html.indexOf(">", openIdx);
  if (ge < 0) return -1;
  let depth = 1;
  let i = ge + 1;
  const re = /<\/?div\b/gi;
  re.lastIndex = i;
  let m;
  while ((m = re.exec(html))) {
    if (html[m.index + 1] === "/") {
      depth--;
      if (depth === 0) return m.index;
    } else {
      depth++;
    }
  }
  return -1;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- planner driver -------------------------------------------------------
// Given the latest verifier result + current HTML, return the next fix to
// try (or null when nothing left). Order matters — we tackle the highest-
// impact category first so each iteration moves the verdict if it can.
function planNextFix(result, html) {
  const f = result.findings || {};
  // Hard stop: if zero var(--card-) refs is on, no auto-fix is safe.
  // Surface-level patches won't bring the palette back; the assembler did
  // the wrong thing. Caller decides what to do.
  const zeroVarRefs = (f.brandPaletteUse || []).some((x) => x.kind === "zero-var-refs");
  if (zeroVarRefs) {
    return { stop: true, reason: "zero var(--card-) refs in assembled comp — palette bypass is template-level, can't auto-patch" };
  }
  // Tier 1: hero unused / visual identity absent — biggest visible-fidelity miss.
  const fix1 = findFixForHeroUnused(f, html, [], result.slug);
  if (fix1) return fix1;
  // Tier 2: text-only scenes — adds brand-tinted bg.
  const fix2 = findFixForTextOnlyScenes(f, html, result.tokenHexes);
  if (fix2) return fix2;
  // Tier 3: contrast — bump weight + add text-shadow on the worst offender.
  const fix3 = findFixForContrast(f, html);
  if (fix3) return fix3;
  return null;
}

// --- main loop ------------------------------------------------------------
const t0 = Date.now();
console.log(`> verify-fix on ${path.relative(projectRoot, compPath)} (max ${maxIter} iter${dryRun ? ", dry-run" : ""})`);

const learnDir = path.join(projectRoot, "docs", "render-learnings");
fs.mkdirSync(learnDir, { recursive: true });
const journal = [];
journal.push(`# Auto-fix journal — ${ts()}`);
journal.push("");
journal.push(`- comp: \`${path.relative(projectRoot, compPath).replace(/\\/g, "/")}\``);
journal.push(`- max iterations: ${maxIter}${dryRun ? " (dry-run)" : ""}`);
journal.push("");

// Initial verifier run.
let cur;
try { cur = runVerifier(); }
catch (err) {
  console.error(`x initial verify failed: ${err.message}`);
  process.exit(2);
}
cur.score = scoreFindings(cur.findings);
console.log(`  init: verdict=${cur.verdict} score=${cur.score.total}`);
journal.push(`## Initial state`);
journal.push("");
journal.push(`- verdict: **${cur.verdict}**`);
journal.push(`- score: ${cur.score.total}`);
journal.push(`- json: \`${path.relative(projectRoot, cur.jsonPath).replace(/\\/g, "/")}\``);
journal.push("");
journal.push("### Findings summary");
journal.push("");
journal.push(`- placeholder leakage: ${(cur.findings.placeholderLeakage || []).length}`);
journal.push(`- brand fidelity: ${(cur.findings.brandFidelity || []).length}`);
journal.push(`- accessibility: ${(cur.findings.accessibility || []).length}`);
journal.push(`- pacing: ${(cur.findings.pacing || []).length}`);
journal.push(`- brand palette use: ${(cur.findings.brandPaletteUse || []).length}`);
journal.push(`- brand asset use: ${(cur.findings.brandAssetUse || []).length}`);
journal.push(`- scene visual density: ${(cur.findings.sceneVisualDensity || []).length}`);
journal.push("");

// Bail early if already shipping clean — no work to do.
if (cur.verdict === "ship" && cur.score.total === 0) {
  journal.push(`Already ship/clean — no auto-fixes attempted.`);
  writeJournal(journal);
  console.log(`. already ship+clean, nothing to do (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  process.exit(0);
}

let iteration = 0;
let stoppedReason = null;

while (iteration < maxIter) {
  iteration++;
  const html = readText(compPath);
  const plan = planNextFix(cur, html);
  if (!plan) {
    stoppedReason = "no auto-fixable findings remaining";
    break;
  }
  if (plan.stop) {
    stoppedReason = plan.reason;
    journal.push(`## Iteration ${iteration}`);
    journal.push("");
    journal.push(`Stopped: ${plan.reason}`);
    journal.push("");
    break;
  }
  journal.push(`## Iteration ${iteration}`);
  journal.push("");
  journal.push(`- planned: ${plan.label}`);
  console.log(`  iter ${iteration}: ${plan.label}`);
  if (dryRun) {
    journal.push(`- dry-run — not applied.`);
    journal.push("");
    continue;
  }
  // Snapshot pre-fix HTML so we can revert losslessly.
  const preFixHtml = html;
  let result;
  try { result = plan.apply(html); }
  catch (err) {
    journal.push(`- apply error: ${err.message} (skipped)`);
    journal.push("");
    continue;
  }
  if (!result) {
    journal.push(`- planner returned no patch (already idempotent?) — skipping`);
    journal.push("");
    // Belt + braces: prevent the same planner from infinitely returning a
    // no-op fix by recording an idempotency tag in cur findings. Easiest
    // way out: drop this iteration entirely and try the next planner by
    // patching cur in place — we synthesize a "consumed" marker.
    cur._consumedKind = (cur._consumedKind || []).concat([plan.label]);
    if (cur._consumedKind.length >= 3) {
      stoppedReason = "planners idle for 3 attempts";
      break;
    }
    continue;
  }
  fs.writeFileSync(compPath, result.html, "utf8");
  journal.push(`- applied: ${result.diff}`);
  // Re-verify.
  let next;
  try { next = runVerifier(); }
  catch (err) {
    // Verifier failed — revert immediately. Catastrophic patch.
    fs.writeFileSync(compPath, preFixHtml, "utf8");
    journal.push(`- verifier crashed (\`${err.message}\`) — reverted.`);
    journal.push("");
    continue;
  }
  next.score = scoreFindings(next.findings);
  if (isImprovement(cur, next)) {
    journal.push(
      `- new verdict: **${next.verdict}** (score ${next.score.total} ← ${cur.score.total}) — kept`
    );
    journal.push("");
    cur = next;
    if (cur.verdict === "ship" && cur.score.total === 0) {
      stoppedReason = "verdict=ship and score=0 — no further work";
      break;
    }
    continue;
  }
  // No improvement — revert.
  fs.writeFileSync(compPath, preFixHtml, "utf8");
  journal.push(
    `- new verdict: **${next.verdict}** (score ${next.score.total} vs ${cur.score.total}) — no improvement, reverted`
  );
  journal.push("");
  // Mark this fix kind as consumed-but-fruitless so we move on.
  cur._consumedKind = (cur._consumedKind || []).concat([plan.label]);
  // For contrast specifically, the planner picks the worst-ratio item each
  // pass. To avoid re-trying the same one when it didn't help, strip it.
  if (/contrast/i.test(plan.label)) {
    const items = (cur.findings.accessibility || []).filter((x) => x.kind === "contrast");
    items.sort((a, b) => (a.ratio ?? 99) - (b.ratio ?? 99));
    if (items.length) {
      const target = items[0];
      cur.findings.accessibility = (cur.findings.accessibility || []).filter(
        (x) => !(x.kind === "contrast" && x.scene === target.scene && x.text === target.text)
      );
    }
  }
  // For text-only scenes, drop the scene we just tried.
  if (/text-only/i.test(plan.label)) {
    const sceneIdMatch = plan.label.match(/scene\s+(\S+)\s+with/i);
    if (sceneIdMatch) {
      cur.findings.sceneVisualDensity = (cur.findings.sceneVisualDensity || []).filter(
        (x) => !(x.kind === "text-only-scene" && x.scene === sceneIdMatch[1])
      );
    }
  }
  // For hero unused, drop the offender so the next plan moves on.
  if (/hero unused|hero pulled/i.test(plan.label)) {
    cur.findings.brandAssetUse = (cur.findings.brandAssetUse || []).filter(
      (x) => x.kind !== "asset-unused" && x.kind !== "visual-identity-absent"
    );
  }
}

if (!stoppedReason) {
  stoppedReason = `max iterations (${maxIter}) reached`;
}

journal.push(`## Final state`);
journal.push("");
journal.push(`- verdict: **${cur.verdict}**`);
journal.push(`- score: ${cur.score.total}`);
journal.push(`- iterations: ${iteration}`);
journal.push(`- stop reason: ${stoppedReason}`);
journal.push("");

const outPath = path.join(learnDir, `auto-fix-${ts()}.md`);
function writeJournal(lines) { fs.writeFileSync(outPath, lines.join("\n"), "utf8"); }
writeJournal(journal);

const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log("");
console.log(`. final verdict: ${cur.verdict} (score ${cur.score.total}) after ${iteration} iter (${dt}s)`);
console.log(`  reason: ${stoppedReason}`);
console.log(`  journal: ${path.relative(projectRoot, outPath).replace(/\\/g, "/")}`);

// Exit 0 if we ship/watch (or dry-run completed), 1 if we're still needs-fix.
process.exit(cur.verdict === "needs-fix" ? 1 : 0);
