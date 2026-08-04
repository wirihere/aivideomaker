// Render a STILL IMAGE (PNG) from a composition at a given timestamp.
//
// Fills the gap: the factory only rendered video. For Pinterest, the IG feed,
// and the website you need static image posts — and every composition's scenes
// are already authored at known timestamps, so one composition can yield both a
// video (render.mjs) and several stills (this script) without re-authoring.
//
// Mechanism: a tiny static server rooted at projectRoot (so the composition's
// root-relative paths — design/cards.css, videos/<brand>/tokens.css, etc. —
// resolve exactly as they do in preview/render), then Playwright loads the
// composition file directly, seeks the GSAP timeline to the requested time,
// applies the renderer's clip-visibility logic (same as scripts/smoke.mjs), and
// screenshots the root element at its native data-width × data-height.
//
// Crucially this does NOT touch index.html — the composition is served by URL,
// so the active render entry point is never mutated. Safe to run any time.
//
// Usage:
//   node scripts/render-still.mjs --comp=<path> --at=<seconds>[,<seconds>...]
//
// Required:
//   --comp=<path>   composition .html (e.g. videos/binsparkle/compositions/binsparkle-customer.html)
//   --at=<seconds>  timestamp(s) to capture, comma-separated (e.g. 3.5 or 3.5,8,12)
//
// Optional:
//   --aspect=<w:h>  also produce a centre-cropped variant at this aspect
//                   (1:1, 4:5, 9:16, 2:3, 16:9) via the bundled ffmpeg
//   --out=<dir>     output directory (default: renders/<slug>)
//
// Output:
//   renders/<slug>/<angle>-t<seconds>.png                    (native size)
//   renders/<slug>/<angle>-t<seconds>-<W>x<H>.png            (cropped, with --aspect)
//
// Example:
//   node scripts/render-still.mjs \
//     --comp=videos/binsparkle/compositions/binsparkle-customer.html \
//     --at=3.5,9,15 --aspect=1:1

import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";
import { spawn } from "child_process";

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

function usage() {
  console.log(`render-still — capture a PNG from a composition at a timestamp

Usage:
  node scripts/render-still.mjs --comp=<path> --at=<seconds>[,<seconds>...] [options]

Required:
  --comp=<path>   composition .html under videos/<brand>/
  --at=<seconds>  timestamp(s), comma-separated (e.g. 3.5 or 3.5,8,12)

Optional:
  --aspect=<w:h>  also produce a centre-cropped variant (1:1, 4:5, 9:16, 2:3, 16:9)
  --out=<dir>     output directory (default: renders/<slug>)`);
}

const compRaw = typeof flags.comp === "string" ? flags.comp : null;
const atRaw = flags.at;
if (!compRaw || atRaw === undefined || atRaw === true) { usage(); process.exit(2); }

const compAbs = path.resolve(projectRoot, compRaw);
const compRel = path.relative(projectRoot, compAbs).replace(/\\/g, "/");
if (!compRel.startsWith("videos/") || !fs.existsSync(compAbs) || !compAbs.endsWith(".html")) {
  console.error("✗ --comp must be an existing .html composition under videos/<brand>/");
  process.exit(2);
}
const slugMatch = compRel.match(/^videos\/([^/]+)\//);
const slug = slugMatch ? slugMatch[1] : "aivideomaker";
const angleName = path.basename(compAbs, ".html");

const times = String(atRaw).split(",").map(s => parseFloat(s.trim())).filter(n => !Number.isNaN(n));
if (!times.length) { console.error("✗ no valid timestamps in --at"); process.exit(2); }

const aspectFlag = typeof flags.aspect === "string" ? flags.aspect : null;
if (aspectFlag && !/^\d+:\d+$/.test(aspectFlag)) {
  console.error(`✗ invalid --aspect="${aspectFlag}". Use W:H like 1:1, 4:5, 9:16, 2:3, 16:9.`);
  process.exit(2);
}
// Per-concept output folder by default: renders/<slug>/<concept>/ — so a
// concept's stills + video (render-comp) land together. Concept is derived
// from the comp filename by stripping "<slug>-" and "-video".
const concept = angleName.replace(new RegExp(`^${slug}-`), "").replace(/-video$/, "") || angleName;
const outDir = typeof flags.out === "string" ? path.resolve(projectRoot, flags.out) : path.join(projectRoot, "renders", slug, concept);

// --- minimal static server rooted at projectRoot -------------------------
// Root-relative paths in the composition (design/..., videos/<brand>/...,
// assets/...) resolve exactly as they do under hyperframes preview / render.
// Serves only files inside projectRoot (path-traversal guarded).

const CONTENT_TYPES = {
  ".html": "text/html;charset=utf-8", ".css": "text/css",
  ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".mp4": "video/mp4",
  ".webm": "video/webm", ".woff": "font/woff2", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".otf": "font/otf", ".vtt": "text/vtt", ".txt": "text/plain", ".md": "text/plain",
  ".csv": "text/csv",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const filePath = path.join(projectRoot, urlPath);
  const rel = path.relative(projectRoot, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); res.end("not found"); return; }
    const ext = path.extname(filePath).toLowerCase();
    // Compositions use project-root-relative paths (e.g. `design/vendor/gsap.min.js`,
    // no leading slash). Those only resolve when the document base IS the project
    // root — which is true when the comp is promoted to index.html and served by
    // hyperframes preview, but NOT when we serve the comp file from deep inside
    // /videos/<brand>/compositions/. Inject <base href="/"> so every relative
    // URL resolves from the project root, matching the render entry point.
    if (ext === ".html") {
      const html = fs.readFileSync(filePath, "utf8");
      const injected = /<head[^>]*>/i.test(html)
        ? html.replace(/<head([^>]*)>/i, "<head$1><base href=\"/\">")
        : `<base href="/">${html}`;
      const buf = Buffer.from(injected, "utf8");
      res.writeHead(200, { "Content-Type": "text/html;charset=utf-8", "Content-Length": buf.length });
      res.end(buf);
      return;
    }
    res.writeHead(200, { "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

// Renderer's clip-visibility logic (mirrors scripts/smoke.mjs): only the
// active scene at time t is shown, so the still matches the video frame.
const APPLY_CLIP_VIS_FN = `(t) => {
  document.querySelectorAll(".clip").forEach(el => {
    const root = el.closest("[data-composition-id]");
    if (root === el) return;
    const start = parseFloat(el.dataset.start) || 0;
    const dur   = parseFloat(el.dataset.duration) || 0;
    el.style.display = (t >= start && t < start + dur) ? "" : "none";
  });
}`;
// Freeze CSS animations so the capture is deterministic (same trick as smoke).
const PAUSE_CSS = `*, *::before, *::after { animation-play-state: paused !important; transition-duration: 0s !important; }`;

// --- main ----------------------------------------------------------------

const t0 = Date.now();
let browser;
try {
  fs.mkdirSync(outDir, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("pageerror", e => console.error("  pageerror:", e.message));

  await page.goto(`${base}/${compRel}`, { waitUntil: "load", timeout: 30000 });
  await page.waitForFunction(() => window.__timelines && Object.keys(window.__timelines).length > 0, { timeout: 10000 });
  await page.addStyleTag({ content: PAUSE_CSS });
  await page.evaluate(`window.__applyClipVis = ${APPLY_CLIP_VIS_FN};`);

  const dims = await page.evaluate(() => {
    const r = document.querySelector("[data-composition-id]");
    return r ? { w: parseInt(r.dataset.width) || 0, h: parseInt(r.dataset.height) || 0 } : null;
  });
  if (!dims || !dims.w || !dims.h) {
    throw new Error("no [data-composition-id] root with data-width/data-height — composition may be malformed");
  }
  const vw = dims.w, vh = dims.h;
  await page.setViewportSize({ width: vw, height: vh });

  const root = page.locator("[data-composition-id]");
  console.log(`▶ still: ${compRel} @ ${times.join(", ")}s (${vw}×${vh}) → ${path.relative(projectRoot, outDir)}`);

  for (const t of times) {
    await page.evaluate((tt) => {
      const tl = window.__timelines[Object.keys(window.__timelines)[0]];
      if (tl) { tl.pause(); tl.seek(tt); }
      window.__applyClipVis(tt);
    }, t);
    await page.waitForTimeout(140); // allow one paint

    const file = path.join(outDir, `${angleName}-t${t.toFixed(1)}.png`);
    await root.screenshot({ path: file });
    console.log(`✓ ${path.relative(projectRoot, file)}`);

    if (aspectFlag) {
      const [aw, ah] = aspectFlag.split(":").map(Number);
      // centre-crop to target aspect (cover): pick the largest W×H at aw:ah that fits.
      let cw, ch;
      if (vw / vh > aw / ah) { ch = vh; cw = Math.round(vh * aw / ah); }
      else                    { cw = vw; ch = Math.round(vw * ah / aw); }
      const cropped = file.replace(/\.png$/, `-${aw}x${ah}.png`);
      const ffmpegBin = await getFfmpegPath();
      await new Promise((res, rej) => {
        const p = spawn(ffmpegBin, ["-y", "-loglevel", "error", "-i", file, "-vf", `crop=${cw}:${ch}`, "-frames:v", "1", cropped], { cwd: projectRoot });
        p.on("close", c => c === 0 ? res() : rej(new Error(`ffmpeg crop exited ${c}`)));
        p.on("error", rej);
      });
      console.log(`✓ ${path.relative(projectRoot, cropped)}`);
    }
  }
  console.log(`✓ done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} catch (err) {
  console.error("✗", err.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  server.close();
}
