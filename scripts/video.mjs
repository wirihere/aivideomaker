// Master pipeline orchestrator — turn a URL into a rendered MP4 in one command.
//
// Usage:
//   npm run video -- <url>
//   npm run video -- <url> --seconds=30
//   npm run video -- <url> --seconds=15 --template=social-reel
//   npm run video -- <url> --no-render --keep-artifacts   # assemble + check, skip render
//
// Pipeline (each step is its own stage):
//   1. brand extract      → tokens-<slug>.css   (scripts/new-comp.mjs)
//   2. copy generate      → <slug>.copy.json    (scripts/extract-copy.mjs, optional)
//   3. asset pull         → assets/<slug>/      (scripts/pull-assets.mjs, optional)
//   4. music pick         → candidate tracks    (scripts/pick-music.mjs, optional)
//   5. composition assemble → index.html        (template + tokens + copy)
//   6. quality gate       → npm run check       (lint + smoke)
//   7. render             → renders/<slug>-<ts>-graded[-wm].mp4
//
// Flags:
//   --seconds=N        (default 30) — drives template choice
//   --template=<name>  override auto-pick (social-reel | hero-promo | case-study | founder-story | testimonial)
//   --name=<slug>      override URL-derived slug
//   --with-music       actually wire the picked music into the composition
//   --no-render        assemble + check, skip render (saves ~5min)
//   --auto-fix         run `npm run fix:apply` if quality gate fails
//   --keep-artifacts   don't restore index.html at end (for inspection)
//
// Constraints:
//   - MUST restore index.html via try/finally even on crash.
//   - Each stage reports its own time + output path.
//   - Workers (extract-copy, pull-assets, pick-music) may not exist yet — gracefully degrade.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- args -----------------------------------------------------------------

const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith("--"));
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const url = positional[0];
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Usage: npm run video -- <https://example.com> [--seconds=N] [--template=<name>] [--name=<slug>]");
  console.error("       npm run video -- <url> --no-render --keep-artifacts   # quick sanity check");
  console.error("");
  console.error("Templates: social-reel (15s) | hero-promo (30s) | testimonial (45s) | founder-story | case-study (60s)");
  process.exit(1);
}

const seconds = Math.max(5, parseInt(flags.seconds ?? "30", 10));
const withMusic = !!flags["with-music"];
const skipRender = !!flags["no-render"];
const autoFix = !!flags["auto-fix"];
const keepArtifacts = !!flags["keep-artifacts"];

const host = new URL(url).hostname.replace(/^www\./, "").replace(/\.[a-z]+$/, "");
const slug = String(flags.name ?? host).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

// --- template auto-pick ---------------------------------------------------
//
// Map seconds → known structural template. We list every template the
// Templates supervisor mentioned (testimonial, product-launch, founder-story,
// before-after, faq-quick) plus the three already-shipped ones. The
// `assembleComposition` step gracefully falls back if the template file
// doesn't exist on disk yet.

// Each entry maps a structural template (scene count + form) to the vibe
// template the Copy supervisor and Music supervisor expect (they only know
// vibe template names). `shipped` is recomputed at runtime from the disk so
// the orchestrator stays self-correcting as templates land.
const TEMPLATE_REGISTRY = {
  "social-reel":     { file: "social-reel-15s.html",   seconds: 15, dims: [1080, 1920], vibe: "kinetic-pop"    },
  "hero-promo":      { file: "hero-promo-30s.html",    seconds: 30, dims: [1920, 1080], vibe: "kinetic-pop"    },
  "product-launch":  { file: "product-launch-30s.html",seconds: 30, dims: [1920, 1080], vibe: "kinetic-pop"    },
  "before-after":    { file: "before-after-30s.html",  seconds: 30, dims: [1920, 1080], vibe: "kinetic-pop"    },
  "faq-quick":       { file: "faq-quick-30s.html",     seconds: 30, dims: [1920, 1080], vibe: "warm-community" },
  "testimonial":     { file: "testimonial-45s.html",   seconds: 45, dims: [1920, 1080], vibe: "warm-community" },
  "founder-story":   { file: "founder-story-60s.html", seconds: 60, dims: [1920, 1080], vibe: "documentary"    },
  "case-study":      { file: "case-study-60s.html",    seconds: 60, dims: [1920, 1080], vibe: "documentary"    },
};

function pickTemplate({ seconds, override }) {
  if (override) {
    if (!TEMPLATE_REGISTRY[override]) {
      throw new Error(`Unknown template "${override}". Pick from: ${Object.keys(TEMPLATE_REGISTRY).join(", ")}`);
    }
    return override;
  }
  // Bucket by seconds.
  if (seconds <= 20) return "social-reel";
  if (seconds <= 35) return "hero-promo";
  if (seconds <= 50) return "testimonial";
  if (seconds <= 75) return "case-study";
  return "case-study";
}

function resolveTemplatePath(templateName) {
  // Prefer exact entry in registry; if file is missing on disk, fall back to
  // the template with the closest duration that DOES exist.
  const entry = TEMPLATE_REGISTRY[templateName];
  if (!entry) return null;
  const tryPath = path.join(projectRoot, "compositions", "templates", entry.file);
  if (fs.existsSync(tryPath)) return { name: templateName, file: tryPath, entry };

  // Fallback: pick the existing template with the closest duration.
  const existing = Object.entries(TEMPLATE_REGISTRY)
    .map(([n, e]) => ({ name: n, entry: e, file: path.join(projectRoot, "compositions", "templates", e.file) }))
    .filter(t => fs.existsSync(t.file))
    .sort((a, b) => Math.abs(a.entry.seconds - entry.seconds) - Math.abs(b.entry.seconds - entry.seconds));

  if (!existing.length) return null;
  const fallback = existing[0];
  return { name: fallback.name, file: fallback.file, entry: fallback.entry, fallbackFor: templateName };
}

// extract-copy.mjs only accepts seconds in {15, 30, 60} and a vibe-style
// template name. Map our structural pick → the closest contract it knows.
function vibeForTemplate(templateName) {
  return TEMPLATE_REGISTRY[templateName]?.vibe || "warm-community";
}
function bucketSeconds(s) {
  // pick the closest of {15, 30, 60}.
  return [15, 30, 60].sort((a, b) => Math.abs(a - s) - Math.abs(b - s))[0];
}

// --- helpers --------------------------------------------------------------

function fmtTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

function relPath(p) {
  if (!p) return "";
  const r = path.relative(projectRoot, p).replace(/\\/g, "/");
  return r || ".";
}

// Stage runner: prints a `[i/N] <label>` line, runs `fn`, prints the result
// and elapsed time. `fn` returns a string (output path / summary) or an
// object `{ output, soft }`.
function makeStageRunner(total) {
  let i = 0;
  return async function stage(label, fn) {
    i += 1;
    const labelText = `${label}`.padEnd(20);
    process.stdout.write(`  [${i}/${total}] ${labelText}`);
    const t0 = Date.now();
    try {
      const result = await fn();
      const ms = Date.now() - t0;
      const output = typeof result === "string" ? result : (result?.output ?? "");
      const soft = typeof result === "object" && result?.soft;
      const arrow = soft ? "→ " : "→ ";
      const out = output.padEnd(40);
      console.log(`${arrow}${out}(${fmtTime(ms)})`);
      return { ms, ...((typeof result === "object" && result) || {}), output };
    } catch (err) {
      const ms = Date.now() - t0;
      console.log(`→ FAILED                                  (${fmtTime(ms)})`);
      err.stage = label;
      err.elapsedMs = ms;
      throw err;
    }
  };
}

// Run a child process synchronously. Returns `{ status, stdout, stderr }`.
// We use `spawnSync` so we can capture output for failed stages without
// printing it inline (keeps the per-stage log tidy).
function runNode(scriptPath, args = [], { quiet = true, env = {} } = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: false,
  });
  return result;
}

function runNpm(scriptName, extraArgs = [], { quiet = true } = {}) {
  // On Windows, `npm` is a `.cmd` shim, so we need shell:true. Pass extra
  // args via `--` so they reach the underlying script.
  const args = ["run", scriptName];
  if (extraArgs.length) args.push("--", ...extraArgs);
  const result = spawnSync("npm", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: true,
  });
  return result;
}

// --- backup / restore index.html -----------------------------------------

const indexPath = path.join(projectRoot, "index.html");
const backupPath = path.join(projectRoot, `.video-orchestrator.index.bak`);
let backupCreated = false;
let priorIndexLabel = "(none)";

function backupIndex() {
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, backupPath);
    backupCreated = true;
    // Try to derive a label from the <title> for the assemble-stage log line.
    try {
      const head = fs.readFileSync(indexPath, "utf8").slice(0, 2048);
      const m = head.match(/<title>([^<]+)<\/title>/i);
      if (m) priorIndexLabel = m[1].trim().split(/[—\-|]/)[0].trim().slice(0, 30);
    } catch {}
  }
}

function restoreIndex() {
  if (!backupCreated) return;
  if (keepArtifacts) {
    console.log(`  ⓘ --keep-artifacts: index.html left as assembled. Restore with:`);
    console.log(`    cp "${relPath(backupPath)}" index.html`);
    return;
  }
  try {
    fs.copyFileSync(backupPath, indexPath);
    fs.unlinkSync(backupPath);
    backupCreated = false;
  } catch (err) {
    console.error(`  ⚠ failed to restore index.html: ${err.message}`);
    console.error(`    backup is still at: ${relPath(backupPath)}`);
  }
}

// --- main pipeline --------------------------------------------------------

const totalStart = Date.now();
console.log(`▶ video: ${url}`);
console.log(`  slug: ${slug} · target seconds: ${seconds} · render: ${skipRender ? "no" : "yes"}${withMusic ? " · music: on" : ""}`);
console.log("");

const stage = makeStageRunner(7);
let copyJsonPath = null;
let assetsDir = null;
let musicCandidates = null;
let chosenTemplate = null;

let stageError = null;

try {
  // ----- Stage 1: brand extract -------------------------------------------
  // Reuse new-comp.mjs in --mode=headless. It writes design/tokens-<slug>.css
  // AND a compositions/<slug>.html scaffold (which we ignore — we use the
  // structural template). We pipe its output to /dev/null since the parent
  // stage line is the canonical log.
  await stage("brand extract", () => {
    const tokensCssRel = `design/tokens-${slug}.css`;
    const r = runNode(path.join(__dirname, "new-comp.mjs"),
      [url, `--mode=headless`, `--name=${slug}`],
      { quiet: true });
    if (r.status !== 0) {
      const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-5).join("\n");
      throw new Error(`new-comp.mjs failed (exit ${r.status})\n${stderr}`);
    }
    if (!fs.existsSync(path.join(projectRoot, tokensCssRel))) {
      throw new Error(`expected ${tokensCssRel} but it was not written`);
    }
    return tokensCssRel;
  });

  // ----- Stage 2: copy generate -------------------------------------------
  // Optional — depends on extract-copy.mjs (Copy supervisor's deliverable).
  // Falls back to using the headlines new-comp scraped, written to a
  // <slug>.copy.json placeholder so downstream stages have a stable contract.
  const copyScript = path.join(__dirname, "extract-copy.mjs");
  copyJsonPath = path.join(projectRoot, "compositions", `${slug}.copy.json`);
  await stage("copy generate", () => {
    if (!fs.existsSync(copyScript)) {
      // Graceful degradation — synthesize copy from the brand extract output.
      const placeholderCopy = synthesizeCopyFromTokens({ slug, seconds });
      fs.mkdirSync(path.dirname(copyJsonPath), { recursive: true });
      fs.writeFileSync(copyJsonPath, JSON.stringify(placeholderCopy, null, 2));
      return { output: `compositions/${slug}.copy.json (placeholder)`, soft: true };
    }
    // extract-copy.mjs takes a vibe-style template + bucketed seconds.
    const structural = pickTemplate({ seconds, override: flags.template });
    const vibe = vibeForTemplate(structural);
    const bucket = bucketSeconds(seconds);
    const r = runNode(copyScript,
      [url, `--template=${vibe}`, `--seconds=${bucket}`, `--name=${slug}`],
      { quiet: true });
    // exit 2 = "thin narration" warning — the JSON was still written. Treat
    // as soft and continue.
    if (r.status !== 0 && r.status !== 2) {
      const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-5).join("\n");
      console.warn(`\n    ⚠ extract-copy.mjs failed (exit ${r.status}); using placeholders\n${stderr}`);
      const placeholderCopy = synthesizeCopyFromTokens({ slug, seconds });
      fs.writeFileSync(copyJsonPath, JSON.stringify(placeholderCopy, null, 2));
      return { output: `compositions/${slug}.copy.json (fallback)`, soft: true };
    }
    if (!fs.existsSync(copyJsonPath)) {
      const placeholderCopy = synthesizeCopyFromTokens({ slug, seconds });
      fs.writeFileSync(copyJsonPath, JSON.stringify(placeholderCopy, null, 2));
      return { output: `compositions/${slug}.copy.json (synthesized)`, soft: true };
    }
    if (r.status === 2) return { output: `compositions/${slug}.copy.json (thin)`, soft: true };
    return `compositions/${slug}.copy.json`;
  });

  // ----- Stage 3: asset pull ----------------------------------------------
  // Optional — depends on pull-assets.mjs. Falls back to skipping (the
  // generated tokens already include a logo URL note from new-comp).
  const assetsScript = path.join(__dirname, "pull-assets.mjs");
  assetsDir = path.join(projectRoot, "assets", slug);
  await stage("asset pull", () => {
    if (!fs.existsSync(assetsScript)) {
      return { output: `skipped (pull-assets.mjs not found)`, soft: true };
    }
    const r = runNode(assetsScript, [url, `--name=${slug}`], { quiet: true });
    if (r.status !== 0) {
      const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-3).join("\n");
      console.warn(`\n    ⚠ pull-assets.mjs failed (exit ${r.status}); continuing without\n${stderr}`);
      return { output: `skipped (pull-assets failed)`, soft: true };
    }
    if (!fs.existsSync(assetsDir)) {
      return { output: `assets/${slug}/ (empty)`, soft: true };
    }
    const fileCount = walkCount(assetsDir);
    return `assets/${slug}/ (${fileCount} files)`;
  });

  // ----- Stage 4: music pick ----------------------------------------------
  // Optional — depends on pick-music.mjs. Without --with-music we just
  // surface the recommended URLs; with the flag we'd actually wire them in
  // (deferred to that script's contract once it ships).
  const musicScript = path.join(__dirname, "pick-music.mjs");
  await stage("music pick", () => {
    if (!fs.existsSync(musicScript)) {
      return { output: `skipped (pick-music.mjs not found)`, soft: true };
    }
    // pick-music.mjs takes a vibe template + raw seconds; --json prints
    // candidates to stdout (it doesn't write a file itself, so we capture).
    const structural = pickTemplate({ seconds, override: flags.template });
    const vibe = vibeForTemplate(structural);
    const args = [`--template=${vibe}`, `--seconds=${seconds}`, `--json`];
    if (withMusic) args.push("--download");
    const r = runNode(musicScript, args, { quiet: true });
    if (r.status !== 0) {
      const stderr = (r.stderr || r.stdout || "").trim().split("\n").slice(-3).join("\n");
      console.warn(`\n    ⚠ pick-music.mjs failed (exit ${r.status})\n${stderr}`);
      return { output: `no candidates`, soft: true };
    }
    // Parse JSON from stdout (pick-music.mjs --json prints a single payload).
    const musicJsonPath = path.join(projectRoot, "compositions", `${slug}.music.json`);
    let n = 0;
    try {
      const stdout = (r.stdout || "").trim();
      // Find the JSON object — stdout may have "[pick-music] …" lines mixed in.
      const start = stdout.indexOf("{");
      const end = stdout.lastIndexOf("}");
      if (start >= 0 && end > start) {
        musicCandidates = JSON.parse(stdout.slice(start, end + 1));
        const list = musicCandidates?.tracks ?? musicCandidates?.candidates ?? musicCandidates?.picks ?? [];
        n = Array.isArray(list) ? list.length : 0;
        fs.writeFileSync(musicJsonPath, JSON.stringify(musicCandidates, null, 2));
      }
    } catch {}
    return `${n || "?"} candidate track${n === 1 ? "" : "s"}`;
  });

  // ----- Stage 5: composition assemble ------------------------------------
  // Pick a template, copy to index.html, rewrite paths, swap tokens, inject copy.
  await stage("assemble", () => {
    backupIndex();
    const requested = pickTemplate({ seconds, override: flags.template });
    const resolved = resolveTemplatePath(requested);
    if (!resolved) {
      throw new Error(`no template available — looked for "${requested}" and shipped fallbacks in compositions/templates/`);
    }
    chosenTemplate = resolved;

    let html = fs.readFileSync(resolved.file, "utf8");

    // Path rewrite: ../../design/ → design/, ../design/ → design/
    html = html.replace(/\.\.\/\.\.\/design\//g, "design/");
    html = html.replace(/\.\.\/design\//g, "design/");

    // Token swap: tokens-PLACEHOLDER.css → tokens-<slug>.css
    html = html.replace(/tokens-PLACEHOLDER\.css/g, `tokens-${slug}.css`);

    // Copy injection — load whatever's in compositions/<slug>.copy.json and
    // splice into the placeholder strings the templates use. This is a
    // best-effort textual swap so we don't have to know each template's
    // structure deeply; the Copy supervisor's job is to populate the JSON
    // with sensible keys (hook, headline, support, benefits[], stat, etc.).
    let copy = {};
    try {
      copy = JSON.parse(fs.readFileSync(copyJsonPath, "utf8"));
    } catch {}
    html = applyCopyToTemplate(html, copy, resolved.name);

    fs.writeFileSync(indexPath, html);

    const note = resolved.fallbackFor
      ? `index.html (fallback ${resolved.name} for ${resolved.fallbackFor}; was: ${priorIndexLabel})`
      : `index.html (was: ${priorIndexLabel})`;
    return note;
  });

  // ----- Stage 6: quality gate --------------------------------------------
  await stage("quality gate", () => {
    const r = runNpm("check", [], { quiet: true });
    if (r.status === 0) {
      // Try to extract smoke pass count from stdout (best-effort).
      const out = r.stdout || "";
      const m = out.match(/(\d+)\/(\d+)\s+(?:checks?|smoke|tests?)/i);
      const tally = m ? `${m[1]}/${m[2]} pass` : "lint+smoke pass";
      return tally;
    }
    if (autoFix) {
      console.log("\n    ⓘ quality gate failed — running fix:apply…");
      runNpm("fix:apply", [], { quiet: false });
      const r2 = runNpm("check", [], { quiet: true });
      if (r2.status === 0) return "lint+smoke pass (after auto-fix)";
    }
    const tail = (r.stdout || r.stderr || "").trim().split("\n").slice(-12).join("\n");
    throw new Error(`quality gate failed (exit ${r.status})\n----\n${tail}`);
  });

  // ----- Stage 7: render --------------------------------------------------
  await stage("render", () => {
    if (skipRender) {
      return { output: `skipped (--no-render)`, soft: true };
    }
    const beforeFiles = listRendersDir();
    const r = runNpm("render", ["--watermark"], { quiet: false });
    if (r.status !== 0) {
      throw new Error(`render failed (exit ${r.status})`);
    }
    const afterFiles = listRendersDir();
    const newFiles = afterFiles.filter(f => !beforeFiles.includes(f));
    // Prefer the watermarked variant if multiple appeared.
    const final = newFiles.find(f => f.includes("-graded-wm"))
      || newFiles.find(f => f.includes("-graded"))
      || newFiles[newFiles.length - 1]
      || "(unknown)";
    return `renders/${final}`;
  });

  // ----- done -------------------------------------------------------------
  const totalMs = Date.now() - totalStart;
  console.log("");
  if (skipRender) {
    console.log(`✓ assembled + checked in ${fmtTime(totalMs)}.`);
    if (keepArtifacts) {
      console.log(`  inspect: ${path.join(projectRoot, "index.html")}`);
    }
  } else {
    // Find the freshest render to print as the open path.
    const latest = listRendersDir()
      .filter(f => f.endsWith(".mp4"))
      .map(f => ({ f, mtime: fs.statSync(path.join(projectRoot, "renders", f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0];
    if (latest) {
      console.log(`✓ done in ${fmtTime(totalMs)}. open: ${path.join(projectRoot, "renders", latest.f)}`);
    } else {
      console.log(`✓ done in ${fmtTime(totalMs)}.`);
    }
  }

} catch (err) {
  stageError = err;
  console.error("");
  console.error(`✗ pipeline failed at stage: ${err.stage || "(unknown)"}`);
  console.error(`  ${err.message}`);
} finally {
  // ALWAYS restore index.html — even on crash.
  restoreIndex();
}

if (stageError) process.exit(1);

// ===========================================================================
// helpers
// ===========================================================================

function listRendersDir() {
  const dir = path.join(projectRoot, "renders");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

function walkCount(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += walkCount(path.join(dir, e.name));
    else n += 1;
  }
  return n;
}

// Synthesize a placeholder copy.json from what new-comp.mjs already scraped
// (visible as a comment block in tokens-<slug>.css). Graceful degradation
// path for when extract-copy.mjs is unavailable. Schema mirrors the canonical
// extract-copy.mjs output so the assemble stage's injector is one-shot.
function synthesizeCopyFromTokens({ slug, seconds }) {
  const tokensPath = path.join(projectRoot, "design", `tokens-${slug}.css`);
  let title = slug;
  let tagline = "Welcome.";
  let logo = "";
  try {
    const css = fs.readFileSync(tokensPath, "utf8");
    title = (css.match(/Title:\s+([^\n]+)/) || [])[1]?.trim() || title;
    tagline = (css.match(/Tagline:\s+([^\n]+)/) || [])[1]?.trim() || tagline;
    logo = (css.match(/Logo URL:\s+([^\n]+)/) || [])[1]?.trim() || "";
    if (logo === "(none found)") logo = "";
  } catch {}

  const brandName = title.split(/[—\-|·]/)[0].trim().slice(0, 24);
  const ctaUrl = (() => {
    try { return new URL(logo || `https://${slug}.com`).hostname.replace(/^www\./, ""); }
    catch { return `${slug}.com`; }
  })();

  // Mirror extract-copy.mjs's COPY_SCHEMA so applyCopyToTemplate has one path.
  return {
    slug,
    url: logo || `https://${slug}.com`,
    title,
    template: "warm-community",
    seconds,
    narration: tagline,
    beats: [
      { kicker: brandName.toUpperCase(),  headline: tagline.slice(0, 80),                    body: "" },
      { kicker: "WHAT WE DO",             headline: "Built around how you actually work.",   body: "" },
      { kicker: "WHY IT MATTERS",         headline: "Simple, fast, yours.",                  body: "" },
      { kicker: "GET STARTED",            headline: `${brandName} — see for yourself.`,      body: "" },
    ],
    cta: { verb: "Try", url: ctaUrl, tagline: tagline.slice(0, 80) },
    meta: { generatedAt: new Date().toISOString().slice(0, 10), wordCount: tagline.split(/\s+/).length, beatCount: 4, _synthesized: true },
  };
}

// Apply copy.json to a structural template by replacing the textContent of
// known element IDs. Accepts the canonical extract-copy.mjs schema:
//   { slug, url, title, narration, beats: [{ kicker, headline, body }], cta }
// Templates use IDs like s1-hook, s1-headline, s1-supporting, s2-stat,
// s4-quote, s5-cta-verb, etc. Each shipped template uses a stable subset.
function applyCopyToTemplate(html, copy, templateName) {
  if (!copy || typeof copy !== "object") return html;

  const replaceText = (haystack, idAttr, newText) => {
    if (newText === undefined || newText === null || newText === "") return haystack;
    const escId = idAttr.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    // Match <tag id="..."[attrs]>text</tag> — text may contain inline tags
    // like <span>, so we use lazy-match-anything-then-closing-tag. Captures
    // the open tag, the body, and the matching close tag.
    const re = new RegExp(`(<([a-z]+[0-9]?)\\b[^>]*\\sid="${escId}"[^>]*>)([\\s\\S]*?)(</\\2>)`, "i");
    if (re.test(haystack)) {
      return haystack.replace(re, (_, open, _tag, _orig, close) => `${open}${escapeHtml(newText)}${close}`);
    }
    return haystack;
  };

  // --- pull out useful fields with sensible fallbacks ---------------------
  const beats = Array.isArray(copy.beats) ? copy.beats : [];
  const b = (i, key) => beats[i]?.[key] ?? "";
  const headlines = beats.map(x => x.headline).filter(Boolean);
  const bodies    = beats.map(x => x.body).filter(Boolean);

  const brandName = (copy.title || copy.slug || "").split(/[—\-|·:]/)[0].trim().slice(0, 24);
  const ctaUrl = copy.cta?.url || (() => {
    try { return new URL(copy.url || "").hostname.replace(/^www\./, ""); }
    catch { return ""; }
  })();
  const ctaVerb = copy.cta?.verb || "Try";

  // --- scene 1 (hook / hero) ---------------------------------------------
  // social-reel uses #s1-hook, hero-promo uses #s1-headline, case-study uses
  // #s1-headline + #s1-supporting. Cover all of them.
  const hookText = b(0, "headline") || headlines[0] || copy.narration?.split(".")[0] || "";
  html = replaceText(html, "s1-hook", hookText);
  html = replaceText(html, "s1-headline", hookText);
  html = replaceText(html, "s1-support", b(0, "body") || bodies[0] || "");
  html = replaceText(html, "s1-supporting", b(0, "body") || bodies[0] || "");
  html = replaceText(html, "s1-mark", brandName.toUpperCase());

  // --- scene 2 (punch / benefits / solution) ------------------------------
  html = replaceText(html, "s2-headline", b(1, "headline") || headlines[1] || "");
  html = replaceText(html, "s2-line", b(1, "body") || b(1, "headline") || bodies[1] || "");
  // Three-up benefits: pull single-word leaders out of headlines[1..3].
  const benefits = [headlines[1], headlines[2], headlines[3]]
    .filter(Boolean)
    .map(s => String(s).split(/\s+/)[0].replace(/[^A-Za-z]/g, ""))
    .filter(s => s && s.length <= 12);
  if (benefits[0]) html = replaceText(html, "s2-b1-title", benefits[0].toUpperCase());
  if (benefits[1]) html = replaceText(html, "s2-b2-title", benefits[1].toUpperCase());
  if (benefits[2]) html = replaceText(html, "s2-b3-title", benefits[2].toUpperCase());
  // Bullets in case-study scene 2.
  if (bodies[1]) html = replaceText(html, "s2-b1", bodies[1]);
  if (bodies[2]) html = replaceText(html, "s2-b2", bodies[2]);
  if (bodies[3]) html = replaceText(html, "s2-b3", bodies[3]);

  // --- scene 3 (stat / outcome) ------------------------------------------
  html = replaceText(html, "s3-headline", b(2, "headline") || headlines[2] || "");
  html = replaceText(html, "s3-line", b(2, "body") || bodies[2] || "");

  // --- scene 4 (quote / CTA depending on template) -----------------------
  // social-reel s4 = CTA wordmark + URL; case-study s4 = quote.
  html = replaceText(html, "s4-mark", brandName.toUpperCase());
  html = replaceText(html, "s4-url", ctaUrl);
  html = replaceText(html, "s4-cta-verb", ctaVerb);
  // Case-study quote.
  html = replaceText(html, "s4-quote", b(3, "headline") || copy.cta?.tagline || "");
  // (Don't overwrite attrib/role — placeholders are fine without copy data.)

  // --- scene 5 (case-study CTA) ------------------------------------------
  html = replaceText(html, "s5-cta-verb", ctaVerb);
  html = replaceText(html, "s5-url", ctaUrl);

  return html;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
