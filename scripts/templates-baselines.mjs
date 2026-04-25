// Generate stable visual baselines for every structural + vertical template.
//
// Reads every composition under compositions/templates/ and compositions/verticals/,
// rewrites relative `../../design/` paths and `tokens-PLACEHOLDER.css` to absolute
// file:// equivalents, loads each via Playwright file:// URL, seeks to each scene
// midpoint, and saves a screenshot.
//
// Output:
//   smoke/templates-baselines/<comp-slug>/<scene-id>-t<time>.png
//   docs/baselines-index.html — browseable grid of every baseline PNG
//   smoke/templates-baselines/skipped.txt — comps that failed to load
//
// Usage:
//   node scripts/templates-baselines.mjs
//   node scripts/templates-baselines.mjs --concurrency=4
//   node scripts/templates-baselines.mjs --filter=hero
//
// No live preview server required — uses file:// URLs with rewritten paths.

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- arg parsing ----------------------------------------------------------
const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const concurrency = +flags.concurrency || 4;
const filter = typeof flags.filter === "string" ? flags.filter : null;

// --- discover compositions ------------------------------------------------
const templatesDir = path.join(projectRoot, "compositions", "templates");
const verticalsDir = path.join(projectRoot, "compositions", "verticals");

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".html"))
    .map(f => path.join(dir, f));
}

const allCompositions = [...listHtml(templatesDir), ...listHtml(verticalsDir)]
  .filter(f => !filter || path.basename(f).includes(filter));

console.log(`▶ templates-baselines: ${allCompositions.length} compositions found`);

// --- output dirs ----------------------------------------------------------
const outDir = path.join(projectRoot, "smoke", "templates-baselines");
const docsDir = path.join(projectRoot, "docs");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

// --- token placeholder fallback -------------------------------------------
// Templates ship with `tokens-PLACEHOLDER.css` which doesn't exist. Substitute
// `tokens-kindred.css` (the only real tokens file) for baseline rendering.
const designDir = path.join(projectRoot, "design");
const fallbackTokens = path.join(designDir, "tokens-kindred.css");
if (!fs.existsSync(fallbackTokens)) {
  console.error("✗ design/tokens-kindred.css missing — cannot resolve tokens-PLACEHOLDER fallback");
  process.exit(1);
}
const fallbackTokensUrl = pathToFileURL(fallbackTokens).href;
const designUrl = pathToFileURL(designDir).href;

// --- HTML rewrite ---------------------------------------------------------
// Replace relative paths in the HTML so file:// loading works without a server.
// We write the rewritten HTML to a temp location alongside the source so any
// remaining relative URLs resolve correctly.
function rewriteHtml(source) {
  let html = fs.readFileSync(source, "utf8");

  // Resolve tokens-PLACEHOLDER → tokens-kindred (file:// absolute).
  html = html.replace(/(["'])([^"']*?)tokens-PLACEHOLDER\.css\1/g, `$1${fallbackTokensUrl}$1`);

  // Rewrite remaining ../../design/ and ../design/ refs to absolute file:// .
  html = html.replace(/(["'])\.\.\/\.\.\/design\//g, `$1${designUrl}/`);
  html = html.replace(/(["'])\.\.\/design\//g, `$1${designUrl}/`);

  return html;
}

// --- runtime page helpers (mirrors scripts/smoke.mjs) ---------------------
const APPLY_CLIP_VIS_FN = `(t) => {
  document.querySelectorAll(".clip").forEach(el => {
    const root = el.closest("[data-composition-id]");
    if (root === el) return;
    const start = parseFloat(el.dataset.start) || 0;
    const dur   = parseFloat(el.dataset.duration) || 0;
    el.style.display = (t >= start && t < start + dur) ? "" : "none";
  });
}`;

// --- per-composition worker -----------------------------------------------
async function captureComposition(browser, compPath) {
  const slug = path.basename(compPath, ".html");
  const compOutDir = path.join(outDir, slug);
  fs.mkdirSync(compOutDir, { recursive: true });

  // Write rewritten HTML to a tmp file inside the same directory so any
  // remaining relative refs (rare) still resolve.
  const tmpPath = path.join(path.dirname(compPath), `.baseline-tmp-${slug}.html`);
  const rewritten = rewriteHtml(compPath);
  fs.writeFileSync(tmpPath, rewritten);
  const fileUrl = pathToFileURL(tmpPath).href;

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", err => consoleErrors.push(err.message));
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

  const result = { slug, source: compPath, ok: false, captures: [], error: null, errors: [] };

  try {
    await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Wait for any timeline to register (script-driven setup may lag behind DOM ready).
    try {
      await page.waitForFunction(() => {
        return window.__timelines && Object.keys(window.__timelines).length > 0;
      }, { timeout: 8000 });
    } catch {
      // Some templates may not register; proceed but warn.
    }

    const probe = await page.evaluate(() => {
      const tlKey = window.__timelines ? Object.keys(window.__timelines)[0] : null;
      const tl = tlKey ? window.__timelines[tlKey] : null;
      const root = document.querySelector("[data-composition-id]");
      return {
        tlKey,
        tlChildren: tl ? tl.getChildren().length : 0,
        tlDuration: tl ? tl.duration() : 0,
        rootDims: root ? {
          cssW: parseInt(root.dataset.width)  || null,
          cssH: parseInt(root.dataset.height) || null,
        } : null,
        sceneIds: Array.from(document.querySelectorAll(".scene")).map(s => ({
          id: s.id,
          start: parseFloat(s.dataset.start) || 0,
          duration: parseFloat(s.dataset.duration) || 0,
        })),
      };
    });

    if (!probe.rootDims || !probe.rootDims.cssW || !probe.rootDims.cssH) {
      throw new Error("missing data-width/data-height on composition root");
    }
    if (!probe.sceneIds.length) {
      throw new Error("no .scene elements found");
    }

    const { cssW, cssH } = probe.rootDims;
    await page.setViewportSize({ width: cssW, height: cssH });

    // Inject helpers + pause CSS animations so screenshots are deterministic.
    await page.evaluate(`window.__applyClipVis = ${APPLY_CLIP_VIS_FN};`);
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-play-state: paused !important;
        transition-duration: 0s !important;
      }`,
    });

    for (const sc of probe.sceneIds) {
      const mid = sc.start + sc.duration / 2;
      await page.evaluate(({ t }) => {
        if (window.__timelines) {
          const key = Object.keys(window.__timelines)[0];
          const tl = key ? window.__timelines[key] : null;
          if (tl) { tl.pause(); tl.seek(t); }
        }
        if (typeof window.__applyClipVis === "function") window.__applyClipVis(t);
      }, { t: mid });
      await page.waitForTimeout(120); // allow paint

      const fileName = `${sc.id}-t${mid.toFixed(1)}.png`;
      const filePath = path.join(compOutDir, fileName);
      await page.screenshot({ path: filePath, type: "png" });
      result.captures.push({
        sceneId: sc.id,
        time: mid,
        path: filePath,
        relPath: path.relative(projectRoot, filePath).replace(/\\/g, "/"),
      });
    }

    result.ok = true;
    result.errors = consoleErrors.slice(0, 5);
    result.dims = { w: cssW, h: cssH };
    result.tlKey = probe.tlKey;
  } catch (err) {
    result.error = err.message;
    result.errors = consoleErrors.slice(0, 5);
  } finally {
    await page.close();
    await context.close();
    try { fs.unlinkSync(tmpPath); } catch {}
  }

  return result;
}

// --- run sweep ------------------------------------------------------------
const browser = await chromium.launch({ headless: true });
const t0 = Date.now();

const queue = [...allCompositions];
const results = [];

async function worker() {
  while (queue.length) {
    const next = queue.shift();
    if (!next) return;
    const slug = path.basename(next, ".html");
    process.stdout.write(`  · ${slug} ... `);
    try {
      const r = await captureComposition(browser, next);
      results.push(r);
      if (r.ok) {
        process.stdout.write(`✓ ${r.captures.length} scenes\n`);
      } else {
        process.stdout.write(`✗ ${r.error}\n`);
      }
    } catch (err) {
      results.push({ slug, source: next, ok: false, captures: [], error: err.message });
      process.stdout.write(`✗ unhandled: ${err.message}\n`);
    }
  }
}

const workers = Array.from({ length: Math.min(concurrency, allCompositions.length) }, () => worker());
await Promise.all(workers);

await browser.close();

// --- write skipped.txt ----------------------------------------------------
const skipped = results.filter(r => !r.ok);
const skippedFile = path.join(outDir, "skipped.txt");
if (skipped.length) {
  const lines = skipped.map(r =>
    `${r.slug}\t${r.error}${r.errors && r.errors.length ? `\n    console: ${r.errors.join(" | ").slice(0, 240)}` : ""}`,
  );
  fs.writeFileSync(skippedFile, lines.join("\n") + "\n");
} else if (fs.existsSync(skippedFile)) {
  fs.unlinkSync(skippedFile);
}

// --- write docs/baselines-index.html --------------------------------------
const totalPngs = results.reduce((n, r) => n + r.captures.length, 0);
const indexPath = path.join(docsDir, "baselines-index.html");
const indexHtml = renderIndexHtml(results, { generatedAt: new Date().toISOString(), totalPngs });
fs.writeFileSync(indexPath, indexHtml);

// --- summary --------------------------------------------------------------
const dt = ((Date.now() - t0) / 1000).toFixed(1);
const successCount = results.filter(r => r.ok).length;
console.log("");
console.log(`◇ attempted ${allCompositions.length} · success ${successCount} · skipped ${skipped.length} · ${totalPngs} PNGs (${dt}s)`);
console.log(`◇ index: ${path.relative(projectRoot, indexPath)}`);
if (skipped.length) {
  console.log(`◇ skipped list: ${path.relative(projectRoot, skippedFile)}`);
  for (const s of skipped) console.log(`    - ${s.slug}: ${s.error}`);
}

process.exit(skipped.length === 0 ? 0 : 1);

// -------------------------------------------------------------------------
function renderIndexHtml(rows, meta) {
  const ok = rows.filter(r => r.ok).sort((a, b) => a.slug.localeCompare(b.slug));
  const bad = rows.filter(r => !r.ok).sort((a, b) => a.slug.localeCompare(b.slug));

  const cards = ok.map(r => {
    const shots = r.captures.map(c => {
      // Index lives at docs/baselines-index.html; PNGs at smoke/templates-baselines/...
      // Relative path from docs/ to project root is "..".
      const href = "../" + c.relPath;
      return `
        <figure class="shot">
          <a href="${href}" target="_blank" rel="noopener">
            <img loading="lazy" src="${href}" alt="${esc(r.slug)} — ${esc(c.sceneId)}">
          </a>
          <figcaption>${esc(c.sceneId)} <span class="t">t=${c.time.toFixed(1)}s</span></figcaption>
        </figure>`;
    }).join("");
    return `
      <section class="comp">
        <header>
          <h2>${esc(r.slug)}</h2>
          <span class="meta">${r.dims ? `${r.dims.w}×${r.dims.h}` : ""} · ${r.captures.length} scene${r.captures.length === 1 ? "" : "s"}${r.tlKey ? ` · timeline <code>${esc(r.tlKey)}</code>` : ""}</span>
        </header>
        <div class="grid">${shots}</div>
      </section>`;
  }).join("");

  const skippedSection = bad.length ? `
    <section class="comp comp--skipped">
      <header><h2>Skipped (${bad.length})</h2><span class="meta">failed to load</span></header>
      <ul class="skipped">
        ${bad.map(r => `<li><b>${esc(r.slug)}</b><span>${esc(r.error || "unknown error")}</span></li>`).join("")}
      </ul>
    </section>` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Templates baselines · ${ok.length} compositions · ${meta.totalPngs} PNGs</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #0b0d10; color: #e6e8eb; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  body { padding: 32px 40px 80px; }
  header.page {
    display: flex; align-items: baseline; gap: 24px; flex-wrap: wrap;
    border-bottom: 1px solid #1c2026; padding-bottom: 16px; margin-bottom: 32px;
  }
  header.page h1 { font-size: 22px; margin: 0; font-weight: 600; letter-spacing: -0.01em; }
  header.page .stats { color: #8b95a3; font-size: 13px; font-variant-numeric: tabular-nums; }
  header.page .stats code { background: #161a20; padding: 2px 6px; border-radius: 4px; color: #d6dde6; }
  section.comp { margin: 0 0 40px; }
  section.comp > header { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin: 0 0 12px; padding: 6px 0 8px; border-bottom: 1px solid #161a20; }
  section.comp > header h2 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.005em; color: #f1f3f5; }
  section.comp > header .meta { color: #6b7684; font-size: 12px; font-variant-numeric: tabular-nums; }
  section.comp > header .meta code { background: #161a20; padding: 1px 5px; border-radius: 3px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
  .shot { margin: 0; background: #11141a; border: 1px solid #1c2026; border-radius: 8px; overflow: hidden; transition: border-color 0.15s; }
  .shot:hover { border-color: #2a313a; }
  .shot a { display: block; }
  .shot img { display: block; width: 100%; height: auto; aspect-ratio: 16/9; object-fit: cover; background: #0b0d10; }
  .shot figcaption { padding: 6px 10px 8px; font-size: 11px; color: #aab3bf; display: flex; justify-content: space-between; align-items: baseline; }
  .shot figcaption .t { color: #6b7684; font-variant-numeric: tabular-nums; }
  .comp--skipped { background: #1a1213; border: 1px solid #3a1d22; border-radius: 8px; padding: 16px 20px; }
  .comp--skipped > header h2 { color: #ff8b96; }
  ul.skipped { list-style: none; margin: 8px 0 0; padding: 0; font-size: 13px; }
  ul.skipped li { display: flex; gap: 12px; padding: 6px 0; border-bottom: 1px solid #2a1a1d; }
  ul.skipped li:last-child { border-bottom: 0; }
  ul.skipped b { color: #f1f3f5; min-width: 240px; }
  ul.skipped span { color: #c9909a; font-family: ui-monospace, monospace; font-size: 12px; }
  footer { margin-top: 48px; color: #6b7684; font-size: 12px; }
</style>
</head>
<body>
<header class="page">
  <h1>Templates baselines</h1>
  <span class="stats">
    <code>${ok.length}</code> compositions
    · <code>${meta.totalPngs}</code> PNGs
    ${bad.length ? ` · <code style="color:#ff8b96">${bad.length}</code> skipped` : ""}
    · generated ${esc(meta.generatedAt)}
  </span>
</header>
${cards}
${skippedSection}
<footer>Run <code>node scripts/templates-baselines.mjs</code> to regenerate.</footer>
</body>
</html>
`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}
