// Standalone preview server — a minimal alternative to `npx hyperframes preview`.
//
// The studio's iframe wrapper (shadow DOM + postMessage handshake) has been
// fragile in practice. This script is intentionally dumb: a static file server
// over the project root + a thin HTML preview page (design/preview.html) that
// loads index.html in a vanilla iframe and drives `__timelines[id]` directly.
//
// Usage:
//   node scripts/preview.mjs            # serve project root on :3003 and open browser
//   node scripts/preview.mjs --port=4000
//   node scripts/preview.mjs --no-open  # don't auto-open the browser
//
// Coexists with `npx hyperframes preview` (which uses :3002).

import http from "http";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const PORT = Number(flags.port) || 3003;
const AUTO_OPEN = !flags["no-open"];
const ENTRY_PATH = "/design/preview.html";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm":  "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".ico":  "image/x-icon",
  ".mp3":  "audio/mpeg",
  ".wav":  "audio/wav",
  ".ogg":  "audio/ogg",
  ".mp4":  "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".txt":  "text/plain; charset=utf-8",
  ".md":   "text/markdown; charset=utf-8"
};

function safeJoin(root, urlPath) {
  // Strip query string, decode, normalize, then ensure result stays within root.
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const joined = path.normalize(path.join(root, decoded));
  if (!joined.startsWith(root)) return null;
  return joined;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Access-Control-Allow-Origin": "*",
    ...headers
  });
  res.end(body);
}

// --- Hot-reload via Server-Sent Events --------------------------------------
// Client connects to /__hf-changes; server keeps the connection open and emits
// a "change" event every time a watched file changes. The preview page reloads
// the iframe on each event.
const sseClients = new Set();

function sseBroadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch {}
  }
}

const watchPaths = [
  path.join(projectRoot, "index.html"),
  path.join(projectRoot, "compositions"),
  path.join(projectRoot, "design"),
  path.join(projectRoot, "scripts", "lib"),
];
let changeTimer = null;
function debouncedChange(file) {
  clearTimeout(changeTimer);
  changeTimer = setTimeout(() => {
    sseBroadcast("change", { file, ts: Date.now() });
  }, 150);
}

for (const target of watchPaths) {
  if (!fs.existsSync(target)) continue;
  const isDir = fs.statSync(target).isDirectory();
  try {
    fs.watch(target, { recursive: isDir }, (event, filename) => {
      if (!filename) return;
      // Skip noise: editor swap files, vendored deps, the bundle outputs themselves
      // (the bundle watcher writes them; we'd loop forever).
      if (/(^\.|~$|\.swp$|\.swx$|\.tmp$|node_modules)/i.test(filename)) return;
      if (filename === "all.js" || filename === "all.css" || filename.endsWith("/all.js") || filename.endsWith("/all.css")) return;
      debouncedChange(filename);
    });
  } catch {}
}

const server = http.createServer((req, res) => {
  let urlPath = req.url || "/";
  if (urlPath === "/" || urlPath === "") urlPath = ENTRY_PATH;

  // SSE endpoint for hot-reload notifications.
  if (urlPath.startsWith("/__hf-changes")) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write(`event: hello\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  const filePath = safeJoin(projectRoot, urlPath);
  if (!filePath) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (err) return send(res, 404, `Not found: ${urlPath}`);

    if (stat.isDirectory()) {
      const indexFile = path.join(filePath, "index.html");
      fs.stat(indexFile, (err2, stat2) => {
        if (err2 || !stat2.isFile()) return send(res, 403, "Directory listing disabled");
        streamFile(indexFile, res);
      });
      return;
    }

    streamFile(filePath, res);
  });
});

function streamFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Access-Control-Allow-Origin": "*"
  });
  fs.createReadStream(filePath)
    .on("error", () => { try { res.end(); } catch {} })
    .pipe(res);
}

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}${ENTRY_PATH}`;
  console.log("");
  console.log("  HyperFrames simple preview");
  console.log("  ──────────────────────────");
  console.log(`  Serving:  ${projectRoot}`);
  console.log(`  Preview:  ${url}`);
  console.log(`  Port:     ${PORT}`);
  console.log("  Press Ctrl+C to stop.");
  console.log("");

  if (AUTO_OPEN) {
    // Windows `start` needs an empty title arg before the URL.
    const cmd =
      process.platform === "win32" ? `start "" "${url}"` :
      process.platform === "darwin" ? `open "${url}"` :
                                      `xdg-open "${url}"`;
    exec(cmd, (err) => {
      if (err) console.warn(`  (could not auto-open browser: ${err.message})`);
    });
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try --port=3004.`);
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});
