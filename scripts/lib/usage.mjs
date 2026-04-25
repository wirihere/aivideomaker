// Shared usage tracker for all fetcher scripts.
//
// Tracks request counts (or character counts for TTS) per service against
// documented limits. State is persisted to .usage.json at the project root.
//
// Time buckets: minute, hour, day, month — automatically expire (any bucket
// older than its window stops affecting limit checks).
//
// Usage in a fetcher:
//   import { check, record } from "./lib/usage.mjs";
//   const status = check("pexels", 1);
//   if (!status.allowed) { console.error(status.message); process.exit(1); }
//   ... do the request ...
//   record("pexels", 1);

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const USAGE_FILE = path.join(projectRoot, ".usage.json");

// --- Documented per-service limits -------------------------------------------
// Conservative numbers. Set to null when no published limit (we still track
// usage so you can see it, but won't refuse).
//
// Free tiers as of 2026-04. Update if the providers change.
export const LIMITS = {
  // No-key services (polite self-imposed)
  iconify:                 { perMinute: 60,   perHour: null, perDay: null,   perMonth: null, unit: "requests", note: "Public CDN, no published limit. Self-imposed: 60/min." },
  undraw:                  { perMinute: 30,   perHour: null, perDay: 200,    perMonth: null, unit: "requests", note: "Scrape — be polite." },
  "pixabay-scrape":        { perMinute: 20,   perHour: 200,  perDay: 1000,   perMonth: null, unit: "requests", note: "Scrape via Playwright — heavy." },
  "tts-google":            { perMinute: 30,   perHour: null, perDay: 1000,   perMonth: null, unit: "chunks",   note: "Google rate-limits aggressively. Each request ≤ 200 chars." },
  "tts-streamelements":    { perMinute: 30,   perHour: null, perDay: 500,    perMonth: null, unit: "requests", note: "No published limit; for streamer use." },
  "tts-edge":              { perMinute: 60,   perHour: null, perDay: 2000,   perMonth: null, unit: "requests", note: "Microsoft Edge endpoint. No published limit." },

  // Key-based services (documented limits)
  unsplash:                { perMinute: null, perHour: 50,   perDay: null,   perMonth: null, unit: "requests", note: "Demo tier: 50/hr. Production: 5000/hr." },
  pexels:                  { perMinute: null, perHour: 200,  perDay: null,   perMonth: 20000, unit: "requests", note: "Free: 200/hr, 20,000/month." },
  "tts-elevenlabs":        { perMinute: null, perHour: null, perDay: null,   perMonth: 10000, unit: "characters", note: "Free: 10,000 chars/month." },
  freesound:               { perMinute: 60,   perHour: null, perDay: 2000,   perMonth: null, unit: "requests", note: "Free: 60/min, 2000/day with key." },

  // Pixabay official API (if you ever switch off the scrape)
  "pixabay-api":           { perMinute: null, perHour: 100,  perDay: null,   perMonth: null, unit: "requests", note: "Free with key: 100/60s." },
};

// --- Persistence -------------------------------------------------------------
function load() {
  if (!fs.existsSync(USAGE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
}

// --- Bucket keys -------------------------------------------------------------
// "minute:2026-04-24T15:42", "hour:2026-04-24T15", "day:2026-04-24", "month:2026-04"
function bucketKey(window, now = new Date()) {
  const iso = now.toISOString();
  switch (window) {
    case "minute": return `minute:${iso.slice(0, 16)}`;
    case "hour":   return `hour:${iso.slice(0, 13)}`;
    case "day":    return `day:${iso.slice(0, 10)}`;
    case "month":  return `month:${iso.slice(0, 7)}`;
  }
}

// Drop buckets older than their window so the file stays small
function prune(serviceData, now = new Date()) {
  const isoMin = now.toISOString().slice(0, 16);
  const isoHr  = now.toISOString().slice(0, 13);
  const isoDay = now.toISOString().slice(0, 10);
  const isoMon = now.toISOString().slice(0, 7);

  for (const key of Object.keys(serviceData)) {
    if (key.startsWith("minute:") && key !== `minute:${isoMin}`) delete serviceData[key];
    if (key.startsWith("hour:")   && key !== `hour:${isoHr}`)   delete serviceData[key];
    if (key.startsWith("day:")    && key !== `day:${isoDay}`)   delete serviceData[key];
    if (key.startsWith("month:")  && key !== `month:${isoMon}`) delete serviceData[key];
  }
}

// --- Public API --------------------------------------------------------------
/**
 * Check whether `amount` more units would exceed any limit.
 * Returns { allowed, message, summary } where summary lists current usage.
 */
export function check(service, amount = 1) {
  const limit = LIMITS[service];
  if (!limit) {
    return { allowed: true, message: `(no limit defined for "${service}")`, summary: [] };
  }
  const data = load();
  const svc = data[service] || {};
  prune(svc);

  const summary = [];
  let blocked = null;
  let warning = null;

  for (const window of ["minute", "hour", "day", "month"]) {
    const cap = limit[`per${window[0].toUpperCase()}${window.slice(1)}`];
    if (cap == null) continue;
    const key = bucketKey(window);
    const current = svc[key] || 0;
    const projected = current + amount;
    const pct = (projected / cap) * 100;
    summary.push(`${window}: ${current}/${cap} (${pct.toFixed(0)}%)`);

    if (projected > cap) {
      blocked = `Would exceed ${service} ${window} limit: ${projected}/${cap} ${limit.unit}.`;
    } else if (pct >= 80 && !warning) {
      warning = `Approaching ${service} ${window} limit: ${projected}/${cap} ${limit.unit} (${pct.toFixed(0)}%).`;
    }
  }

  return {
    allowed: !blocked,
    message: blocked || warning || `OK — ${summary.join(", ")}`,
    summary,
    warning,
    blocked,
    limit,
  };
}

/**
 * Record `amount` units against the service. Call AFTER a successful request.
 */
export function record(service, amount = 1) {
  const data = load();
  if (!data[service]) data[service] = {};
  prune(data[service]);

  for (const window of ["minute", "hour", "day", "month"]) {
    // Only track windows we have a limit for (keeps file small)
    const limit = LIMITS[service];
    if (limit && limit[`per${window[0].toUpperCase()}${window.slice(1)}`] == null) continue;
    const key = bucketKey(window);
    data[service][key] = (data[service][key] || 0) + amount;
  }
  save(data);
}

/**
 * Print a summary of all service usage. Used by the `usage` CLI command.
 */
export function report() {
  const data = load();
  const services = Object.keys(LIMITS).sort();
  console.log("Service usage (current windows):\n");
  for (const svc of services) {
    const limit = LIMITS[svc];
    const svcData = data[svc] || {};
    prune(svcData);
    const cells = [];
    for (const window of ["minute", "hour", "day", "month"]) {
      const cap = limit[`per${window[0].toUpperCase()}${window.slice(1)}`];
      if (cap == null) continue;
      const key = bucketKey(window);
      const current = svcData[key] || 0;
      const pct = ((current / cap) * 100).toFixed(0);
      const bar = "█".repeat(Math.min(20, Math.round((current / cap) * 20))).padEnd(20, "·");
      cells.push(`  ${window.padEnd(6)} ${bar}  ${current}/${cap} ${limit.unit} (${pct}%)`);
    }
    if (cells.length === 0) cells.push(`  (no limits configured)`);
    console.log(`${svc}`);
    console.log(`  ${limit.note}`);
    cells.forEach((c) => console.log(c));
    console.log();
  }
}

// --- CLI mode (node scripts/lib/usage.mjs report) ----------------------------
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const cmd = process.argv[2];
  if (cmd === "report" || cmd === "show" || !cmd) {
    report();
  } else if (cmd === "reset") {
    save({});
    console.log("Usage data cleared.");
  } else {
    console.log("Usage:\n  node scripts/lib/usage.mjs report\n  node scripts/lib/usage.mjs reset");
  }
}
