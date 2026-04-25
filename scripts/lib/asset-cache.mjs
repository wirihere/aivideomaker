// Content-addressed cache for fetched assets.
//
// Wraps any URL-based fetcher with a transparent SHA-256 cache. The same URL
// always maps to the same cached file, so a re-run is a local file copy
// instead of a network round-trip + Playwright launch.
//
// File layout:
//   assets/.cache/<sha256-hex>.<ext>   — content-addressed entry
//                                        (ext keeps the file recognisable to
//                                         OS preview tools; not used by lookup)
//
// Usage in a fetcher:
//   import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";
//   const key = cacheKey(url);
//   const hit = await cacheGet(key);
//   if (hit) { fs.copyFileSync(hit, outPath); return; }
//   const buf = await downloadFromUrl(url);
//   const cachedPath = await cachePut(key, buf, ".jpg");
//   fs.copyFileSync(cachedPath, outPath);
//
// CLI:
//   node scripts/lib/asset-cache.mjs stats
//   node scripts/lib/asset-cache.mjs clear --force
//
// Design notes:
//   - No npm deps. Built-in `crypto` for sha256, `fs` for I/O.
//   - mkdirSync({ recursive: true }) is race-safe (no-op if dir exists).
//   - Cap: 500 MB. On overflow we warn and prune oldest-by-mtime.
//   - The cache is opt-in per fetcher — pre-existing scripts keep working.

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const CACHE_DIR = path.join(projectRoot, "assets", ".cache");
const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

// --- Internals ----------------------------------------------------------------
function ensureDir() {
  // recursive: true is safe to call repeatedly + survives parallel calls.
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Cache files have format <hash>.<ext>. We don't know the ext at lookup time
// (the URL might say .jpg but the response could be .jpeg), so cacheGet has
// to scan for the matching prefix. The cache dir is small enough (<500 MB,
// O(thousands) of files) that a one-time readdir is fine.
function findEntryByKey(key) {
  if (!fs.existsSync(CACHE_DIR)) return null;
  const entries = fs.readdirSync(CACHE_DIR);
  for (const name of entries) {
    // Match "<key>.<ext>" or "<key>" (no ext)
    if (name === key) return name;
    if (name.startsWith(`${key}.`)) return name;
  }
  return null;
}

function listEntries() {
  if (!fs.existsSync(CACHE_DIR)) return [];
  return fs
    .readdirSync(CACHE_DIR)
    .map((name) => {
      const full = path.join(CACHE_DIR, name);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        return null;
      }
      // Only count regular files (skip subdirs like luts/)
      if (!stat.isFile()) return null;
      return { name, full, size: stat.size, mtime: stat.mtimeMs };
    })
    .filter(Boolean);
}

// Prune oldest-by-mtime until total bytes are under MAX_BYTES.
// Returns { removed, freedBytes } so callers can log.
function pruneToCap() {
  const entries = listEntries().sort((a, b) => a.mtime - b.mtime);
  let total = entries.reduce((n, e) => n + e.size, 0);
  if (total <= MAX_BYTES) return { removed: 0, freedBytes: 0 };

  let removed = 0;
  let freed = 0;
  for (const e of entries) {
    if (total <= MAX_BYTES) break;
    try {
      fs.unlinkSync(e.full);
      total -= e.size;
      freed += e.size;
      removed += 1;
    } catch {
      // Best-effort — file may have been deleted between readdir and unlink.
    }
  }
  return { removed, freedBytes: freed };
}

// --- Public API ---------------------------------------------------------------

/**
 * SHA-256 hex digest of the URL. Stable, no normalisation — callers that want
 * `?utm=...` ignored should normalise the URL before calling.
 */
export function cacheKey(url) {
  return crypto.createHash("sha256").update(String(url)).digest("hex");
}

/**
 * Look up a cache entry by key. Returns absolute path to the cached file or
 * null if not present. Touches mtime on hit so LRU pruning keeps hot entries.
 */
export async function cacheGet(key) {
  ensureDir();
  const name = findEntryByKey(key);
  if (!name) return null;
  const full = path.join(CACHE_DIR, name);
  try {
    const now = new Date();
    fs.utimesSync(full, now, now);
  } catch {
    // Touch is best-effort — eviction order will fall back to ctime.
  }
  return full;
}

/**
 * Write a buffer into the cache under `<key><ext>` and return the absolute
 * path. `ext` should include the leading dot (".jpg"). Empty ext is allowed.
 * After writing, enforces the 500 MB cap.
 */
export async function cachePut(key, buf, ext = "") {
  ensureDir();
  const safeExt = ext && !ext.startsWith(".") ? `.${ext}` : ext;
  const filename = `${key}${safeExt}`;
  const full = path.join(CACHE_DIR, filename);

  // Atomic-ish: write to a tempfile, then rename. Avoids half-written cache
  // entries if the process is killed mid-write.
  const tmp = `${full}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, buf);
  try {
    fs.renameSync(tmp, full);
  } catch (err) {
    // Cleanup tmp on failure
    try { fs.unlinkSync(tmp); } catch {}
    throw err;
  }

  // Enforce cap. Warn rather than throw — the new entry stays.
  const stats = cacheStats();
  if (stats.totalBytes > MAX_BYTES) {
    const { removed, freedBytes } = pruneToCap();
    if (removed > 0) {
      console.log(
        `[cache] Pruned ${removed} oldest ${removed === 1 ? "entry" : "entries"} ` +
        `(${(freedBytes / 1024 / 1024).toFixed(1)} MB) to stay under 500 MB cap.`
      );
    } else {
      console.log(
        `[cache] WARN: cache at ${(stats.totalBytes / 1024 / 1024).toFixed(1)} MB ` +
        `exceeds 500 MB cap but no entries could be pruned.`
      );
    }
  }

  return full;
}

/**
 * Returns { entries, totalBytes }. Skips subdirectories (e.g. luts/).
 */
export function cacheStats() {
  const entries = listEntries();
  const totalBytes = entries.reduce((n, e) => n + e.size, 0);
  return { entries: entries.length, totalBytes };
}

/**
 * Delete all cache entries (regular files only). Returns count removed.
 * Subdirectories like assets/.cache/luts/ are left alone.
 */
export function cacheClear() {
  const entries = listEntries();
  let removed = 0;
  for (const e of entries) {
    try {
      fs.unlinkSync(e.full);
      removed += 1;
    } catch {}
  }
  return removed;
}

// --- CLI mode -----------------------------------------------------------------
// node scripts/lib/asset-cache.mjs stats
// node scripts/lib/asset-cache.mjs clear --force
//
// Note: `import.meta.url === "file://" + argv[1]` (the pattern in usage.mjs)
// is broken on Windows — `file:///C:/...` has three slashes after `file:`.
// fileURLToPath normalises this correctly across platforms.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const cmd = process.argv[2];

  if (cmd === "stats" || cmd === "show" || !cmd) {
    const { entries, totalBytes } = cacheStats();
    const mb = (totalBytes / 1024 / 1024).toFixed(2);
    const cap = (MAX_BYTES / 1024 / 1024).toFixed(0);
    const pct = ((totalBytes / MAX_BYTES) * 100).toFixed(0);
    console.log(`Asset cache (${path.relative(projectRoot, CACHE_DIR)})`);
    console.log(`  Entries:    ${entries}`);
    console.log(`  Total size: ${mb} MB / ${cap} MB cap (${pct}%)`);
  } else if (cmd === "clear") {
    const force = process.argv.includes("--force");
    if (!force) {
      console.log(
        "Refusing to clear cache without --force.\n" +
        "Run: node scripts/lib/asset-cache.mjs clear --force"
      );
      process.exit(1);
    }
    const removed = cacheClear();
    console.log(`Cleared ${removed} cache ${removed === 1 ? "entry" : "entries"}.`);
  } else {
    console.log(
      "Usage:\n" +
      "  node scripts/lib/asset-cache.mjs stats\n" +
      "  node scripts/lib/asset-cache.mjs clear --force"
    );
    process.exit(1);
  }
}
