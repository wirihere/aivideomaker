#!/usr/bin/env node
// Music library catalog — search Pixabay (and optionally Freesound) for tracks
// matching a vibe, download samples, extract metadata (duration, peak amplitude,
// BPM where available), and write a JSON index + visual HTML page.
//
// This COMPLEMENTS scripts/pick-music.mjs: this script BUILDS a catalog
// (assets/music/.catalog/<vibe>.json), pick-music READS curated shortlists.
//
// Integration path (deferred — ship this independently first):
//   - scripts/pick-music.mjs reads assets/music-shortlists/<vibe>.json today.
//   - Once stable, pick-music can fall back to assets/music/.catalog/<vibe>.json
//     when the curated shortlist is missing. The schema bridge is small:
//       catalog: { id, title, mp3, durationSec, bpm, source }
//       shortlist: { slug, title, url, duration, bpm, local_file }
//     Map id→slug, durationSec→duration, mp3→local_file inside loadShortlist().
//
// Usage:
//   node scripts/music-library.mjs --vibe=kinetic-pop --list
//   node scripts/music-library.mjs --vibe=kinetic-pop --count=3
//   node scripts/music-library.mjs --vibe=quiet-premium --bpm-min=60 --bpm-max=90
//   node scripts/music-library.mjs --vibe=warm-community --mood=uplifting --freesound
//
// Output:
//   assets/music/.catalog/<vibe>.json
//   assets/music/.catalog/<vibe>.html
//   assets/music/.catalog/tracks/<source>-<id>.mp3

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { chromium } from "playwright";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";
import { check, record } from "./lib/usage.mjs";
import { getFfmpegPath } from "./lib/ffmpeg-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const VIBE_QUERIES = {
  "kinetic-pop":     ["upbeat pop", "energetic electronic", "uplifting dance"],
  "quiet-premium":   ["cinematic ambient", "elegant piano", "atmospheric calm"],
  "warm-community":  ["folk acoustic", "warm guitar", "uplifting acoustic"],
  "documentary":     ["documentary cinematic", "thoughtful piano", "narrative score"],
  "tech-trailer":    ["epic trailer", "tech beat", "futuristic synth"],
  "hopeful-rise":    ["hopeful inspiring", "motivational uplifting", "rising piano"],
  "tense-hook":      ["cinematic tension", "dark suspense", "dramatic riser"],
  "playful-spot":    ["playful upbeat", "quirky bouncy", "happy ukulele"],
};

function parseArgs(argv) {
  const out = { vibe: null, mood: null, bpmMin: null, bpmMax: null, count: 5, freesound: false, list: false, help: false };
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, k, v] = m;
    if (k === "vibe") out.vibe = v || null;
    else if (k === "mood") out.mood = v || null;
    else if (k === "bpm-min") out.bpmMin = v ? Number(v) : null;
    else if (k === "bpm-max") out.bpmMax = v ? Number(v) : null;
    else if (k === "count") out.count = v ? Math.max(1, Number(v)) : 5;
    else if (k === "freesound") out.freesound = true;
    else if (k === "list") out.list = true;
    else if (k === "help" || k === "h") out.help = true;
  }
  return out;
}

function printHelp() {
  process.stdout.write(
    "Usage: node scripts/music-library.mjs --vibe=<vibe> [--mood=<mood>] " +
    "[--bpm-min=N] [--bpm-max=N] [--count=N] [--freesound] [--list]\n\n" +
    "Vibes: " + Object.keys(VIBE_QUERIES).join(", ") + "\n"
  );
}

// Read duration + peak amplitude from a local mp3 via ffprobe/ffmpeg.
async function extractMetadata(mp3Path) {
  const ffmpegBin = await getFfmpegPath();
  const ffprobeBin = ffmpegBin.replace(/ffmpeg(\.exe)?$/i, (_, ext) => `ffprobe${ext || ""}`);
  let durationSec = null, peakDb = null;
  try {
    const r = spawnSync(ffprobeBin, ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", mp3Path], { encoding: "utf8" });
    if (r.status === 0) {
      const n = parseFloat((r.stdout || "").trim());
      if (Number.isFinite(n)) durationSec = Math.round(n);
    }
  } catch {}
  if (durationSec == null) {
    try {
      const r = spawnSync(ffmpegBin, ["-i", mp3Path, "-f", "null", "-"], { encoding: "utf8" });
      const m = ((r.stderr || "") + (r.stdout || "")).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (m) durationSec = Math.round(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]));
    } catch {}
  }
  try {
    const r = spawnSync(ffmpegBin, ["-i", mp3Path, "-af", "volumedetect", "-vn", "-sn", "-dn",
      "-f", "null", "-"], { encoding: "utf8" });
    const m = ((r.stderr || "") + (r.stdout || "")).match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
    if (m) peakDb = Number(m[1]);
  } catch {}
  return { durationSec, peakDb };
}

// Visit a Pixabay music search results page, return up to `count` tracks.
async function scrapePixabay(page, query, count) {
  const url = `https://pixabay.com/music/search/${encodeURIComponent(query)}/`;
  console.log(`[catalog] Pixabay search: ${url}`);
  const mp3Urls = new Set();
  const onResp = (r) => { const u = r.url(); if (u.includes(".mp3") || u.includes("audio/mpeg")) mp3Urls.add(u); };
  page.on("response", onResp);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    try {
      const btn = page.getByRole("button", { name: /accept|agree|got it|consent|ok/i });
      if (await btn.isVisible({ timeout: 2500 })) await btn.click();
    } catch {}
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const rawTracks = await page.evaluate(() => {
      const out = []; const seen = new Set();
      const anchors = Array.from(document.querySelectorAll('a[href*="/music/"]'));
      for (const a of anchors) {
        const href = a.getAttribute("href") || "";
        const m = href.match(/\/music\/[^\/]*-(\d+)\/?$/);
        if (!m) continue;
        const id = m[1];
        if (seen.has(id)) continue;
        seen.add(id);
        let title = a.getAttribute("aria-label") || a.getAttribute("title") || a.textContent || "";
        title = title.trim().replace(/\s+/g, " ");
        let row = a;
        for (let i = 0; i < 6 && row && row !== document.body; i++) row = row.parentElement;
        const rowText = row ? row.textContent || "" : "";
        let durationSec = null;
        const dm = rowText.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
        if (dm) {
          const h = Number(dm[1]), mn = Number(dm[2]), sc = dm[3] ? Number(dm[3]) : null;
          durationSec = sc != null ? h * 3600 + mn * 60 + sc : h * 60 + mn;
        }
        let bpm = null;
        const bm = rowText.match(/(\d{2,3})\s*bpm\b/i) || rowText.match(/\bbpm\s*(\d{2,3})\b/i);
        if (bm) bpm = Number(bm[1]);
        let mp3 = null;
        const audio = row && row.querySelector ? row.querySelector("audio") : null;
        if (audio && audio.src) mp3 = audio.src;
        out.push({ id, title: title || `track-${id}`, pageUrl: new URL(href, location.origin).toString(), mp3, durationSec, bpm });
      }
      return out;
    });

    // Filter to anchors that are actually visible on the page (the raw selector
    // matches nav/footer links too). Pixabay's modern layout uses CSS-module
    // class names (e.g. triggerButton--LCHJn), so we walk the DOM by structure
    // rather than relying on aria-label, which the search-results layout omits.
    const visibleIds = new Set(await page.evaluate(() => {
      const out = [];
      for (const a of document.querySelectorAll('a[href*="/music/"]')) {
        const m = (a.getAttribute("href") || "").match(/\/music\/[^\/]*-(\d+)\/?$/);
        if (!m) continue;
        const r = a.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        out.push(m[1]);
      }
      return out;
    }));
    const picked = rawTracks.filter((t) => t.id && t.title && visibleIds.has(t.id)).slice(0, count);

    // Click the play button inside each track row to trigger MP3 lazy-load.
    // The network-side `mp3Urls` capture set picks up the audio URL for each.
    for (const t of picked) {
      if (t.mp3) continue;
      const before = mp3Urls.size;
      try {
        await page.evaluate((id) => {
          for (const a of document.querySelectorAll('a[href*="/music/"]')) {
            if ((a.getAttribute("href") || "").includes(`-${id}`)) {
              let row = a;
              while (row && row.parentElement) {
                row = row.parentElement;
                if (row.tagName === "LI" || (row.querySelector && row.querySelector("button"))) break;
              }
              const btn = row && row.querySelector ? row.querySelector("button") : null;
              if (btn) { btn.click(); return; }
            }
          }
        }, t.id);
        // Wait briefly for the network response.
        for (let w = 0; w < 12 && mp3Urls.size === before; w++) await page.waitForTimeout(250);
      } catch {}
    }

    if (mp3Urls.size > 0) {
      // Pixabay audio URLs are opaque (audio_<hash>.mp3) so per-id matching
      // isn't reliable. Assign captured URLs to picked tracks in the order they
      // arrived — same order we clicked them.
      const urls = [...mp3Urls];
      let idx = 0;
      for (const t of picked) if (!t.mp3 && idx < urls.length) t.mp3 = urls[idx++];
    }
    return picked;
  } finally {
    page.off("response", onResp);
  }
}

async function searchFreesound(query, count) {
  const KEY = process.env.FREESOUND_API_KEY;
  if (!KEY) { console.warn("[catalog] --freesound skipped: FREESOUND_API_KEY not set."); return []; }
  const status = check("freesound", 1);
  if (!status.allowed) { console.error(`[catalog] Freesound rate limit: ${status.message}`); return []; }
  const url = `https://freesound.org/apiv2/search/text/?` + new URLSearchParams({
    query, page_size: String(count), fields: "id,name,duration,previews,tags,bpm,username", token: KEY,
  });
  try {
    const res = await fetch(url);
    record("freesound", 1);
    if (!res.ok) throw new Error(`Freesound HTTP ${res.status}`);
    const json = await res.json();
    return (json.results || []).slice(0, count).map((r) => ({
      id: String(r.id), title: r.name,
      pageUrl: `https://freesound.org/people/${r.username}/sounds/${r.id}/`,
      mp3: (r.previews && (r.previews["preview-hq-mp3"] || r.previews["preview-lq-mp3"])) || null,
      durationSec: r.duration ? Math.round(r.duration) : null,
      bpm: r.bpm || null, tags: r.tags || [],
    }));
  } catch (err) { console.error(`[catalog] Freesound search failed: ${err.message}`); return []; }
}

// Cache key per spec: music|<vibe>|<query>|<page>|<index>
async function downloadTrack({ source, vibe, query, pageNum, index, mp3Url, ctx, tracksDir, id }) {
  if (!mp3Url) return null;
  const key = cacheKey(`music|${vibe}|${query}|${pageNum}|${index}`);
  const safeId = String(id).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const outName = `${source}-${safeId}.mp3`;
  const outPath = path.join(tracksDir, outName);
  const hit = await cacheGet(key);
  if (hit) {
    fs.copyFileSync(hit, outPath);
    console.log(`[catalog]   [cache hit] ${outName}`);
    return outPath;
  }
  try {
    let buf;
    if (ctx) {
      const resp = await ctx.request.get(mp3Url, {
        headers: { Referer: `https://pixabay.com/music/search/${encodeURIComponent(query)}/` },
      });
      if (!resp.ok()) throw new Error(`HTTP ${resp.status()}`);
      buf = await resp.body();
    } else {
      const resp = await fetch(mp3Url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      buf = Buffer.from(await resp.arrayBuffer());
    }
    fs.writeFileSync(outPath, buf);
    await cachePut(key, buf, ".mp3");
    console.log(`[catalog]   [downloaded] ${outName} (${(buf.length / 1024).toFixed(1)} KB)`);
    return outPath;
  } catch (err) {
    console.warn(`[catalog]   download failed for ${id}: ${err.message}`);
    return null;
  }
}

// Combine scrape result + local download + ffprobe metadata into a catalog row.
async function enrichTrack(t, source, args, query, ti, ctx, tracksDir) {
  const localPath = await downloadTrack({
    source, vibe: args.vibe, query, pageNum: 1, index: ti,
    mp3Url: t.mp3, ctx, tracksDir, id: t.id,
  });
  let durationSec = t.durationSec, peakDb = null;
  if (localPath && fs.existsSync(localPath)) {
    const meta = await extractMetadata(localPath);
    if (meta.durationSec) durationSec = meta.durationSec;
    peakDb = meta.peakDb;
  }
  return {
    id: t.id, title: t.title, source,
    url: t.pageUrl,
    mp3: localPath ? path.relative(projectRoot, localPath).replace(/\\/g, "/") : t.mp3,
    durationSec: durationSec ?? null,
    peakDb, bpm: t.bpm ?? null,
    mood: args.mood || null, query, tags: t.tags || [],
  };
}

const HTML_CSS = `:root{color-scheme:dark;--bg:#0E0E12;--card:#14141B;--paper:#FBF9F6;--soft:#B6B0A6;--accent:#1A9E8F;--border:rgba(255,255,255,0.08)}body{background:var(--bg);color:var(--paper);font:15px/1.5 -apple-system,Segoe UI,system-ui,sans-serif;margin:0;padding:32px}header{max-width:1100px;margin:0 auto 24px}h1{margin:0 0 8px;font-size:28px;letter-spacing:-0.02em}.sub{color:var(--soft);margin:0 0 16px}.queries{font-family:ui-monospace,Consolas,monospace;color:var(--accent);font-size:13px}table{width:100%;max-width:1100px;margin:0 auto;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden;border:1px solid var(--border)}th,td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--border);vertical-align:middle}th{background:rgba(255,255,255,0.03);color:var(--soft);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.04em}tr:last-child td{border-bottom:none}.num{color:var(--soft);width:32px}.title{font-weight:600}.meta{color:var(--soft);font-size:13px;margin-top:2px}.tags{margin-top:6px}.tag{background:rgba(26,158,143,0.12);border:1px solid rgba(26,158,143,0.25);color:var(--accent);padding:2px 8px;border-radius:999px;font-size:11px;margin-right:4px}.dur{font-family:ui-monospace,Consolas,monospace;color:var(--soft);white-space:nowrap}audio{max-width:240px}.copy-btn{background:var(--accent);color:#0E0E12;border:none;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer;font-size:13px}.copy-btn:hover{filter:brightness(1.1)}.copy-btn.copied{background:#FBF9F6}`;

function renderHtml(payload) {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rows = payload.tracks.map((t, i) => {
    const dur = t.durationSec ?? 0;
    const snippet = `<audio src="${t.mp3 || ""}" class="clip" data-start="0" data-duration="${dur}" data-track-index="0"></audio>`;
    return `<tr>
      <td class="num">${i + 1}</td>
      <td><div class="title">${esc(t.title)}</div>
        <div class="meta">${esc(t.source)} · id ${esc(t.id)} · ${t.bpm ? esc(t.bpm) + " BPM" : "BPM ?"} · ${t.peakDb != null ? t.peakDb + " dB peak" : ""}</div>
        <div class="tags">${(t.tags || []).map((g) => `<span class="tag">${esc(g)}</span>`).join(" ")}</div></td>
      <td class="dur">${dur ? esc(dur) + "s" : "?"}</td>
      <td><audio controls preload="none" src="${esc(t.mp3 || "")}"></audio></td>
      <td><button class="copy-btn" data-snippet="${esc(snippet)}">Copy &lt;audio&gt;</button></td>
    </tr>`;
  }).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Music catalog — ${esc(payload.vibe)}</title>
<style>${HTML_CSS}</style></head><body>
<header><h1>Music catalog · ${esc(payload.vibe)}</h1>
<p class="sub">${payload.tracks.length} track${payload.tracks.length === 1 ? "" : "s"} from ${esc(payload.queries.join(", "))}</p>
<p class="queries">queries: ${payload.queries.map((q) => esc(q)).join(" | ")}</p></header>
<table><thead><tr><th></th><th>Track</th><th>Duration</th><th>Preview</th><th>Use</th></tr></thead>
<tbody>${rows}</tbody></table>
<script>
document.querySelectorAll(".copy-btn").forEach((b) => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(b.dataset.snippet); b.classList.add("copied"); b.textContent = "Copied!"; setTimeout(() => { b.classList.remove("copied"); b.textContent = "Copy <audio>"; }, 1500); }
  catch (e) { alert("Copy failed: " + e.message); }
}));
</script></body></html>
`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); process.exit(0); }
  if (!args.vibe) { console.error("[catalog] ERROR: --vibe is required"); printHelp(); process.exit(2); }
  if (!VIBE_QUERIES[args.vibe]) {
    console.error(`[catalog] ERROR: unknown vibe "${args.vibe}". Valid: ${Object.keys(VIBE_QUERIES).join(", ")}`);
    process.exit(2);
  }

  const queries = VIBE_QUERIES[args.vibe].map((q) => args.mood ? `${q} ${args.mood}` : q);
  console.log(`[catalog] vibe=${args.vibe} count=${args.count} queries=${queries.length}`);
  for (const q of queries) console.log(`[catalog]   - "${q}"`);

  if (args.list) {
    console.log("[catalog] --list set; exiting before any API call.");
    process.exit(0);
  }

  const catalogDir = path.join(projectRoot, "assets", "music", ".catalog");
  const tracksDir = path.join(catalogDir, "tracks");
  fs.mkdirSync(tracksDir, { recursive: true });

  const rateStatus = check("pixabay-scrape", queries.length);
  if (!rateStatus.allowed) {
    console.error(`[catalog] Pixabay rate limit: ${rateStatus.message}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1400, height: 900 },
  });
  const page = await ctx.newPage();
  const allTracks = [];

  try {
    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];
      console.log(`[catalog] [${qi + 1}/${queries.length}] "${q}"`);
      let scraped = [];
      try {
        scraped = await scrapePixabay(page, q, args.count);
        record("pixabay-scrape", 1);
      } catch (err) {
        console.warn(`[catalog]   scrape failed: ${err.message}`);
        continue;
      }
      for (let ti = 0; ti < scraped.length; ti++) {
        allTracks.push(await enrichTrack(scraped[ti], "pixabay", args, q, ti, ctx, tracksDir));
      }
    }

    if (args.freesound) {
      for (const q of queries) {
        const fsResults = await searchFreesound(q, args.count);
        for (let ti = 0; ti < fsResults.length; ti++) {
          allTracks.push(await enrichTrack(fsResults[ti], "freesound", args, q, ti, null, tracksDir));
        }
      }
    }
  } finally {
    await browser.close();
  }

  // Filters: BPM null passes through; only known-BPM rows are gated.
  let filtered = allTracks;
  if (args.bpmMin != null) filtered = filtered.filter((t) => t.bpm == null || t.bpm >= args.bpmMin);
  if (args.bpmMax != null) filtered = filtered.filter((t) => t.bpm == null || t.bpm <= args.bpmMax);

  const seen = new Set();
  filtered = filtered.filter((t) => {
    const k = `${t.source}|${t.id}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  filtered.sort((a, b) => {
    const da = a.durationSec ?? Number.MAX_SAFE_INTEGER;
    const db = b.durationSec ?? Number.MAX_SAFE_INTEGER;
    if (da !== db) return da - db;
    return String(a.id).localeCompare(String(b.id));
  });

  const payload = {
    vibe: args.vibe, mood: args.mood || null,
    bpmRange: [args.bpmMin, args.bpmMax],
    queries, tracks: filtered,
  };

  const jsonPath = path.join(catalogDir, `${args.vibe}.json`);
  const htmlPath = path.join(catalogDir, `${args.vibe}.html`);
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n");
  fs.writeFileSync(htmlPath, renderHtml(payload));

  console.log(`[catalog] Wrote ${filtered.length} track${filtered.length === 1 ? "" : "s"}`);
  console.log(`[catalog]   ${path.relative(projectRoot, jsonPath)}`);
  console.log(`[catalog]   ${path.relative(projectRoot, htmlPath)}`);
}

main().catch((err) => {
  console.error(`[catalog] FATAL: ${err.message}`);
  process.exit(1);
});
