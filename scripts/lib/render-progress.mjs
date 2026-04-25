// Real-time render progress bar shared by render.mjs, render-queue.mjs, and
// video.mjs stage 7.
//
// HyperFrames' `npx hyperframes render` emits one of two progress messages
// per frame chunk (every ~30 frames):
//
//     Streaming frame 60/300 (4 workers)
//     Capturing frame 120/300 (4 workers)
//
// — wrapped in a self-overwriting line (\r + ANSI cursor/erase). When piped
// through us (stdio: pipe), those messages still arrive intermixed with the
// surrounding ANSI; we strip ANSI and split on both \n and \r so each progress
// chunk is parseable. We also match raw ffmpeg progress (`frame= 234`) for the
// streaming-encode path.
//
// We render our own bar on stdout — `▰▰▰▱▱▱ 124/300 · 41% · ETA 2m14s` — so
// the operator sees a steady tick instead of 5 minutes of silence. When stdout
// is not a TTY we degrade to one plain line per progress event (no `\r`, no
// ANSI). RENDER_PROGRESS=off or `--no-progress` reverts to the old silent
// behaviour (deterministic for tests).
//
// This module is deliberately stdout-only. It does NOT echo the child's raw
// progress lines (those are absorbed); but it DOES forward the child's
// non-progress output (errors, warnings, summary lines, stderr) verbatim so
// the operator still sees important messages.

import { spawn } from "child_process";
import fs from "fs";

// --- ANSI helpers ---------------------------------------------------------

// Strip the most common ANSI sequences ffmpeg/hyperframes emit (CSI codes
// like `\x1B[2K`, `\x1B[36m`, cursor-position `\x1B[12;5H`). We don't need a
// general-purpose parser — just enough to recover the readable text.
function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
}

// Format seconds → `Xm YYs` / `XXs`. ETAs >= 60s use the m+s form.
function fmtEta(secs) {
  if (!Number.isFinite(secs) || secs < 0) return "?";
  if (secs < 60) return `${Math.round(secs)}s`;
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m${String(s).padStart(2, "0")}s`;
}

// --- composition introspection -------------------------------------------

// Read total frame count from the comp's root HTML. The root timeline is
// the first element with `data-track-index="0"` (i.e. the outermost
// composition container). data-duration is in seconds; total frames =
// duration × fps. Defaults: 30 fps, falls back to null on parse failure
// (caller will skip computing totalFrames and just show a frame counter).
//
// We pick the FIRST track-0 element rather than scanning all of them
// because the convention is one root composition per HTML file. If the
// regex misses, return null and let the caller fall back to indeterminate
// progress (just a frame counter, no percent/ETA).
export function parseRootDuration(htmlPath, fps = 30) {
  let html;
  try {
    html = fs.readFileSync(htmlPath, "utf8");
  } catch {
    return null;
  }
  // Find first occurrence of data-duration on a track-index=0 element.
  // Tags can have attrs in any order, so two regex variants cover both
  // orderings. We deliberately match across whitespace/newlines.
  const reCombined = /<[a-z]+[^>]*?data-track-index=["']0["'][^>]*?data-duration=["']?(\d+(?:\.\d+)?)["']?/i;
  const reCombinedAlt = /<[a-z]+[^>]*?data-duration=["']?(\d+(?:\.\d+)?)["']?[^>]*?data-track-index=["']0["']/i;
  let m = html.match(reCombined) || html.match(reCombinedAlt);
  if (!m) return null;
  const duration = parseFloat(m[1]);
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return { duration, fps, totalFrames: Math.round(duration * fps) };
}

// --- progress bar core ----------------------------------------------------

// Constructs a stateful bar. Caller pumps progress events via `feed(line)`
// and triggers a heartbeat via `heartbeat()` if no events have arrived for
// HEARTBEAT_MS. `done()` flushes a final newline so subsequent prints don't
// land on the bar row.
//
// State: `currentFrame` advances monotonically (we never go backward — log
// reordering can produce out-of-order chunks). `lastDrawAt` rate-limits
// redraws so we don't spam the terminal on fast renders.
export function createProgressBar({ totalFrames = null, label = "render" } = {}) {
  const isTTY = !!process.stdout.isTTY;
  const BAR_WIDTH = 24;
  const FILLED = "▰";
  const EMPTY = "▱";
  const REDRAW_MS = 200;          // bar redraws no more than 5×/sec
  const HEARTBEAT_DOT_MS = 5000;  // emit a dot if no progress in 5s

  let startedAt = Date.now();
  let lastEventAt = startedAt;
  let lastDrawAt = 0;
  let currentFrame = 0;
  let dotCount = 0;
  let drawn = false;

  function buildBar() {
    if (totalFrames && totalFrames > 0) {
      const ratio = Math.min(1, currentFrame / totalFrames);
      const filled = Math.round(ratio * BAR_WIDTH);
      const empty = BAR_WIDTH - filled;
      const pct = Math.round(ratio * 100);
      const elapsed = (Date.now() - startedAt) / 1000;
      // ETA = elapsed × (1/ratio - 1). Avoid divide-by-zero before any frame.
      const eta = ratio > 0.001 ? elapsed * (1 / ratio - 1) : null;
      const etaStr = eta !== null ? `ETA ${fmtEta(eta)}` : "ETA …";
      return `${FILLED.repeat(filled)}${EMPTY.repeat(empty)} ${currentFrame}/${totalFrames} · ${pct}% · ${etaStr}`;
    }
    // Indeterminate — no totalFrames known.
    return `${FILLED.repeat(BAR_WIDTH)} ${currentFrame} frames · ${fmtEta((Date.now() - startedAt) / 1000)} elapsed`;
  }

  function draw(force = false) {
    const now = Date.now();
    if (!force && now - lastDrawAt < REDRAW_MS) return;
    lastDrawAt = now;
    const bar = buildBar();
    if (isTTY) {
      // \r + erase-line keeps the bar on a single rewriting row.
      process.stdout.write(`\r\x1B[2K  ${bar}`);
    } else {
      // Non-TTY: one plain line per redraw, no \r escapes.
      process.stdout.write(`  ${bar}\n`);
    }
    drawn = true;
  }

  function feed(rawLine) {
    if (!rawLine) return;
    const line = stripAnsi(rawLine);
    // Match HyperFrames' two progress shapes plus ffmpeg's classic.
    // Greedy on whitespace before the digits because the cli wraps in spaces.
    let frame = null;
    const hf = line.match(/(?:Streaming|Capturing) frame\s+(\d+)\/(\d+)/i);
    if (hf) {
      frame = parseInt(hf[1], 10);
      const total = parseInt(hf[2], 10);
      if (Number.isFinite(total) && total > 0 && (!totalFrames || total > totalFrames)) {
        // Trust the renderer over our HTML guess if they disagree (e.g.
        // fps override at the CLI). This keeps the percent honest.
        totalFrames = total;
      }
    } else {
      const ff = line.match(/frame=\s*(\d+)/);
      if (ff) frame = parseInt(ff[1], 10);
    }
    if (frame !== null && Number.isFinite(frame) && frame > currentFrame) {
      currentFrame = frame;
      lastEventAt = Date.now();
      draw();
    }
  }

  function heartbeat() {
    const now = Date.now();
    if (now - lastEventAt < HEARTBEAT_DOT_MS) return;
    lastEventAt = now;
    if (isTTY) {
      // Re-draw the bar to surface the steady "still alive" signal — the
      // ETA will tick up which is its own heartbeat.
      draw(true);
    } else {
      // Non-TTY: emit a literal dot (and never \r).
      dotCount += 1;
      if (dotCount === 1) process.stdout.write("  .");
      else process.stdout.write(".");
      // Wrap every 60 dots to avoid 1000-wide lines in a log file.
      if (dotCount % 60 === 0) process.stdout.write("\n  ");
    }
  }

  function done() {
    if (drawn) {
      // If we never reached 100% (renderer reported fewer frames than we
      // expected, or no totalFrames known), force a final draw so the bar
      // ends in a visually-complete state. Otherwise just emit a newline
      // to free the cursor for subsequent prints.
      const needsFinalDraw = totalFrames && currentFrame < totalFrames;
      if (needsFinalDraw) {
        currentFrame = totalFrames;
        draw(true);
      }
      process.stdout.write("\n");
    } else if (dotCount > 0) {
      process.stdout.write("\n");
    }
  }

  // Suppress any pending output (e.g. on early failure). Same semantics as
  // done(), but skips the 100% flush so the failure message lands cleanly.
  function abort() {
    if (drawn || dotCount > 0) process.stdout.write("\n");
  }

  return { feed, heartbeat, done, abort, get currentFrame() { return currentFrame; }, get totalFrames() { return totalFrames; } };
}

// --- spawn helper ---------------------------------------------------------

// Spawn `cmd args` with stdout+stderr piped, line-buffer both streams, and
// feed each line through the progress bar. Non-progress lines that look
// like errors/warnings (or originated from stderr) are echoed verbatim so
// the operator doesn't lose them. On exit, `done()` flushes the bar.
//
// `progressEnabled` (default true) turns the whole feature off and falls
// back to old `stdio:"inherit"` behaviour so tests stay deterministic.
export function runWithProgress(cmd, args, opts = {}, barOpts = {}) {
  const progressEnabled = barOpts.progressEnabled !== false
    && process.env.RENDER_PROGRESS !== "off";

  if (!progressEnabled) {
    // Pass-through mode — no bar, no parsing.
    return new Promise((resolve, reject) => {
      const p = spawn(cmd, args, { stdio: "inherit", ...opts });
      p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
      p.on("error", reject);
    });
  }

  const bar = createProgressBar(barOpts);

  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["inherit", "pipe", "pipe"], ...opts });

    // Heartbeat ticker — wakes once per second to nudge bar redraw / emit
    // dots when the child has been quiet. Cleared when the child exits.
    const heartbeatTimer = setInterval(() => bar.heartbeat(), 1000);

    // Line buffer with split on BOTH \n and \r — hyperframes' progress
    // overwrites use \r so a pure newline split would never see them.
    function makeLineHandler(isStderr) {
      let buf = "";
      return (chunk) => {
        buf += chunk.toString("utf8");
        // Consume any number of completed lines (terminated by \r or \n).
        let m;
        while ((m = buf.match(/[\r\n]/))) {
          const end = m.index;
          const line = buf.slice(0, end);
          buf = buf.slice(end + 1);
          if (line.length === 0) continue;
          handleLine(line, isStderr);
        }
      };
    }

    function handleLine(rawLine, isStderr) {
      const line = stripAnsi(rawLine);
      // If it looks like a progress line, swallow it into the bar.
      if (/(?:Streaming|Capturing) frame\s+\d+\/\d+/i.test(line)
          || /^\s*frame=\s*\d+/.test(line)) {
        bar.feed(rawLine);
        return;
      }
      // Otherwise, echo verbatim. Use stderr stream for stderr lines so
      // upstream redirection still works (e.g. `2> errors.log`).
      const stream = isStderr ? process.stderr : process.stdout;
      // If the bar is drawn on a TTY, put a newline first so we don't
      // overwrite the bar with the echoed line.
      if (process.stdout.isTTY && bar.currentFrame > 0) {
        process.stdout.write("\r\x1B[2K");
      }
      stream.write(rawLine.replace(/\r$/, "") + "\n");
      // Re-draw the bar below the echoed line.
      if (bar.currentFrame > 0) bar.heartbeat();
    }

    p.stdout.on("data", makeLineHandler(false));
    p.stderr.on("data", makeLineHandler(true));

    p.on("close", (code) => {
      clearInterval(heartbeatTimer);
      if (code === 0) {
        bar.done();
        resolve();
      } else {
        bar.abort();
        reject(new Error(`${cmd} exited ${code}`));
      }
    });
    p.on("error", (err) => {
      clearInterval(heartbeatTimer);
      bar.abort();
      reject(err);
    });
  });
}
