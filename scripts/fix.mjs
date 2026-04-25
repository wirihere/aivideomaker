// fix.mjs — auto-fix scanner for HyperFrames compositions.
//
// Scans index.html + compositions/*.html for the recurring pitfalls
// documented in LEARNINGS.md §4. Dry-run by default; --apply writes
// safe mechanical fixes (with timestamped backups).
//
// Usage:
//   node scripts/fix.mjs                     # dry-run, list everything
//   node scripts/fix.mjs --apply             # write fixes (creates .backup-<ts>)
//   node scripts/fix.mjs --ignore=cdn,bundle # skip specific pitfall ids
//   node scripts/fix.mjs --json              # machine-readable output
//
// Pitfall ids (use with --ignore):
//   script-close          §4 "</script>" literal in JS comments breaks inline-bundled scripts
//   from-opacity          §4 GSAP tl.from() stuck at "from" state on paused/seek timelines (suggest only)
//   scene-override        §4 cards.css portrait override now redundant — bare .scene { width:1080px; height:1920px }
//   autoplay-guard        §3 Standalone autoplay guard missing
//   cdn                   §3 GSAP from CDN — prefer design/vendor/gsap.min.js
//   bundle                §3 4+ individual module <link> tags — prefer design/modules/all.css
//   audio-id              §4 <audio> without id is silently dropped by the renderer
//   audio-track           §4 overlapping <audio> on the same data-track-index
//   gsap-set-loop         §4 discretized GSAP set() per particle bloats timeline (suggest only)
//   font-var              §4 font-family: var(--*-font-*) skips deterministic embedding (HTML <style> + design/**/*.css)
//   audio-no-clip         §4 <audio data-start> without class="clip" — framework can't gate visibility
//   subcomp-currentscript §4 document.currentScript is null inside sub-comp wrappers
//
// What it WON'T do:
//   - Rewrite tl.from() → tl.fromTo() (semantics differ, end values are ambiguous).
//   - Rewrite for-loop tl.set() into CSS animation (architectural change).
//   - Touch any file outside index.html / compositions/*.html.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- arg parsing ------------------------------------------------------------
const argv = process.argv.slice(2);
const flags = {};
for (const a of argv) {
  if (!a.startsWith("--")) continue;
  const [k, v] = a.replace(/^--/, "").split("=");
  flags[k] = v ?? true;
}
const apply = flags.apply === true;
const wantJson = flags.json === true;
const ignored = new Set(
  typeof flags.ignore === "string"
    ? flags.ignore.split(",").map(s => s.trim()).filter(Boolean)
    : []
);

// --- ANSI helpers (skipped when --json) -------------------------------------
const noColor = wantJson || !process.stdout.isTTY;
const c = {
  dim: s => (noColor ? s : `\x1b[2m${s}\x1b[0m`),
  red: s => (noColor ? s : `\x1b[31m${s}\x1b[0m`),
  yellow: s => (noColor ? s : `\x1b[33m${s}\x1b[0m`),
  green: s => (noColor ? s : `\x1b[32m${s}\x1b[0m`),
  cyan: s => (noColor ? s : `\x1b[36m${s}\x1b[0m`),
  bold: s => (noColor ? s : `\x1b[1m${s}\x1b[0m`),
};

// --- file discovery ---------------------------------------------------------
function walkDir(dir, accept) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkDir(full, accept));
    } else if (ent.isFile() && accept(full, ent.name)) {
      out.push(full);
    }
  }
  return out;
}

function listTargets() {
  // HTML targets: index.html + compositions/**/*.html (recursive — sub-comp
  // detectors need to see compositions/{backgrounds,overlays,templates,verticals}/*.html).
  // archive/ stays out of scope intentionally — it's the historical untouched state.
  const targets = [];
  const root = path.join(projectRoot, "index.html");
  if (fs.existsSync(root)) targets.push(root);
  const compDir = path.join(projectRoot, "compositions");
  targets.push(...walkDir(compDir, (_full, name) => name.endsWith(".html")));
  return targets;
}

function listCssTargets() {
  // CSS targets: design/**/*.css excluding design/tokens-*.css (token source of truth).
  // Used by `font-var` only.
  const designDir = path.join(projectRoot, "design");
  return walkDir(designDir, (full, name) => {
    if (!name.endsWith(".css")) return false;
    // Skip token files at any depth — they are the var(--font-*) source of truth.
    const rel = path.relative(designDir, full).split(path.sep).join("/");
    if (/(^|\/)tokens-[^/]*\.css$/i.test(rel)) return false;
    return true;
  });
}

// --- script-block extraction ------------------------------------------------
// Returns { content, scriptStartIdx, scriptEndIdx } for each <script> block.
// Inline only (we don't need to inspect external src=).
function extractInlineScripts(text) {
  const blocks = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const attrs = m[1] || "";
    if (/\bsrc\s*=/.test(attrs)) continue; // external script — body is empty
    const body = m[2];
    const bodyStart = m.index + m[0].indexOf(">", "<script".length) + 1;
    blocks.push({
      attrs,
      body,
      bodyStart,
      bodyEnd: bodyStart + body.length,
    });
  }
  return blocks;
}

function extractInlineStyles(text) {
  const blocks = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const body = m[1];
    const bodyStart = m.index + m[0].indexOf(">") + 1;
    blocks.push({
      body,
      bodyStart,
      bodyEnd: bodyStart + body.length,
    });
  }
  return blocks;
}

// Convert byte index → 1-based line number.
function lineOf(text, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

// --- parsing helpers --------------------------------------------------------
// Match self-closed <audio ... /> and <audio ...>...</audio> opening tags.
function extractAudioTags(text) {
  const tags = [];
  const re = /<audio\b([^>]*?)\/?>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const attrs = m[1] || "";
    tags.push({
      raw: m[0],
      attrs,
      idx: m.index,
      end: m.index + m[0].length,
    });
  }
  return tags;
}

function attrValue(attrs, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = attrs.match(re);
  if (!m) return null;
  return m[2] ?? m[3] ?? m[4] ?? null;
}

// --- DETECTORS --------------------------------------------------------------
// Each detector returns an array of finding objects:
//   { id, severity, line, message, suggestion, fixable, apply(text) -> newText }
// `fixable` true means a deterministic mechanical rewrite is available.

function detectScriptCloseInComments(text) {
  // The HTML parser ends a <script> at the FIRST literal </script> in its body —
  // even one inside a JS line comment. Once that happens our naive lazy-match
  // body extraction stops too early, so we can't rely on script-block context
  // to find the offender. Instead: walk every <script ...> open and every
  // </script> close in source order; if a </script> appears while we're
  // "inside" a script block AND immediately after JS-comment context, flag it
  // as the most likely culprit.
  //
  // We keep this conservative — a </script> on its own line with no JS
  // content before it is a real close. The pattern that bites is literal
  // </script> preceded on the SAME LINE by JS code or a // comment.
  const findings = [];
  const opens = [];
  const reOpen = /<script\b([^>]*)>/gi;
  let m;
  while ((m = reOpen.exec(text)) !== null) {
    const attrs = m[1] || "";
    const isExternal = /\bsrc\s*=/.test(attrs);
    opens.push({ idx: m.index, end: m.index + m[0].length, isExternal });
  }
  const closes = [];
  const reClose = /<\/script\s*>/gi;
  while ((m = reClose.exec(text)) !== null) {
    closes.push({ idx: m.index, end: m.index + m[0].length });
  }
  // Pair opens with closes greedily (every open consumes the NEXT close).
  let ci = 0;
  for (const open of opens) {
    while (ci < closes.length && closes[ci].idx < open.end) ci++;
    if (ci >= closes.length) break;
    const close = closes[ci];
    ci++;
    if (open.isExternal) continue; // external <script src> bodies are empty
    // Inspect the body for a literal `</script>` candidate. This is rare but
    // possible if the FIRST </script> we paired is actually in a comment and
    // the real terminator was a later one. Look at the line preceding `close`
    // — if it has `//` before the `</script>`, that's the symptom.
    const lineStart = text.lastIndexOf("\n", close.idx - 1) + 1;
    const lineUpToClose = text.slice(lineStart, close.idx);
    // A line of the form `   // ... ` followed by `</script>` is the bug.
    if (/(^|\s)\/\//.test(lineUpToClose)) {
      // Skip if already escaped — pattern `<\/script>` would make the close
      // regex not match, so any close we see here is a genuine literal.
      findings.push({
        id: "script-close",
        severity: "error",
        line: lineOf(text, close.idx),
        message: "literal '</script>' on a line with a JS // comment ends the <script> tag prematurely",
        suggestion: "replace with '<\\/script>' inside the comment — escape the slash so the HTML parser doesn't close the tag",
        fixable: true,
        absIdx: close.idx,
      });
    }
  }
  return findings;
}

function applyScriptCloseFix(text, findings) {
  // Walk findings in reverse so absolute indices stay valid.
  const sorted = [...findings].sort((a, b) => b.absIdx - a.absIdx);
  let out = text;
  for (const f of sorted) {
    // Re-match at the recorded position because a previous fix may have shifted bytes
    // (we walk in reverse so this should be stable, but rematch for safety).
    const slice = out.slice(f.absIdx, f.absIdx + 12);
    const m = slice.match(/^<\/script\s*>/);
    if (!m) continue;
    const replacement = "<\\/script>";
    out = out.slice(0, f.absIdx) + replacement + out.slice(f.absIdx + m[0].length);
  }
  return out;
}

function detectFromOpacity(text) {
  // Match `tl.from(` (or any timeline ident `.from(`) where the second arg
  // (the vars object) contains opacity:0 — the brittle pattern from §4.
  // We deliberately keep this conservative — `tl.fromTo(` MUST NOT trigger.
  const findings = [];
  const blocks = extractInlineScripts(text);
  for (const blk of blocks) {
    const re = /\b([A-Za-z_$][\w$]*)\.from\s*\(\s*[^,]+,\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(blk.body)) !== null) {
      const ident = m[1];
      if (ident === "gsap") continue; // gsap.from on a live element is fine in some cases
      const objBody = m[2];
      if (!/\bopacity\s*:\s*0\b/.test(objBody)) continue;
      const absIdx = blk.bodyStart + m.index;
      findings.push({
        id: "from-opacity",
        severity: "warn",
        line: lineOf(text, absIdx),
        message: `${ident}.from(..., { opacity: 0, ... }) is brittle on paused/seek timelines (LEARNINGS §4)`,
        suggestion: "rewrite as fromTo() with explicit start AND end values",
        fixable: false, // semantics ambiguous — won't auto-rewrite
      });
    }
  }
  return findings;
}

function detectSceneOverride(text) {
  const findings = [];
  const blocks = extractInlineStyles(text);
  for (const blk of blocks) {
    // .scene { ... width: 1080px; ... height: 1920px; ... } in any order
    const re = /\.scene\s*\{([^}]+)\}/g;
    let m;
    while ((m = re.exec(blk.body)) !== null) {
      const body = m[1];
      const hasW1080 = /\bwidth\s*:\s*1080px\b/.test(body);
      const hasH1920 = /\bheight\s*:\s*1920px\b/.test(body);
      if (!(hasW1080 && hasH1920)) continue;
      const absIdx = blk.bodyStart + m.index;
      findings.push({
        id: "scene-override",
        severity: "warn",
        line: lineOf(text, absIdx),
        message: ".scene rule hardcodes 1080×1920 (cards.css default is 100%/100% — override now redundant for portrait comps)",
        suggestion: "remove explicit width/height from this .scene rule unless it's a deliberate landscape override",
        fixable: false, // could be deliberate; let user decide
      });
    }
  }
  return findings;
}

function detectMissingAutoplayGuard(text) {
  const findings = [];
  const blocks = extractInlineScripts(text);
  for (const blk of blocks) {
    const hasPaused = /gsap\.timeline\s*\(\s*\{[^}]*\bpaused\s*:\s*true\b/.test(blk.body);
    const hasRegistration = /window\.__timelines\s*\[/.test(blk.body);
    if (!hasPaused || !hasRegistration) continue;
    const hasGuard = /window\s*===\s*window\.top/.test(blk.body) ||
                     /window\.top\s*===\s*window/.test(blk.body);
    if (hasGuard) continue;
    findings.push({
      id: "autoplay-guard",
      severity: "warn",
      line: lineOf(text, blk.bodyStart),
      message: "registered timeline has no standalone-autoplay guard (LEARNINGS §3)",
      suggestion: "append: if (window === window.top) setTimeout(() => tl.play(0), 250);",
      fixable: true,
      blkIdx: blk.bodyEnd, // insertion target (just before </script>)
    });
  }
  return findings;
}

function applyAutoplayGuardFix(text, findings) {
  // Apply in reverse insertion order to keep indices valid.
  const sorted = [...findings].sort((a, b) => b.blkIdx - a.blkIdx);
  let out = text;
  for (const f of sorted) {
    const insert = `\n\n  // Standalone autoplay — only when loaded directly in a top-level browser tab.\n  // Studio + renderer wrap us in an iframe and drive seek themselves; we stay paused.\n  if (window === window.top) {\n    setTimeout(() => tl.play(0), 250);\n  }\n`;
    out = out.slice(0, f.blkIdx) + insert + out.slice(f.blkIdx);
  }
  return out;
}

function detectCdnGsap(text) {
  const findings = [];
  // Match the full `<script src="...gsap..."></script>` pair so the
  // applied replacement can swap it as a single unit. External script
  // bodies are empty by spec, so the close tag follows immediately
  // after a possible whitespace gap.
  const re = /<script\b[^>]*\bsrc\s*=\s*("([^"]+)"|'([^']+)')[^>]*>\s*<\/script\s*>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const src = m[2] ?? m[3] ?? "";
    if (!/gsap/i.test(src)) continue;
    if (!/^https?:\/\//.test(src)) continue;
    if (!/(cdn|jsdelivr|unpkg|cdnjs|skypack|esm\.sh)/i.test(src)) continue;
    findings.push({
      id: "cdn",
      severity: "warn",
      line: lineOf(text, m.index),
      message: `GSAP loaded from CDN (${src})`,
      suggestion: "vendor it — replace with design/vendor/gsap.min.js (LEARNINGS §3)",
      fixable: true,
      absIdx: m.index,
      raw: m[0],
      src,
    });
  }
  return findings;
}

function applyCdnGsapFix(text, findings, filePath) {
  // Compute the relative href to design/vendor/gsap.min.js from the file's own dir.
  const fileDir = path.dirname(filePath);
  let href = path.relative(fileDir, path.join(projectRoot, "design/vendor/gsap.min.js"));
  href = href.split(path.sep).join("/");
  if (!href.startsWith(".")) href = "./" + href;
  // For index.html (sibling of design/), the relative path becomes design/vendor/gsap.min.js.
  // path.relative may emit "design/vendor/gsap.min.js" (no ./ prefix) — that's fine
  // for an href, so don't force the leading "./" in that case.
  if (href.startsWith("./design/")) href = href.slice(2);

  const sorted = [...findings].sort((a, b) => b.absIdx - a.absIdx);
  let out = text;
  for (const f of sorted) {
    const replacement = `<script src="${href}"></script>`;
    out = out.slice(0, f.absIdx) + replacement + out.slice(f.absIdx + f.raw.length);
  }
  return out;
}

function detectIndividualModuleLinks(text) {
  // Look for 4+ <link rel="stylesheet" href="...design/modules/<single>.css">
  // tags referencing individual modules instead of all.css.
  const findings = [];
  const re = /<link\b[^>]*\bhref\s*=\s*("([^"]+)"|'([^']+)')[^>]*>/gi;
  const moduleHits = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const href = m[2] ?? m[3] ?? "";
    // Skip the bundle itself.
    if (/design\/modules\/all\.css(\?|$|"|')/.test(href)) continue;
    if (!/design\/modules\/[^/]+\.css$/.test(href)) continue;
    moduleHits.push({ idx: m.index, raw: m[0], href });
  }
  if (moduleHits.length >= 4) {
    findings.push({
      id: "bundle",
      severity: "info",
      line: lineOf(text, moduleHits[0].idx),
      message: `${moduleHits.length} individual design/modules/*.css link tags (LEARNINGS §3)`,
      suggestion: "collapse to a single design/modules/all.css link — npm run build:bundle keeps it current",
      fixable: false, // user may have intentional partial includes
      hits: moduleHits,
    });
  }
  return findings;
}

function detectAudioWithoutId(text) {
  const findings = [];
  const tags = extractAudioTags(text);
  for (const t of tags) {
    // Only flag <audio> tags that participate in the timeline.
    const hasStart = /\bdata-start\s*=/.test(t.attrs);
    const id = attrValue(t.attrs, "id");
    if (!hasStart) continue;
    if (id) continue;
    findings.push({
      id: "audio-id",
      severity: "error",
      line: lineOf(text, t.idx),
      message: "<audio data-start=...> without an id — renderer silently skips it (LEARNINGS §4)",
      suggestion: "add a unique id, e.g. id=\"sfx-<scene>-<purpose>\"",
      fixable: false, // need a meaningful id; user should pick
    });
  }
  return findings;
}

function detectAudioTrackOverlap(text) {
  const findings = [];
  const tags = extractAudioTags(text);
  // Build an entry per audio with timing info.
  const items = [];
  for (const t of tags) {
    const start = parseFloat(attrValue(t.attrs, "data-start") ?? "");
    const dur = parseFloat(attrValue(t.attrs, "data-duration") ?? "");
    const track = attrValue(t.attrs, "data-track-index");
    if (Number.isNaN(start) || Number.isNaN(dur) || track == null) continue;
    items.push({ start, end: start + dur, track: String(track), tag: t });
  }
  // Group by track and look for any pair whose [start,end) intervals overlap.
  const byTrack = new Map();
  for (const it of items) {
    if (!byTrack.has(it.track)) byTrack.set(it.track, []);
    byTrack.get(it.track).push(it);
  }
  for (const [track, list] of byTrack) {
    if (list.length < 2) continue;
    list.sort((a, b) => a.start - b.start);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (cur.start < prev.end - 1e-6) {
        findings.push({
          id: "audio-track",
          severity: "error",
          line: lineOf(text, cur.tag.idx),
          message: `audio on track ${track} overlaps a sibling at t=${prev.start.toFixed(2)}–${prev.end.toFixed(2)}s — same track means same channel (LEARNINGS §4)`,
          suggestion: "give each <audio> a unique data-track-index — sequential from 20 upward (reserved 0–13)",
          fixable: false, // would need a global reassignment plan
        });
      }
    }
  }
  return findings;
}

function detectGsapSetLoop(text) {
  const findings = [];
  const blocks = extractInlineScripts(text);
  for (const blk of blocks) {
    // Heuristic: a `for` loop body containing `<ident>.set(` with an explicit
    // bound that is high (≥30) or that looks like particles × steps.
    const re = /for\s*\(\s*(?:let|var|const)\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*(\d+)\s*;[^)]*\)\s*\{([\s\S]*?)\}/g;
    let m;
    while ((m = re.exec(blk.body)) !== null) {
      const bound = parseInt(m[1], 10);
      const body = m[2];
      if (!/\.set\s*\(/.test(body)) continue;
      // Require the body to look timeline-driven (timeline.set / tl.set).
      if (!/\b(?:tl|timeline|t)\.set\s*\(/.test(body)) continue;
      // Nested for loops inside push us into "bloat" territory regardless of bound.
      const hasInnerFor = /for\s*\(/.test(body);
      if (bound < 30 && !hasInnerFor) continue;
      const absIdx = blk.bodyStart + m.index;
      findings.push({
        id: "gsap-set-loop",
        severity: "info",
        line: lineOf(text, absIdx),
        message: `for-loop with ${hasInnerFor ? "nested loop and " : ""}timeline.set() over ${bound} iterations may bloat the timeline (LEARNINGS §4)`,
        suggestion: "consider a CSS @keyframes animation for repetitive per-frame motion; reserve GSAP for state changes",
        fixable: false,
      });
    }
  }
  return findings;
}

// --- font-var: font-family: var(--...font...) skips deterministic embedding (§4) ---
// Scans inline <style> blocks in HTML *and* project-relative *.css files.
// Skips @font-face blocks (a var() inside a @font-face descriptor is itself the
// embedding target — flagging it would be circular) and design/tokens-*.css
// (the token source of truth — those declarations are what the *consumers*
// resolve at compile time).
const FONT_VAR_RE = /font-family\s*:\s*var\(\s*--[\w-]*font[\w-]*/i;
const FONT_VAR_RE_G = /font-family\s*:\s*var\(\s*--[\w-]*font[\w-]*/gi;
const FONT_VAR_MESSAGE = "font-family uses var(--...) — compiler skips deterministic embedding (§4). Use a direct font name (nunito, jetbrains-mono, inter) or add @font-face.";

// Build a sorted index of @font-face block intervals [start, end) for a CSS body.
function fontFaceRanges(css) {
  const ranges = [];
  const re = /@font-face\b[^{]*\{/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    // Find the matching closing brace by depth-counting from the opening one.
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < css.length && depth > 0) {
      const ch = css[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      i++;
    }
    ranges.push([m.index, i]);
  }
  return ranges;
}

function inAnyRange(ranges, idx) {
  for (const [s, e] of ranges) {
    if (idx >= s && idx < e) return true;
  }
  return false;
}

function scanFontVarInCss(cssBody, baseAbsIdx, fullText) {
  const findings = [];
  const skipRanges = fontFaceRanges(cssBody);
  let m;
  // Reset regex state per call (global regex retains lastIndex).
  FONT_VAR_RE_G.lastIndex = 0;
  while ((m = FONT_VAR_RE_G.exec(cssBody)) !== null) {
    if (inAnyRange(skipRanges, m.index)) continue;
    const absIdx = baseAbsIdx + m.index;
    findings.push({
      id: "font-var",
      severity: "warn",
      line: lineOf(fullText, absIdx),
      message: FONT_VAR_MESSAGE,
      suggestion: "replace var(--*-font*) with a direct font-family name, or add an @font-face rule that bakes the var() into a real font",
      fixable: false,
    });
  }
  return findings;
}

function detectFontVar(text, filePath) {
  // CSS files: scan whole body (caller filters out tokens-*.css).
  if (filePath && filePath.toLowerCase().endsWith(".css")) {
    return scanFontVarInCss(text, 0, text);
  }
  // HTML files: scan each inline <style>...</style> block.
  const findings = [];
  const blocks = extractInlineStyles(text);
  for (const blk of blocks) {
    findings.push(...scanFontVarInCss(blk.body, blk.bodyStart, text));
  }
  return findings;
}

// --- audio-no-clip: <audio data-start> must have class~="clip" so the framework
// gates visibility/audio at scene boundaries (§4 companion to audio-id).
function detectAudioWithoutClip(text) {
  const findings = [];
  const tags = extractAudioTags(text);
  for (const t of tags) {
    const hasStart = /\bdata-start\s*=/.test(t.attrs);
    if (!hasStart) continue;
    const cls = attrValue(t.attrs, "class") || "";
    // Match a whole-token "clip" — `class="clip"`, `class="bg-clip clip"`,
    // `class="clip foo"`. Avoid false-positives on `class="clipboard"`.
    if (/(^|\s)clip(\s|$)/.test(cls)) continue;
    const id = attrValue(t.attrs, "id");
    const idLabel = id ? `id="${id}"` : "id=<unset>";
    findings.push({
      id: "audio-no-clip",
      severity: "error",
      line: lineOf(text, t.idx),
      message: `<audio ${idLabel}> with data-start lacks class="clip" — framework won't gate visibility, audio may persist after scene exit.`,
      suggestion: 'add `class="clip"` (or append "clip" to the existing class list) so HyperFrames toggles visibility/audio at scene boundaries',
      fixable: false,
    });
  }
  return findings;
}

// --- subcomp-currentscript: document.currentScript is null inside a sub-comp
// wrapper (the script ran during template parsing, not when the wrapper inserted).
// Multi-instance use also collides on window.__timelines[id].
function detectSubcompCurrentscript(text) {
  // Opt-out marker — file is only used as a copy-paste reference, not embedded.
  if (/\/\/\s*inline-only-reference\b/.test(text)) return [];

  const isSubcomp = /<template\s+id\s*=\s*["'][^"']+["']/i.test(text)
                 || /\bdata-composition-id\s*=\s*["'][^"']+["']/i.test(text);
  if (!isSubcomp) return [];

  const findings = [];
  // Try to recover the composition id for a more actionable message.
  let compId = "";
  const idMatch = text.match(/\bdata-composition-id\s*=\s*("([^"]+)"|'([^']+)')/i);
  if (idMatch) compId = idMatch[2] ?? idMatch[3] ?? "";

  const blocks = extractInlineScripts(text);
  for (const blk of blocks) {
    const re = /document\.currentScript\.closest\s*\(/g;
    let m;
    while ((m = re.exec(blk.body)) !== null) {
      const absIdx = blk.bodyStart + m.index;
      const idHint = compId ? `'[data-composition-id="${compId}"]'` : `'[data-composition-id="<id>"]'`;
      findings.push({
        id: "subcomp-currentscript",
        severity: "warn",
        line: lineOf(text, absIdx),
        message: `document.currentScript inside a sub-comp wrapper returns null (§4). Use document.querySelector(${idHint}) or inline this comp.`,
        suggestion: "replace `document.currentScript.closest(...)` with `document.querySelector('[data-composition-id=\"<id>\"]')`, or add a `// inline-only-reference` comment if this file is never embedded",
        fixable: false,
      });
    }
  }
  return findings;
}

const DETECTORS = [
  { id: "script-close",          fn: detectScriptCloseInComments, kinds: ["html"] },
  { id: "from-opacity",          fn: detectFromOpacity,           kinds: ["html"] },
  { id: "scene-override",        fn: detectSceneOverride,         kinds: ["html"] },
  { id: "autoplay-guard",        fn: detectMissingAutoplayGuard,  kinds: ["html"] },
  { id: "cdn",                   fn: detectCdnGsap,               kinds: ["html"] },
  { id: "bundle",                fn: detectIndividualModuleLinks, kinds: ["html"] },
  { id: "audio-id",              fn: detectAudioWithoutId,        kinds: ["html"] },
  { id: "audio-track",           fn: detectAudioTrackOverlap,     kinds: ["html"] },
  { id: "gsap-set-loop",         fn: detectGsapSetLoop,           kinds: ["html"] },
  { id: "font-var",              fn: detectFontVar,               kinds: ["html", "css"] },
  { id: "audio-no-clip",         fn: detectAudioWithoutClip,      kinds: ["html"] },
  { id: "subcomp-currentscript", fn: detectSubcompCurrentscript,  kinds: ["html"] },
];

const FIX_APPLIERS = {
  "script-close":   applyScriptCloseFix,
  "autoplay-guard": applyAutoplayGuardFix,
  "cdn":            applyCdnGsapFix,
};

// --- runner -----------------------------------------------------------------
function scanFile(filePath, kind = "html") {
  const text = fs.readFileSync(filePath, "utf8");
  const all = [];
  for (const det of DETECTORS) {
    if (ignored.has(det.id)) continue;
    const kinds = det.kinds || ["html"];
    if (!kinds.includes(kind)) continue;
    try {
      const out = det.fn(text, filePath);
      if (Array.isArray(out)) all.push(...out);
    } catch (err) {
      // Detector bug shouldn't kill the run.
      console.error(`detector ${det.id} crashed on ${path.relative(projectRoot, filePath)}: ${err.message}`);
    }
  }
  // Sort by source order (line ascending).
  all.sort((a, b) => a.line - b.line);
  return { text, findings: all };
}

function severityGlyph(sev) {
  if (sev === "error") return c.red("✗");
  if (sev === "warn")  return c.yellow("⚠");
  return c.cyan("ℹ");
}

function backupPath(filePath) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${filePath}.backup-${ts}`;
}

function applyFixesToFile(filePath, text, findings) {
  // Group fixable findings by id.
  const fixable = findings.filter(f => f.fixable);
  if (fixable.length === 0) return { changed: false, applied: [] };

  // Backup once before any write.
  const bk = backupPath(filePath);
  fs.writeFileSync(bk, text);

  let updated = text;
  const applied = [];
  // Apply per-id appliers. Order matters minimally (each apply works on absolute
  // indices captured against the *original* text; we apply within a single pass
  // and re-sort), but each applier walks its findings reverse-sorted so byte
  // shifts stay self-consistent within one detector. To keep this safe across
  // detectors, we re-scan after each apply.
  let scanText = updated;
  for (const id of Object.keys(FIX_APPLIERS)) {
    if (ignored.has(id)) continue;
    const det = DETECTORS.find(d => d.id === id);
    if (!det) continue;
    const fresh = det.fn(scanText, filePath).filter(f => f.fixable);
    if (fresh.length === 0) continue;
    const applier = FIX_APPLIERS[id];
    updated = applier(scanText, fresh, filePath);
    if (updated !== scanText) {
      applied.push({ id, count: fresh.length });
      scanText = updated;
    }
  }

  if (updated === text) {
    // Nothing actually changed — drop the backup so we don't litter.
    fs.unlinkSync(bk);
    return { changed: false, applied: [] };
  }
  fs.writeFileSync(filePath, updated);
  return { changed: true, applied, backup: bk };
}

function run() {
  const htmlTargets = listTargets();
  const cssTargets = listCssTargets();
  const result = { files: [], totals: { error: 0, warn: 0, info: 0, fixable: 0 } };

  if (!wantJson) {
    process.stdout.write(c.bold("scanning compositions...\n"));
  }

  let totalFindings = 0;
  let filesWithIssues = 0;

  function processOne(filePath, kind) {
    const rel = path.relative(projectRoot, filePath).split(path.sep).join("/");
    const { text, findings } = scanFile(filePath, kind);
    let entry = { file: rel, findings, applied: null };

    if (apply && kind === "html") {
      const out = applyFixesToFile(filePath, text, findings);
      entry.applied = out;
    }

    if (findings.length === 0) {
      if (!wantJson) process.stdout.write(`  ${c.green("✓")} ${rel}\n`);
    } else {
      filesWithIssues++;
      if (!wantJson) {
        process.stdout.write(`  ${c.bold(rel)}\n`);
        for (const f of findings) {
          totalFindings++;
          result.totals[f.severity] = (result.totals[f.severity] || 0) + 1;
          if (f.fixable) result.totals.fixable++;
          const lineStr = c.dim(`line ${String(f.line).padStart(4)}`);
          const idStr = c.dim(`[${f.id}]`);
          const suffix = f.fixable ? c.green(" auto-fixable") : "";
          process.stdout.write(`    ${severityGlyph(f.severity)} ${lineStr}  ${idStr} ${f.message}${suffix}\n`);
          process.stdout.write(`         ${c.dim("→ " + f.suggestion)}\n`);
        }
        if (apply && entry.applied?.changed) {
          const summary = entry.applied.applied
            .map(a => `${a.id}×${a.count}`).join(", ");
          process.stdout.write(`    ${c.green("✓ applied:")} ${summary}  ${c.dim(`(backup: ${path.basename(entry.applied.backup)})`)}\n`);
        }
      } else {
        for (const f of findings) {
          totalFindings++;
          result.totals[f.severity] = (result.totals[f.severity] || 0) + 1;
          if (f.fixable) result.totals.fixable++;
        }
      }
    }
    result.files.push(entry);
  }

  for (const filePath of htmlTargets) processOne(filePath, "html");
  for (const filePath of cssTargets)  processOne(filePath, "css");

  if (wantJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  process.stdout.write("\n");
  if (totalFindings === 0) {
    process.stdout.write(c.green("no pitfalls detected.\n"));
    return;
  }
  const fixableNote = result.totals.fixable > 0
    ? ` (${result.totals.fixable} auto-fixable)`
    : "";
  process.stdout.write(
    `found ${totalFindings} issue(s) across ${filesWithIssues} file(s)${fixableNote}.\n`
  );
  if (!apply && result.totals.fixable > 0) {
    process.stdout.write(
      c.dim("run with --apply to fix the auto-fixable ones (creates timestamped backups).\n")
    );
  }
  if (!apply) {
    process.stdout.write(
      c.dim("non-auto-fixable findings are advisory — read the suggestion + LEARNINGS §4.\n")
    );
  }
  // Exit non-zero only on errors so it can gate CI without warning noise.
  if (result.totals.error > 0) process.exitCode = 1;
}

run();
