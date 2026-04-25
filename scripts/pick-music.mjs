#!/usr/bin/env node
// Music auto-pick supervisor — reads a curated shortlist JSON for a given template
// and returns ranked Pixabay music URLs that fit the template's vibe.
//
// Shortlists live at: assets/music-shortlists/<template>.json
// Schema (per file):
//   {
//     "template": "warm-community",
//     "vibe": "organic, soft, mid-tempo, no lyrics",
//     "bpm_range": [80, 100],
//     "default_volume": 0.18,
//     "search_keywords": [...],
//     "tracks": [
//       { "slug": "...", "title": "...", "url": "...", "duration": 213, "bpm": 88,
//         "tags": [...], "character": "...", "best_for": "...",
//         "local_file": "assets/music/...mp3"  // optional, set if already downloaded
//       },
//       ...
//     ]
//   }
//
// Usage:
//   node scripts/pick-music.mjs --template=warm-community
//   node scripts/pick-music.mjs --template=kinetic-pop --seconds=30
//   node scripts/pick-music.mjs --template=documentary --download
//
// Flags:
//   --template=<name>   (required)  warm-community | kinetic-pop | documentary | quiet-premium
//   --seconds=N         (optional)  filter to tracks where duration >= N + 5s buffer
//   --top=N             (optional)  return at most N tracks (default 5)
//   --download          (optional)  download the top pick into assets/music/<slug>.mp3
//                                   via scripts/fetch-pixabay-music.mjs (only this one)
//   --json              (optional)  emit the result list as JSON only (no human prose)
//
// Exit codes:
//   0 = at least one track returned
//   1 = no tracks (bad template, no shortlist, or all filtered out)
//   2 = invalid CLI usage
//
// Design notes:
//   - This script does NOT auto-download in default flow — that consumes Pixabay quota.
//     Only when `--download` is explicitly passed do we shell out to the fetcher.
//   - Ranking heuristic (currently simple): tracks with a `local_file` that exists on
//     disk float to the top (already auditioned + downloaded), then by index in JSON
//     (curator order = preferred order). Future: incorporate audition signal, BPM
//     match against a brief, listener feedback.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const VALID_TEMPLATES = ["warm-community", "kinetic-pop", "documentary", "quiet-premium"];

// --- Argument parsing --------------------------------------------------------
function parseArgs(argv) {
  const out = { template: null, seconds: null, top: 5, download: false, json: false };
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (!m) continue;
    const [, key, val] = m;
    switch (key) {
      case "template":
        out.template = val || null;
        break;
      case "seconds":
        out.seconds = val ? Number(val) : null;
        break;
      case "top":
        out.top = val ? Number(val) : 5;
        break;
      case "download":
        out.download = true;
        break;
      case "json":
        out.json = true;
        break;
      case "help":
      case "h":
        out.help = true;
        break;
      default:
        // ignore unknown flags rather than fail — keeps the CLI tolerant
        break;
    }
  }
  return out;
}

function printHelp() {
  process.stdout.write(
    "Usage: node scripts/pick-music.mjs --template=<name> [--seconds=N] [--top=N] [--download] [--json]\n" +
    "\n" +
    "Templates: " + VALID_TEMPLATES.join(", ") + "\n" +
    "\n" +
    "Examples:\n" +
    "  node scripts/pick-music.mjs --template=warm-community\n" +
    "  node scripts/pick-music.mjs --template=kinetic-pop --seconds=30\n" +
    "  node scripts/pick-music.mjs --template=documentary --download\n"
  );
}

// --- Shortlist load ----------------------------------------------------------
function loadShortlist(template) {
  const file = path.join(projectRoot, "assets", "music-shortlists", `${template}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Shortlist not found: ${file}`);
  }
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (err) {
    throw new Error(`Failed to read ${file}: ${err.message}`);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${file}: ${err.message}`);
  }
  if (!data.template || data.template !== template) {
    throw new Error(`Template mismatch in ${file}: expected "${template}" got "${data.template}"`);
  }
  if (!Array.isArray(data.tracks) || data.tracks.length === 0) {
    throw new Error(`No tracks defined in ${file}`);
  }
  return data;
}

// --- Ranking ----------------------------------------------------------------
// 1. Tracks whose local_file exists on disk first (already auditioned + downloaded)
// 2. Tracks with a direct Pixabay music page URL (deterministic fetch) before
//    search-page URLs (search rerank risk).
// 3. Otherwise preserve curator order (index in JSON).
function rankTracks(tracks) {
  const isDirectMusicUrl = (u) =>
    typeof u === "string" && /^https?:\/\/(?:www\.)?pixabay\.com\/music\/[^/]+-\d+\/?$/i.test(u);
  const isCdnAudio = (u) => typeof u === "string" && /^https?:\/\/cdn\.pixabay\.com\/audio\//i.test(u);
  const isSearchUrl = (u) => typeof u === "string" && /pixabay\.com\/music\/search\//i.test(u);

  return tracks
    .map((t, idx) => {
      let score = 0;
      if (t.local_file) {
        const abs = path.isAbsolute(t.local_file)
          ? t.local_file
          : path.join(projectRoot, t.local_file);
        if (fs.existsSync(abs)) score += 1000;
      }
      if (isCdnAudio(t.url)) score += 500;
      if (isDirectMusicUrl(t.url)) score += 250;
      if (isSearchUrl(t.url)) score += 50;
      // Curator order — earlier in the JSON is preferred. Encode as a small bonus
      // (so it only matters as a tiebreaker, not over the URL-type signals).
      score += Math.max(0, 20 - idx);
      return { track: t, score, idx };
    })
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .map((entry) => entry.track);
}

// --- Filtering --------------------------------------------------------------
// Filter: track must be at least seconds + 5s buffer (lets you fade out cleanly).
// Tracks with no `duration` are passed through (we can't filter what we don't know).
function filterByDuration(tracks, seconds) {
  if (!seconds || !Number.isFinite(seconds)) return tracks;
  const minDur = seconds + 5;
  return tracks.filter((t) => !t.duration || t.duration >= minDur);
}

// --- Download (delegated to existing fetcher) ------------------------------
function downloadTrack(track) {
  // Use the slug for the filename — predictable, matches LEARNINGS conventions.
  const slug = (track.slug || "music").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const outName = `${slug}.mp3`;
  const fetcher = path.join(projectRoot, "scripts", "fetch-pixabay-music.mjs");
  if (!fs.existsSync(fetcher)) {
    throw new Error(`Fetcher not found: ${fetcher}`);
  }
  // Prefer URL — fetcher handles direct page URL, CDN audio URL, AND search query.
  // (Direct URLs are deterministic; search URLs work via the in-page Play button.)
  const queryArg = track.url || track.search_url || "";
  if (!queryArg) {
    throw new Error(`Track has no url or search_url to download: ${track.slug || track.title}`);
  }
  console.log(`[pick-music] Downloading top pick: ${track.title}`);
  console.log(`[pick-music]   from: ${queryArg}`);
  console.log(`[pick-music]   to:   assets/music/${outName}`);
  const result = spawnSync(process.execPath, [fetcher, queryArg, outName], {
    stdio: "inherit",
    cwd: projectRoot,
  });
  if (result.status !== 0) {
    throw new Error(`fetch-pixabay-music.mjs exited with code ${result.status}`);
  }
  return path.join(projectRoot, "assets", "music", outName);
}

// --- Output formatting ------------------------------------------------------
function formatHuman(template, vibe, picks) {
  const lines = [];
  lines.push(`Template: ${template}`);
  lines.push(`Vibe:     ${vibe}`);
  lines.push(`Returned: ${picks.length} track${picks.length === 1 ? "" : "s"}`);
  lines.push("");
  picks.forEach((t, i) => {
    const dur = t.duration ? `${t.duration}s` : "?s";
    const bpm = t.bpm ? `${t.bpm} BPM` : "? BPM";
    lines.push(`${i + 1}. ${t.title}`);
    lines.push(`   url:    ${t.url}`);
    lines.push(`   meta:   ${dur} · ${bpm} · tags=[${(t.tags || []).join(", ")}]`);
    if (t.character) lines.push(`   feel:   ${t.character}`);
    if (t.best_for) lines.push(`   for:    ${t.best_for}`);
    if (t.local_file) {
      const abs = path.join(projectRoot, t.local_file);
      const exists = fs.existsSync(abs);
      lines.push(`   local:  ${t.local_file}${exists ? " (downloaded)" : " (not yet downloaded)"}`);
    }
    lines.push("");
  });
  return lines.join("\n");
}

// --- Main -------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.template) {
    console.error("[pick-music] ERROR: --template is required");
    printHelp();
    process.exit(2);
  }

  if (!VALID_TEMPLATES.includes(args.template)) {
    console.error(
      `[pick-music] ERROR: unknown template "${args.template}". Valid: ${VALID_TEMPLATES.join(", ")}`
    );
    process.exit(2);
  }

  let shortlist;
  try {
    shortlist = loadShortlist(args.template);
  } catch (err) {
    console.error(`[pick-music] ERROR: ${err.message}`);
    process.exit(1);
  }

  const ranked = rankTracks(shortlist.tracks);
  const filtered = filterByDuration(ranked, args.seconds);
  const top = Math.max(1, Math.min(args.top || 5, filtered.length));
  const picks = filtered.slice(0, top);

  if (picks.length === 0) {
    console.error(
      `[pick-music] No tracks match for template=${args.template}` +
      (args.seconds ? ` seconds=${args.seconds}` : "")
    );
    process.exit(1);
  }

  if (args.json) {
    const payload = {
      template: shortlist.template,
      vibe: shortlist.vibe,
      bpm_range: shortlist.bpm_range,
      default_volume: shortlist.default_volume,
      seconds_filter: args.seconds || null,
      tracks: picks,
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  } else {
    process.stdout.write(formatHuman(shortlist.template, shortlist.vibe, picks) + "\n");
  }

  if (args.download) {
    try {
      const outPath = downloadTrack(picks[0]);
      console.log(`[pick-music] Done. Saved: ${path.relative(projectRoot, outPath)}`);
    } catch (err) {
      console.error(`[pick-music] DOWNLOAD FAILED: ${err.message}`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(`[pick-music] FATAL: ${err.message}`);
  process.exit(1);
});
