// frame-flipbook.mjs — extract frames from the assembled index.html at
// per-scene timestamps for human/agent review BEFORE render.
//
// Per docs/PROCESS.md cycle step 2: "Frame-flipbook check (Playwright scrub
// 0.5s intervals, every adjacent pair must show visible motion)". This is
// the gate that ran post-hoc on kinetic-product-30s and caught the
// s5-name-block selector bug. Promoting it to a first-class orchestrator
// stage so it runs by default before render, not after the user finds bugs.
//
// Usage:
//   node scripts/frame-flipbook.mjs                       # default index.html
//   node scripts/frame-flipbook.mjs --comp=path/to.html
//   node scripts/frame-flipbook.mjs --slug=resurgence-indigo
//   node scripts/frame-flipbook.mjs --times=2,5,10,15,20,25,28
//
// Output: tmp/<slug>-frames-<stamp>/t<NN>.png (one per timestamp).
//         Prints paths + per-frame element-snapshot to stdout.
//
// Default times: 7 samples spread across the comp duration, biased toward
// the moments where text/visuals settle (mid-scene, post-entrance).

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const compPath = flags.comp
  ? path.resolve(projectRoot, flags.comp)
  : path.join(projectRoot, "index.html");
if (!fs.existsSync(compPath)) {
  console.error(`✗ comp not found: ${compPath}`);
  process.exit(2);
}

const slug = flags.slug
  ? String(flags.slug)
  : path.basename(compPath, ".html").replace(/^index$/, "comp");

const stamp = (new Date()).toISOString().slice(0, 19).replace(/[:T]/g, "-");
const outDir = path.join(projectRoot, "tmp", `${slug}-frames-${stamp}`);
fs.mkdirSync(outDir, { recursive: true });

// Default times: 7 spread samples — per `docs/playbooks/cinematic-vertical-promo.md`
// frame-verification list. Caller can override via --times=...
const defaultTimes = [2.5, 7.5, 11, 16, 21, 25.5, 28.5];
const times = flags.times
  ? String(flags.times).split(",").map(s => parseFloat(s.trim())).filter(Number.isFinite)
  : defaultTimes;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1080, height: 1920 } });
const page = await context.newPage();
const fileUrl = pathToFileURL(compPath).href;

await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
await page.waitForFunction(
  () => window.__timelines && Object.keys(window.__timelines).length > 0,
  { timeout: 8000 }
);
const tlKey = await page.evaluate(() => Object.keys(window.__timelines)[0]);

const fps = [];
for (const t of times) {
  await page.evaluate(({ tlKey, t }) => {
    const tl = window.__timelines[tlKey];
    tl.pause();
    tl.seek(t);
    document.querySelectorAll(".clip").forEach(el => {
      const root = el.closest("[data-composition-id]");
      if (root === el) return;
      const start = parseFloat(el.dataset.start) || 0;
      const dur = parseFloat(el.dataset.duration) || 0;
      el.style.display = (t >= start && t < start + dur) ? "" : "none";
    });
  }, { tlKey, t });
  await page.waitForTimeout(120);
  const out = path.join(outDir, `t${String(t).padStart(5, "0")}.png`);
  await page.screenshot({ path: out, fullPage: false });
  const fp = await page.evaluate(() => {
    const visScene = ["s1", "s2", "s3", "s4", "s5", "s6"]
      .find(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        const cs = getComputedStyle(el);
        return cs.display !== "none" && parseFloat(cs.opacity) > 0.05;
      });
    const txt = (id) => (document.getElementById(id)?.innerText || "").trim().replace(/\s+/g, " ").slice(0, 50);
    if (!visScene) return "(no scene visible)";
    return `${visScene} · ${txt(visScene)}`;
  });
  fps.push({ t, out, fp });
}
await browser.close();

const relDir = path.relative(projectRoot, outDir).replace(/\\/g, "/");
console.log(`◇ frame-flipbook · ${slug} · ${fps.length} frames in ${relDir}/`);
for (const f of fps) {
  const rel = path.relative(projectRoot, f.out).replace(/\\/g, "/");
  console.log(`  t=${f.t}s  ${rel}`);
  console.log(`         ${f.fp}`);
}
console.log("");
console.log("Per docs/PROCESS.md, READ each frame before approving the render.");
