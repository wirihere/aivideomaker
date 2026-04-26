// Verify-render — every render is a learning event.
//
// Pairs the assembled HTML composition (or rendered MP4) against the narration
// VTT + copy.json, scrubs a per-second visible-text snapshot, and writes:
//   - JSON findings        docs/render-learnings/<slug>-<timestamp>.json
//   - Markdown report      docs/render-learnings/<slug>-<timestamp>.md
//   - One ledger row       docs/render-learnings/LEDGER.md (append)
//
// Categories surfaced:
//   - composition           visible text per scene (length, alignment with narration)
//   - brand fidelity        brand name + URL presence; on-screen text vs copy.json
//   - placeholder leakage   literal seed text from the template that didn't get swapped
//   - pacing                scene durations vs narration beat boundaries
//   - audio coverage        narration end vs comp end (gaps, overruns)
//   - accessibility         text-vs-bg contrast + font size at 1080p
//   - brand palette use     scene bg colors vs design/tokens-<slug>.css palette;
//                           presence of var(--card-) references in assembled <style>
//   - brand asset use       manifest.json assets actually appearing as src= in HTML
//   - scene visual density  text-only scenes on default backgrounds (image / decorative
//                           element census per scene midpoint, consecutive-run detection)
//   - motion continuity     per-scene PNG-byte-diff between adjacent timestamp samples;
//                           catches "PowerPoint" failure (static / near-static frames)
//                           pre-render. Frames saved to tmp/verify-frames/<slug>-<stamp>/
//                           for debug (gitignored).
//   - script timing         spoken-word ↔ scene ↔ visible-text alignment:
//                           density imbalance, scene-narration mismatch, silence
//                           beats, narration overrun into CTA, identity-word
//                           emphasis orphans, total budget. Heuristic only.
//
// Usage:
//   node scripts/verify-render.mjs                          # default: index.html
//   node scripts/verify-render.mjs --comp=index.html
//   node scripts/verify-render.mjs --comp=compositions/kindred-nz.html
//   node scripts/verify-render.mjs --copy=compositions/kindred-nz.copy.json
//   node scripts/verify-render.mjs --vtt=assets/voiceover/kindred-nz.vtt
//   node scripts/verify-render.mjs --out=docs/render-learnings/foo.md
//   node scripts/verify-render.mjs --no-server                # assume preview is up
//
// Exit codes:
//   0 — verifier ran; no major bugs (no placeholder leakage, brand present)
//   1 — verifier ran; major findings — see report
//   2 — verifier could not run (preview server unreachable, file missing, etc.)
//
// Constraints (deliberate):
//   - Doesn't render MP4. The --render arg is reserved (frame extraction is
//     non-trivial without OCR; current loop is HTML-only).
//   - Uses scripts/lib/platform-bin.mjs for spawning (no shell:true, no .cmd).
//   - Doesn't touch video.mjs / render.mjs / compositions / design.

import { spawn } from "child_process";
import { chromium } from "playwright";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { node as nodeBin, npxRunArgs } from "./lib/platform-bin.mjs";

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
const port = +flags.port || 3002;
const compArg = typeof flags.comp === "string" ? flags.comp : "index.html";
const copyArg = typeof flags.copy === "string" ? flags.copy : null;
const vttArg = typeof flags.vtt === "string" ? flags.vtt : null;
const outArg = typeof flags.out === "string" ? flags.out : null;
const noServer = flags["no-server"] === true;
const renderArg = typeof flags.render === "string" ? flags.render : null; // reserved

// --- helpers --------------------------------------------------------------
function abs(p) {
  return path.isAbsolute(p) ? p : path.join(projectRoot, p);
}

function tsStamp(d = new Date()) {
  // YYYYMMDD-HHMMSS — sortable, filename-safe, no zone (local).
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
         `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

// Preview server probe — reachable iff GET / returns any 2xx/3xx.
async function probeServer() {
  try {
    const r = await fetch(`http://localhost:${port}/`);
    return r.ok || (r.status >= 200 && r.status < 400);
  } catch { return false; }
}

async function ensureServer() {
  if (await probeServer()) return { spawned: false, child: null };
  if (noServer) {
    throw new Error(
      `--no-server set but preview server not reachable on :${port}.\n` +
      `Start it manually: npx hyperframes preview --port ${port}`
    );
  }
  // Spawn preview detached so it survives the verifier exit (caller can leave
  // it running for follow-up runs). Use platform-bin to avoid DEP0190.
  const child = spawn(nodeBin, npxRunArgs("hyperframes", ["preview", "--port", String(port)]), {
    cwd: projectRoot, detached: false, stdio: "ignore",
  });
  child.unref();
  // Poll up to 12s — preview boot is usually 2-4s on this machine, but Vite
  // re-bundles on first hit can stretch it.
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 400));
    if (await probeServer()) return { spawned: true, child };
  }
  throw new Error(
    `preview server didn't come up on :${port} within 12s.\n` +
    `Try: npx hyperframes preview --port ${port}  (in another terminal), then re-run with --no-server`
  );
}

// --- VTT parsing ----------------------------------------------------------
// Whisper / hyperframes tts emits one cue per word. Returns
// [{ start, end, word }, ...].
function parseVtt(text) {
  const cues = [];
  // VTT cue: optional id line, then "HH:MM:SS.mmm --> HH:MM:SS.mmm", then text.
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const tlIdx = lines.findIndex(l => /-->/.test(l));
    if (tlIdx < 0) continue;
    const m = lines[tlIdx].match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);
    if (!m) continue;
    const start = +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
    const end   = +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;
    const word = lines.slice(tlIdx + 1).join(" ").trim();
    if (!word) continue;
    cues.push({ start, end, word });
  }
  return cues;
}

function wordAt(vttCues, t) {
  // Last cue whose [start, end) covers t.
  for (let i = vttCues.length - 1; i >= 0; i--) {
    if (t >= vttCues[i].start && t < vttCues[i].end) return vttCues[i].word;
  }
  return null;
}

// --- visible-text scrub function (runs in page context) -------------------
// Returns an array of { tag, text, fontSize, fontWeight, color, bg, contrast }
// for every visible leaf-text element at the current paused timeline state.
const VISIBLE_TEXT_FN = `() => {
  const sRGBtoLin = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = (r, g, b) => 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
  const parseRgb = (s) => {
    const m = (s || "").match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(",").map(x => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const ratio = (fg, bg) => {
    const Lf = lum(fg.r, fg.g, fg.b), Lb = lum(bg.r, bg.g, bg.b);
    const [L1, L2] = Lf > Lb ? [Lf, Lb] : [Lb, Lf];
    return (L1 + 0.05) / (L2 + 0.05);
  };
  const findBg = (el) => {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const cs = getComputedStyle(cur);
      const bg = parseRgb(cs.backgroundColor);
      if (bg && bg.a > 0) return bg;
      cur = cur.parentElement;
    }
    const bb = parseRgb(getComputedStyle(document.body).backgroundColor);
    if (bb && bb.a > 0) return bb;
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const INLINE = new Set(["SPAN","EM","STRONG","B","I","U","SMALL","MARK","SUB","SUP","CODE","BR"]);
  const isLeaf = (el) => {
    const t = (el.textContent || "").trim();
    if (!t) return false;
    for (const c of el.children) if (!INLINE.has(c.tagName)) return false;
    return true;
  };
  // Constrain the search to the composition root so we don't pick up the
  // hyperframes preview shell's chrome (header, sidebar, status bar).
  const compRoot = document.querySelector("[data-composition-id]") || document.body;
  const out = [];
  const all = compRoot.querySelectorAll("*");
  for (const el of all) {
    if (!isLeaf(el)) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // NOTE: deliberately no window-viewport filter — the preview shell positions
    // the comp at scrollY ~3000+ on this machine. We trust opacity/display/
    // size as the visibility signal, not viewport intersection.
    const fg = parseRgb(cs.color); if (!fg) continue;
    const bg = findBg(el);
    out.push({
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      text: (el.textContent || "").trim().slice(0, 200),
      fontSize: parseFloat(cs.fontSize) || 0,
      fontWeight: parseInt(cs.fontWeight, 10) || 400,
      contrast: ratio(fg, bg),
    });
  }
  return out;
}`;

// Visibility helper from smoke.mjs — show only the active scene at time t.
const APPLY_CLIP_VIS_FN = `(t) => {
  document.querySelectorAll(".clip").forEach(el => {
    const root = el.closest("[data-composition-id]");
    if (root === el) return;
    const start = parseFloat(el.dataset.start) || 0;
    const dur   = parseFloat(el.dataset.duration) || 0;
    el.style.display = (t >= start && t < start + dur) ? "" : "none";
  });
}`;

// --- placeholder seed-copy patterns ---------------------------------------
// Strings that almost certainly mean an unfilled template slot. Match exactly
// (case-insensitive, whole-token) — we don't want to flag a real headline that
// happens to contain the word "headline" as part of a sentence.
const SEED_COPY_PATTERNS = [
  // Generic template stamps
  /^HEADLINE$/i,
  /^SUBHEAD$/i,
  /^SUPPORTING\s+TEXT$/i,
  /^BENEFIT(?:\s+\d+)?$/i,
  /^FEATURE(?:\s+\d+)?$/i,
  /^TAGLINE$/i,
  /^Q&A$/i,
  /^QUESTION(?:\s+\d+)?$/i,
  /^ANSWER(?:\s+\d+)?$/i,
  // faq-quick + similar templates ship with small-caps kickers like
  // "THREE QUESTIONS" / "ANSWERED PLAINLY" that read as broken UX when
  // the orchestrator doesn't swap them for non-Q&A brand copy.
  /^THREE QUESTIONS$/i,
  /^ANSWERED PLAINLY$/i,
  /^ASKED OFTEN$/i,
  /^FREQUENTLY ASKED$/i,
  // faq-quick wellness/coaching seed (the leakage the previous Playwright
  // agent flagged on kindred-nz when faq-quick wasn't fully substituted)
  /^How long does a session take\??$/i,
  /Ninety minutes\. Then thirty/i,
  /^What does the first visit cost\??$/i,
  /No upsell, no add-ons/i,
  /^What if it doesn.?t feel right\??$/i,
  /^Is it safe\??$/i,
  /^Does it actually work\??$/i,
  /^How long until I see results\??$/i,
  /^What if I don.?t love it\??$/i,
  /Yes\. backed by clinical/i,
  /30-day risk-free trial/i,
  // Hero-promo seed
  /Your big claim goes here/i,
  /One-line supporting promise/i,
  // Generic
  /^Lorem ipsum/i,
  /^Click to edit$/i,
  /^Insert .* here$/i,
];

function looksLikePlaceholder(text) {
  for (const re of SEED_COPY_PATTERNS) {
    if (re.test(text)) return re.source;
  }
  return null;
}

// --- color helpers for brand-palette check --------------------------------
// rgb()/rgba() string → "#rrggbb" (lowercase). Returns null for keywords
// (transparent, inherit) or unparseable input.
function rgbToHex(rgbStr) {
  if (!rgbStr) return null;
  const s = String(rgbStr).trim().toLowerCase();
  if (!s || s === "transparent" || s === "inherit" || s === "initial" || s === "unset") return null;
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map(x => parseFloat(x.trim()));
  if (parts.length < 3) return null;
  // Treat near-zero alpha as transparent — element has no real surface color.
  const alpha = parts.length >= 4 ? parts[3] : 1;
  if (alpha <= 0.01) return null;
  const r = Math.max(0, Math.min(255, Math.round(parts[0])));
  const g = Math.max(0, Math.min(255, Math.round(parts[1])));
  const b = Math.max(0, Math.min(255, Math.round(parts[2])));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Parse a tokens-<slug>.css file for the brand palette hex set. We pull every
// hex value declared on the brand-relevant custom properties (paper / slate /
// accent / navy* / warn / ok). Returns a Set of lowercased "#rrggbb"; empty if
// the file is missing or unparseable. Per the brief: paper, slate, accent,
// navy*, warn — plus "ok" since tokens-kindred.css uses it as a brand surface.
function parseBrandTokenHexes(cssText) {
  const out = new Set();
  if (!cssText) return out;
  // Match: --card-<name>: <value>;  where <name> matches the brand token list.
  const re = /--card-(?:paper(?:-soft)?|slate(?:-ink)?|accent|navy(?:-deep)?|warn|ok)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(cssText))) {
    const value = m[1].trim();
    // Direct hex (#xxx, #xxxxxx, #xxxxxxxx)
    const hexMatch = value.match(/#([0-9a-fA-F]{3,8})/);
    if (hexMatch) {
      let hex = hexMatch[0].toLowerCase();
      // Expand short hex to long form for consistent comparison
      if (hex.length === 4) {
        // #abc → #aabbcc
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
      } else if (hex.length === 9) {
        // strip alpha channel for comparison purposes
        hex = hex.slice(0, 7);
      }
      out.add(hex);
      continue;
    }
    // rgb()/rgba() literal — convert
    if (/^rgba?\(/i.test(value)) {
      const hex = rgbToHex(value);
      if (hex) out.add(hex);
    }
  }
  return out;
}

// Resolve the brand-tokens path. The verifier slug is sometimes a recut suffix
// (e.g. "kindred-recut") that has no tokens file of its own. Fallbacks (in
// order): tokens-<slug>.css, tokens-<copy.slug>.css, tokens-<brand>.css where
// brand is the first lowercased word of the title before any separator.
function resolveTokensPath(slug, copyJson) {
  const candidates = [];
  if (slug) candidates.push(slug);
  if (copyJson?.slug && copyJson.slug !== slug) candidates.push(copyJson.slug);
  // brand-name fallback — strip suffixes like "-recut", "-tone", "-override"
  if (slug) {
    const base = slug.replace(/-(?:recut|tone|override|test|stripe|nz)$/i, "");
    if (base && base !== slug) candidates.push(base);
  }
  if (copyJson?.title) {
    const probe = String(copyJson.title).split(/[—\-|·:]/)[0].trim().toLowerCase();
    if (probe && /^[a-z][a-z0-9-]+$/.test(probe)) candidates.push(probe);
  }
  for (const c of candidates) {
    const p = abs(`design/tokens-${c}.css`);
    if (fileExists(p)) return p;
  }
  return null;
}

// --- scene visual census (runs in page context) ---------------------------
// At a paused timeline state, return per-scene: { id, bgHex, imageCount,
// decorativeCount, textOnly }. "Image" = <img>, content <svg>, or any element
// with a non-empty background-image. "Decorative" = visible element that isn't
// text and isn't pure paper-white/inherit-bg (rules, dots, blocks, accent
// shapes). "textOnly" = zero images AND zero decoratives.
//
// We pass the brand-token set as a stringified JSON array so the page-side
// function can match scene bg against it for the textOnly heuristic — a
// brand-tinted bg counts as "decorative enough" not text-only.
const SCENE_CENSUS_FN = `(brandHexes) => {
  const brandSet = new Set(brandHexes || []);
  // rgb() → "#rrggbb"
  const toHex = (s) => {
    if (!s) return null;
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(",").map(x => parseFloat(x.trim()));
    if (p.length < 3) return null;
    const a = p.length >= 4 ? p[3] : 1;
    if (a <= 0.01) return null;
    const r = Math.max(0, Math.min(255, Math.round(p[0])));
    const g = Math.max(0, Math.min(255, Math.round(p[1])));
    const b = Math.max(0, Math.min(255, Math.round(p[2])));
    return "#" + r.toString(16).padStart(2,"0") + g.toString(16).padStart(2,"0") + b.toString(16).padStart(2,"0");
  };
  const isWhiteish = (hex) => {
    if (!hex) return true; // inherit/transparent counts as default
    if (hex === "#ffffff") return true;
    return false;
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  };
  const scenes = [];
  for (const el of document.querySelectorAll(".scene.clip, .scene")) {
    if (el.hasAttribute("data-composition-id")) continue;
    if (!visible(el)) continue;
    const sceneId = el.id || null;
    const cs = getComputedStyle(el);
    let bgHex = toHex(cs.backgroundColor);
    // If the scene itself has a transparent bg, walk up to find the painted
    // surface (e.g. body or comp root). This matches "what does the viewer see".
    if (!bgHex) {
      let cur = el.parentElement;
      while (cur && cur !== document.documentElement) {
        const h = toHex(getComputedStyle(cur).backgroundColor);
        if (h) { bgHex = h; break; }
        cur = cur.parentElement;
      }
    }
    let imageCount = 0;
    let decorativeCount = 0;
    // Walk descendants of the scene only.
    const all = el.querySelectorAll("*");
    const TEXT_TAGS = new Set(["P","H1","H2","H3","H4","H5","H6","SPAN","EM","STRONG","B","I","U","SMALL","MARK","SUB","SUP","CODE","BR","LI","DT","DD","BLOCKQUOTE","Q","CITE","ABBR","TIME","LABEL","A"]);
    for (const child of all) {
      if (!visible(child)) continue;
      const tag = child.tagName;
      // Image: <img>, content-bearing <svg> (has children), or
      // non-empty background-image.
      if (tag === "IMG") { imageCount++; continue; }
      if (tag === "SVG") {
        // Treat only SVGs that draw something (have child elements) as imagery.
        if (child.children && child.children.length > 0) {
          imageCount++;
          continue;
        }
      }
      const ccs = getComputedStyle(child);
      if (ccs.backgroundImage && ccs.backgroundImage !== "none") {
        imageCount++;
        continue;
      }
      // Decorative: non-text, has a visible non-default background, or a
      // border, or has a fixed size with a colored fill (e.g. rule, dot,
      // accent block). Skip text-bearing leaves — they're covered elsewhere.
      const t = (child.textContent || "").trim();
      const hasOwnText = t.length > 0;
      // If element has direct text but no non-inline non-text children, it is
      // a text leaf — not decorative.
      let onlyInlineChildren = true;
      for (const sub of child.children) {
        if (!TEXT_TAGS.has(sub.tagName)) { onlyInlineChildren = false; break; }
      }
      if (hasOwnText && onlyInlineChildren) continue;
      // Non-text container — does it have a paint surface?
      const childBg = toHex(ccs.backgroundColor);
      const hasBorder = (
        parseFloat(ccs.borderTopWidth) +
        parseFloat(ccs.borderRightWidth) +
        parseFloat(ccs.borderBottomWidth) +
        parseFloat(ccs.borderLeftWidth)
      ) > 0;
      const isBrandTinted = childBg && brandSet.has(childBg) && !isWhiteish(childBg);
      const isDifferentFromScene = childBg && childBg !== bgHex && !isWhiteish(childBg);
      if (isBrandTinted || isDifferentFromScene || hasBorder) {
        // Skip elements that only border-render text (focus rings, etc.) by
        // requiring a min footprint; rules/blocks easily clear this.
        const rect = child.getBoundingClientRect();
        if (rect.width >= 8 && rect.height >= 8) {
          decorativeCount++;
        }
      }
    }
    const sceneBgIsBrand = bgHex && brandSet.has(bgHex) && !isWhiteish(bgHex);
    scenes.push({
      sceneId,
      bgHex,
      sceneBgIsBrand,
      imageCount,
      decorativeCount,
      textOnly: imageCount === 0 && decorativeCount === 0 && !sceneBgIsBrand,
    });
  }
  return scenes;
}`;

// Run a midpoint census per scene. Reuses the active-page after scrubTimeline.
async function censusScenes(page, sceneWindows, brandHexes) {
  await page.evaluate(`window.__sceneCensus = ${SCENE_CENSUS_FN}`);
  // Parenthesise the RHS — `||` binds tighter than `=`, so without the
  // outer parens the parser sees `(__applyClipVis || (t)) => {…}` as a
  // single arrow function with a malformed param list. With parens we get
  // a clean assignment of the bare-arrow on the right.
  await page.evaluate(`window.__applyClipVis = (window.__applyClipVis || (${APPLY_CLIP_VIS_FN}))`);
  // De-dupe: scrub once per scene at its midpoint, then read the census filtered
  // to the active scene id.
  const result = new Map();
  for (const [sceneId, w] of sceneWindows) {
    const midT = (w.start + w.end) / 2 + 0.5;
    const list = await page.evaluate((args) => {
      const { midT, brandHexes } = args;
      const tl = window.__timelines[Object.keys(window.__timelines)[0]];
      tl.pause();
      tl.seek(midT);
      window.__applyClipVis(midT);
      return window.__sceneCensus(brandHexes);
    }, { midT, brandHexes });
    for (const entry of list) {
      // Only retain the row for the active scene id at this midpoint.
      if (entry.sceneId === sceneId) {
        result.set(sceneId, entry);
        break;
      }
    }
    if (!result.has(sceneId) && list.length) {
      // Fallback: take the first visible scene if id-match fails (rare —
      // happens when scene ids are missing).
      result.set(sceneId, list[0]);
    }
  }
  return result;
}

// --- motion continuity ----------------------------------------------------
// Goal: catch the "PowerPoint failure mode" before render — a scene whose
// pixels barely change between adjacent timestamps reads as a static slide
// even if the composition + copy alignment look fine on paper.
//
// Strategy per scene:
//   1) Sample 4–9 timestamps inside the scene window: every 0.5s for the
//      first 3s, then 25% / 50% / 75% of the remaining duration. Short
//      scenes (≤3s) yield ~4 samples; 8s scenes yield 9 samples.
//   2) Seek the timeline + scene-clip visibility to that t.
//   3) Screenshot the comp via page.screenshot({clip}) clipped to the
//      [data-composition-id] bounding box — comp viewport only, no chrome.
//   4) For each adjacent pair within the same scene compare:
//        - sha256(buf) identical → STATIC (zero motion at all)
//        - else byte-diff: count of bytes where buf[i] !== prev[i]; if
//          that's <2% of total → near-static
//        - else moving (good)
// This is a coarse heuristic — PNG byte-diff is not a perceptual hash, but
// at the same viewport+codec the encoder is deterministic, so two visually
// identical frames hash identically and a small visual change moves enough
// bytes to clear 2%. Good enough to catch full-scene freezes.
function motionTimestamps(start, duration) {
  // Roughly 4–6 samples. First three seconds carry the most "settle"
  // motion (entrance tweens) and the most "did anything start moving"
  // signal — sample every 0.5s. After that we sample at 25/50/75% of the
  // remaining duration to surface mid-scene freezes.
  const ts = [];
  const earlyEnd = Math.min(3, duration);
  for (let dt = 0.5; dt <= earlyEnd + 1e-3; dt += 0.5) {
    ts.push(start + dt);
  }
  if (duration > 3) {
    const rest = duration - 3;
    ts.push(start + 3 + rest * 0.25);
    ts.push(start + 3 + rest * 0.5);
    ts.push(start + 3 + rest * 0.75);
  }
  // Clamp + de-dupe + sort.
  const clamped = ts
    .map(t => Math.max(start + 0.05, Math.min(start + duration - 0.05, t)))
    .map(t => Math.round(t * 100) / 100);
  return [...new Set(clamped)].sort((a, b) => a - b);
}

async function checkMotionContinuity(browser, compPath, sceneWindows, durationS, slug, stamp) {
  // Output dir for thumbnail PNGs (gitignored under tmp/).
  const frameDir = path.join(projectRoot, "tmp", "verify-frames", `${slug}-${stamp}`);
  fs.mkdirSync(frameDir, { recursive: true });

  // Open a SECOND page in the SAME browser instance pointed at the file:// URL.
  // Why not reuse the existing preview-server page? The hyperframes preview
  // shell injects studio-editor chrome and (on this Windows env) appears to
  // serve the comp HTML in a way that has unbalanced <script> tags — so
  // pixel screenshots of that page render only the navy body bg with raw
  // source dumped as text, regardless of seek state. The DOM-based checks
  // (visible-text scrub, scene census) still work there because they read
  // textContent, but pixel-diff needs a clean render.
  //
  // file:// loading sidesteps the preview-shell injection. Same browser,
  // same context — no extra browser instance, just a focused 2nd tab.
  // Per constraints: "DO NOT spawn a separate browser instance".
  //
  // Read the comp HTML to detect aspect from data-width/data-height. Falls
  // back to 1920x1080 if not declared (most templates).
  let viewportW = 1920, viewportH = 1080;
  try {
    const html = fs.readFileSync(compPath, "utf8").slice(0, 8000);
    const wm = html.match(/data-width="(\d+)"/);
    const hm = html.match(/data-height="(\d+)"/);
    if (wm && hm) {
      viewportW = +wm[1]; viewportH = +hm[1];
    }
  } catch {}
  // Cap viewport to sane sizes (Chromium gets cranky above ~4000px).
  viewportW = Math.max(320, Math.min(3840, viewportW));
  viewportH = Math.max(320, Math.min(3840, viewportH));

  const ctx = await browser.newContext({ viewport: { width: viewportW, height: viewportH } });
  const page = await ctx.newPage();
  // Load the comp HTML via file:// — bypass the preview server. Use POSIX-
  // style path so Chromium parses the URL on Windows.
  const fileUrl = "file:///" + compPath.replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(
    () => window.__timelines && Object.keys(window.__timelines).length > 0,
    { timeout: 8000 }
  );

  // Inject the visibility helper. Parenthesise — `||` binds tighter than `=`.
  await page.evaluate(`window.__applyClipVis = (window.__applyClipVis || (${APPLY_CLIP_VIS_FN}))`);

  // Compute the comp's bounding box for the clip rect. With file:// loading
  // the comp root has its real (1080x1920 / 1920x1080) rect.
  let clipRect = null;
  try {
    const compRect = await page.evaluate(() => {
      const el = document.querySelector("[data-composition-id]");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (compRect && compRect.width >= 50 && compRect.height >= 50) {
      const cx = Math.max(0, Math.floor(compRect.x));
      const cy = Math.max(0, Math.floor(compRect.y));
      const cw = Math.max(1, Math.min(viewportW - cx, Math.round(compRect.width)));
      const ch = Math.max(1, Math.min(viewportH - cy, Math.round(compRect.height)));
      if (cw >= 50 && ch >= 50) {
        clipRect = { x: cx, y: cy, width: cw, height: ch };
      }
    }
  } catch { /* fall through to full viewport */ }

  // Sort scenes by their start time so report order matches viewing order.
  const orderedScenes = [...sceneWindows.entries()]
    .sort((a, b) => a[1].start - b[1].start);

  const perScene = []; // { sceneId, samples: [{ t, sha, bytes }], pairs: [{ aT, bT, kind, diffPct }] }

  const sceneT0 = Date.now();
  for (const [sceneId, w] of orderedScenes) {
    // Build duration: end is inclusive on samples (lastT covered), so
    // duration = end - start + 1 in the samples grid. Floor-clamp to 1s.
    const duration = Math.max(1, w.end - w.start + 1);
    const ts = motionTimestamps(w.start, duration);
    const sceneSamples = [];
    for (const t of ts) {
      const seekT = Math.min(Math.max(t, 0.05), durationS - 0.05);
      // Pause + seek + apply clip visibility — same primitives as
      // scrubTimeline, no extra browser instance.
      await page.evaluate((seek) => {
        const tl = window.__timelines[Object.keys(window.__timelines)[0]];
        tl.pause();
        tl.seek(seek);
        window.__applyClipVis(seek);
      }, seekT);
      const shotT0 = Date.now();
      let buf;
      try {
        // Use a clip rect so we capture the comp viewport ONLY (not the
        // preview shell chrome), and don't trip the locator's auto-scroll
        // wait — which times out at ~3s per shot when scenes are toggled
        // display:none. clip is fast and deterministic.
        if (clipRect) {
          buf = await page.screenshot({ type: "png", clip: clipRect, timeout: 3000 });
        } else {
          buf = await page.screenshot({ type: "png", timeout: 3000 });
        }
      } catch (err) {
        // Last-resort fallback — small chance the page navigated mid-loop.
        buf = await page.screenshot({ type: "png", timeout: 3000 });
      }
      if (process.env.VERIFY_DEBUG) {
        const dt = Date.now() - shotT0;
        if (dt > 500) console.log(`    shot scene=${sceneId} t=${seekT.toFixed(2)} ${buf.length}b ${dt}ms`);
      }
      const sha = crypto.createHash("sha256").update(buf).digest("hex");
      const fname = `scene${sceneId || "x"}-t${seekT.toFixed(2)}.png`;
      try { fs.writeFileSync(path.join(frameDir, fname), buf); } catch {}
      sceneSamples.push({ t: seekT, sha, bytes: buf.length, buf });
    }
    // Adjacent-pair comparison within this scene.
    const pairs = [];
    for (let i = 1; i < sceneSamples.length; i++) {
      const prev = sceneSamples[i - 1];
      const curr = sceneSamples[i];
      let kind, diffPct;
      if (prev.sha === curr.sha) {
        kind = "static";
        diffPct = 0;
      } else if (prev.buf.length !== curr.buf.length) {
        // PNG sizes differ → encoder added at least one different chunk.
        // Treat any size delta >2% as moving; smaller delta still
        // counts as moving since byte counts already diverged.
        const sizeDelta = Math.abs(prev.buf.length - curr.buf.length);
        const pct = sizeDelta / Math.max(prev.buf.length, curr.buf.length);
        kind = pct < 0.02 ? "near-static" : "moving";
        diffPct = pct;
      } else {
        // Same length — count byte mismatches.
        let diff = 0;
        const len = prev.buf.length;
        for (let k = 0; k < len; k++) {
          if (prev.buf[k] !== curr.buf[k]) diff++;
        }
        const pct = diff / len;
        kind = pct < 0.02 ? "near-static" : "moving";
        diffPct = pct;
      }
      pairs.push({ aT: prev.t, bT: curr.t, kind, diffPct });
    }
    // Drop the buffer references now we're done — keeps the JSON payload
    // small and lets GC reclaim ~5–25MB of frame data.
    perScene.push({
      sceneId,
      windowStart: w.start,
      windowEnd: w.end,
      samples: sceneSamples.map(({ t, sha, bytes }) => ({ t, sha, bytes })),
      pairs,
    });
    if (process.env.VERIFY_DEBUG) {
      console.log(`  motion: scene ${sceneId} (${ts.length} samples) — total ${Date.now() - sceneT0}ms`);
    }
  }

  // Close the dedicated motion-continuity context. Browser stays open for
  // the caller (will be closed once verifier finishes).
  try { await ctx.close(); } catch {}

  return { frameDir, perScene };
}

// --- per-second scrub -----------------------------------------------------
// Sampling strategy: seek to (t + 0.5) so we land in the middle of each
// 1-second window, AFTER any entrance tweens (typical 0.4-0.8s into a scene).
// GSAP `from()` tweens leave elements at opacity:0 at their declared `at`
// position; an integer-second seek to the scene start would catch every
// element mid-fade and report "no visible text". The +0.5 offset is deliberate
// — visible-text snapshots are about content presence, not micro-timing.
async function scrubTimeline(page, durationS) {
  const samples = [];
  await page.evaluate(`window.__applyClipVis = ${APPLY_CLIP_VIS_FN}`);
  await page.evaluate(`window.__visText      = ${VISIBLE_TEXT_FN}`);

  const lastT = Math.floor(durationS);
  for (let t = 0; t <= lastT; t++) {
    // Seek to mid-window so tweens have settled. Clamp to [0, duration).
    const seekT = Math.min(Math.max(t + 0.5, 0.05), durationS - 0.05);
    const sample = await page.evaluate((args) => {
      const { tSec, seekT } = args;
      const tl = window.__timelines[Object.keys(window.__timelines)[0]];
      tl.pause();
      tl.seek(seekT);
      window.__applyClipVis(seekT);
      // Identify active scene: first .clip (not the comp root) whose window covers t.
      let activeSceneId = null;
      for (const el of document.querySelectorAll(".scene.clip, .scene")) {
        if (el.hasAttribute("data-composition-id")) continue;
        const s = parseFloat(el.dataset.start) || 0;
        const d = parseFloat(el.dataset.duration) || 0;
        if (seekT >= s && seekT < s + d) { activeSceneId = el.id || null; break; }
      }
      const innerText = (document.body.innerText || "").trim();
      return { activeSceneId, innerText, visible: window.__visText() };
    }, { tSec: t, seekT });
    samples.push({ t, ...sample });
  }
  return samples;
}

// --- script-timing helpers ------------------------------------------------
// Tokenize free text → lowercased non-stopword tokens of length ≥ 2.
// Used by both brand-vocab construction and per-cue / per-scene matching.
const SCRIPT_TIMING_STOPWORDS = new Set([
  "a", "an", "the", "is", "of", "to", "and", "or", "for", "with", "in",
  "on", "at", "it", "be", "by", "as", "we", "i", "you", "your", "our",
  "no", "not", "do", "does", "did", "have", "has", "had", "will", "this",
  "that", "these", "those", "but", "if", "so", "from", "up", "out",
]);
function tokenizeForScriptTiming(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    // Replace punctuation with whitespace, keep word chars + apostrophes.
    .replace(/[^a-z0-9'\s]+/gi, " ")
    .split(/\s+/)
    .map(t => t.replace(/^'+|'+$/g, ""))
    .filter(t => t.length >= 2 && !SCRIPT_TIMING_STOPWORDS.has(t));
}

// Build per-scene boundaries from the assembled comp HTML. Reads every
// .scene.clip element's data-start + data-duration from the literal HTML
// (no DOM round-trip needed) so we can correlate cues to scenes without
// hitting the page. Returns ordered [{ id, start, end, duration }].
function parseSceneWindowsFromHtml(html) {
  if (!html) return [];
  const scenes = [];
  // Match <div id="..." class="scene ... clip" ... data-start=".." data-duration="..">
  // Order doesn't matter — the actual matched-element snippet is what we
  // parse for id/start/duration.
  const re = /<(?:div|section)\b[^>]*\bclass="[^"]*\bscene\b[^"]*\bclip\b[^"]*"[^>]*>/gi;
  for (const m of html.matchAll(re)) {
    const tag = m[0];
    const idMatch = tag.match(/\bid="([^"]+)"/);
    const startMatch = tag.match(/\bdata-start="([\d.]+)"/);
    const durMatch = tag.match(/\bdata-duration="([\d.]+)"/);
    if (!idMatch || !startMatch || !durMatch) continue;
    const start = parseFloat(startMatch[1]);
    const duration = parseFloat(durMatch[1]);
    if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) continue;
    scenes.push({ id: idMatch[1], start, end: start + duration, duration });
  }
  // De-dupe by id (keep first), order by start time.
  const seen = new Set();
  const ordered = [];
  for (const s of scenes) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    ordered.push(s);
  }
  ordered.sort((a, b) => a.start - b.start);
  return ordered;
}

// Find which scene contains time t (first scene where start ≤ t < end).
function sceneAt(sceneWindows, t) {
  for (const s of sceneWindows) {
    if (t >= s.start && t < s.end) return s;
  }
  // Edge case: last cue at the very end — assign to the final scene if t == end.
  if (sceneWindows.length && t >= sceneWindows[sceneWindows.length - 1].end - 0.01) {
    return sceneWindows[sceneWindows.length - 1];
  }
  return null;
}

// Find which copy.json beat covers the cue based on word index in narration.
// Beats are sequential in narration, so we just split narration into
// per-beat character ranges and map the cue's word-index to a beat.
// Falls back to even time-bands if narration parsing fails.
function buildCueBeatMap(vttCues, copyJson, durationS) {
  const beats = Array.isArray(copyJson?.beats) ? copyJson.beats : [];
  if (!beats.length || !vttCues.length) return new Map();
  const map = new Map();
  // Even-time fallback: divide duration into beats.length bands, assign each
  // cue to the band its midpoint lands in. Simple + robust to narration
  // tokenization quirks.
  const band = durationS / beats.length;
  for (const cue of vttCues) {
    const mid = (cue.start + cue.end) / 2;
    let idx = Math.floor(mid / band);
    if (idx < 0) idx = 0;
    if (idx >= beats.length) idx = beats.length - 1;
    map.set(cue, idx);
  }
  return map;
}

// Build per-scene visible-text token sets from the existing per-second samples.
// Returns Map<sceneId, Set<token>>.
function buildSceneVisibleTokens(samples) {
  const out = new Map();
  for (const s of samples) {
    if (!s.activeSceneId) continue;
    const cur = out.get(s.activeSceneId) || new Set();
    for (const v of s.visible) {
      for (const tok of tokenizeForScriptTiming(v.text || "")) cur.add(tok);
    }
    out.set(s.activeSceneId, cur);
  }
  return out;
}

// Parse emphasis events from the assembled HTML inline <script> blocks.
// Looks for: comboFx.signalPulse / comboFx.glitchStamp / comboFx.paperTear /
// comboFx.cinematicReveal / comboFx.testimonialReveal / effectFx.glitchBurst /
// glitterFx.burst / textFx.cascade — anything that lands as a visual "stamp"
// moment. Pulls the `at:` parameter as scene-relative or absolute time.
//
// Returns Array<{ at, type }> in absolute composition seconds.
function parseEmphasisEvents(html) {
  if (!html) return [];
  const events = [];
  // Capture inline <script> bodies only — we don't want to pull `at:` strings
  // out of comments inside the body, but we DO want to scan all <script>
  // bodies (including those with type="module").
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const body = scripts.join("\n");
  // Pattern: <fxNs>.<fxName>(<tlArg>, <selectorArg>?, { ... at: <number> ... });
  // Cheaper to scan token-style: find each call site, then match `at:` inside
  // its braces. We accept a small fixed list of FX names.
  const FX_RE = /(?:comboFx\.signalPulse|comboFx\.glitchStamp|comboFx\.paperTear|comboFx\.cinematicReveal|comboFx\.testimonialReveal|effectFx\.glitchBurst|glitterFx\.burst|textFx\.cascade)\s*\(/g;
  for (const m of body.matchAll(FX_RE)) {
    const callIdx = m.index;
    // Find the opening brace of the options object — the FIRST '{' after the
    // function call's '('. Then find the matching close brace.
    const open = body.indexOf("{", callIdx);
    if (open < 0) continue;
    let depth = 0;
    let close = -1;
    for (let i = open; i < body.length; i++) {
      const ch = body[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) { close = i; break; }
      }
    }
    if (close < 0) continue;
    const opts = body.slice(open, close + 1);
    const atMatch = opts.match(/\bat\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
    if (!atMatch) continue;
    const at = parseFloat(atMatch[1]);
    if (!Number.isFinite(at)) continue;
    const fxMatch = m[0].match(/(\w+)\.(\w+)/);
    const type = fxMatch ? `${fxMatch[1]}.${fxMatch[2]}` : "fx";
    events.push({ at, type });
  }
  // Sort by time so caller can binary-search if they want.
  events.sort((a, b) => a.at - b.at);
  return events;
}

// Build the brand-vocab token set from copy.json — narration + every beat
// headline/body + cta tagline + brand title/slug. Length-≥4 tokens after
// stopword removal so we don't drown the signal in "to/and/of" type matches.
function buildBrandVocab(copyJson) {
  const out = new Set();
  if (!copyJson) return out;
  const consume = (text, minLen) => {
    for (const tok of tokenizeForScriptTiming(text || "")) {
      if (tok.length >= minLen) out.add(tok);
    }
  };
  // Narration is the strongest signal — length ≥ 4 per brief.
  consume(copyJson.narration, 4);
  // Beats — headline + body (length ≥ 3 here so short headline words still count).
  for (const b of copyJson.beats || []) {
    consume(b.headline, 3);
    consume(b.body, 3);
    consume(b.kicker, 3);
  }
  // CTA — tagline + verb.
  consume(copyJson?.cta?.tagline, 3);
  consume(copyJson?.cta?.verb, 2);
  // Brand title — split on "—|-" first to take the brand prefix.
  if (copyJson.title) {
    const probe = String(copyJson.title).split(/[—\-|·:]/)[0].trim();
    consume(probe, 2);
  }
  if (copyJson.slug) consume(copyJson.slug.replace(/-/g, " "), 2);
  return out;
}

// Detect identity tokens (brand name + URL host + cta verb + first-beat
// headline keywords) used by the word-emphasis-orphan check. Length ≥ 4 to
// avoid trivial verbs like "go".
function buildIdentityTokens(copyJson, brandName, brandUrl) {
  const out = new Set();
  const consume = (text, minLen) => {
    for (const tok of tokenizeForScriptTiming(text || "")) {
      if (tok.length >= minLen) out.add(tok);
    }
  };
  consume(brandName, 4);
  // URL host — first label only ("kindred-nz" → "kindred").
  try {
    if (brandUrl) {
      const host = new URL(brandUrl).hostname.replace(/^www\./, "").toLowerCase();
      const firstLabel = host.split(".")[0].split("-")[0];
      if (firstLabel.length >= 4) out.add(firstLabel);
    }
  } catch {}
  consume(copyJson?.cta?.verb, 4);
  // First-beat headline keywords (the opening hook the brief calls out).
  const firstBeat = (copyJson?.beats || [])[0];
  if (firstBeat?.headline) consume(firstBeat.headline, 4);
  return out;
}

// --- categorize findings --------------------------------------------------
function categorize({
  samples, vttCues, copyJson, durationS, brandName, brandUrl,
  compHtml, tokenHexes, tokensPath, manifestAssets, manifestPath, sceneCensus,
  motionContinuity, sceneWindowsHtml, emphasisEvents,
}) {
  const findings = {
    composition: [],
    brandFidelity: [],
    placeholderLeakage: [],
    pacing: [],
    audioCoverage: [],
    accessibility: [],
    brandPaletteUse: [],
    brandAssetUse: [],
    sceneVisualDensity: [],
    motionContinuity: [],
    scriptTiming: [],
  };

  // ---- composition: visible text per scene (length, alignment) -----------
  // Group samples by activeSceneId and union their visible text.
  const sceneText = new Map();
  for (const s of samples) {
    if (!s.activeSceneId) continue;
    const cur = sceneText.get(s.activeSceneId) || new Set();
    for (const v of s.visible) {
      const t = (v.text || "").trim();
      if (t) cur.add(t);
    }
    sceneText.set(s.activeSceneId, cur);
  }
  for (const [sceneId, lines] of sceneText) {
    const arr = Array.from(lines);
    const totalChars = arr.join(" ").length;
    if (arr.length === 0) {
      findings.composition.push({
        kind: "empty-scene",
        scene: sceneId,
        message: `scene ${sceneId} has no visible text at any sampled second`,
      });
    } else if (totalChars > 240) {
      findings.composition.push({
        kind: "text-heavy",
        scene: sceneId,
        message: `scene ${sceneId} renders ${totalChars} chars of text — may read as a wall of copy at 1080p`,
        lines: arr,
      });
    } else {
      findings.composition.push({
        kind: "ok",
        scene: sceneId,
        message: `scene ${sceneId}: ${arr.length} text element${arr.length === 1 ? "" : "s"} (${totalChars} chars)`,
        lines: arr,
      });
    }
  }

  // ---- brand fidelity ---------------------------------------------------
  const allText = samples.flatMap(s => s.visible.map(v => (v.text || "").toLowerCase())).join(" ");
  const brandLower = (brandName || "").toLowerCase();
  if (brandLower && !allText.includes(brandLower)) {
    findings.brandFidelity.push({
      kind: "brand-name-missing",
      message: `brand name "${brandName}" never appears in visible text — generic-stock risk`,
    });
  } else if (brandLower) {
    findings.brandFidelity.push({
      kind: "brand-name-present",
      message: `brand name "${brandName}" present in visible text`,
    });
  }
  const urlHost = (() => {
    try { return brandUrl ? new URL(brandUrl).hostname.replace(/^www\./, "").toLowerCase() : ""; }
    catch { return ""; }
  })();
  if (urlHost && !allText.includes(urlHost)) {
    findings.brandFidelity.push({
      kind: "url-missing",
      message: `canonical URL host "${urlHost}" never appears on screen`,
    });
  } else if (urlHost) {
    findings.brandFidelity.push({
      kind: "url-present",
      message: `URL host "${urlHost}" present in visible text`,
    });
  }

  // copy.json beat headlines — confirm at least each beat headline reaches a scene.
  const beats = Array.isArray(copyJson?.beats) ? copyJson.beats : [];
  const visibleHaystack = samples.flatMap(s => s.visible.map(v => (v.text || "").toLowerCase().trim())).filter(Boolean);
  for (let i = 0; i < beats.length; i++) {
    const headline = (beats[i].headline || "").trim();
    if (!headline) continue;
    const hLower = headline.toLowerCase();
    // Loose match: any visible string contains the headline OR vice versa
    // (template may abbreviate). Score in 4 buckets.
    const hit = visibleHaystack.some(v => v.includes(hLower) || (hLower.length > 12 && hLower.includes(v) && v.length > 6));
    if (!hit) {
      findings.brandFidelity.push({
        kind: "beat-headline-missing",
        beat: i,
        message: `beat #${i} headline ("${headline.slice(0, 60)}${headline.length > 60 ? "…" : ""}") not detected in any scene`,
      });
    }
  }

  // ---- placeholder leakage ----------------------------------------------
  // Walk every visible-text element across all samples; flag any that match
  // SEED_COPY_PATTERNS. Dedupe by (scene, text).
  const leakageSeen = new Set();
  for (const s of samples) {
    for (const v of s.visible) {
      const t = (v.text || "").trim();
      if (!t) continue;
      const re = looksLikePlaceholder(t);
      if (!re) continue;
      const key = `${s.activeSceneId || "?"}::${t}`;
      if (leakageSeen.has(key)) continue;
      leakageSeen.add(key);
      findings.placeholderLeakage.push({
        kind: "seed-copy",
        scene: s.activeSceneId,
        text: t,
        pattern: re,
        firstSeenAt: s.t,
        message: `scene ${s.activeSceneId || "(none)"} at t=${s.t}s shows placeholder "${t}" (matches /${re}/)`,
      });
    }
  }

  // ---- pacing: scene durations vs narration beat boundaries -------------
  // Build scene windows from samples (start = min t, end = max t + 1).
  const sceneWindows = new Map();
  for (const s of samples) {
    if (!s.activeSceneId) continue;
    const w = sceneWindows.get(s.activeSceneId) || { start: Infinity, end: -Infinity };
    w.start = Math.min(w.start, s.t);
    w.end = Math.max(w.end, s.t);
    sceneWindows.set(s.activeSceneId, w);
  }
  if (beats.length && sceneWindows.size) {
    const idealPerScene = durationS / Math.max(beats.length, 1);
    for (const [sceneId, w] of sceneWindows) {
      const len = w.end - w.start + 1;
      if (len < idealPerScene * 0.5) {
        findings.pacing.push({
          kind: "scene-short",
          scene: sceneId,
          message: `scene ${sceneId} is ~${len}s, less than half the ideal ${idealPerScene.toFixed(1)}s/beat slot`,
        });
      } else if (len > idealPerScene * 1.8) {
        findings.pacing.push({
          kind: "scene-long",
          scene: sceneId,
          message: `scene ${sceneId} is ~${len}s, well over the ideal ${idealPerScene.toFixed(1)}s/beat slot`,
        });
      }
    }
  }

  // ---- audio coverage ---------------------------------------------------
  if (vttCues.length) {
    const lastWordEnd = vttCues[vttCues.length - 1].end;
    const gap = durationS - lastWordEnd;
    if (gap > 2.5) {
      findings.audioCoverage.push({
        kind: "trailing-silence",
        message: `narration ends at ${lastWordEnd.toFixed(1)}s but comp runs to ${durationS}s — ${gap.toFixed(1)}s of silence at end`,
      });
    } else if (gap < -0.5) {
      findings.audioCoverage.push({
        kind: "narration-overrun",
        message: `narration ends at ${lastWordEnd.toFixed(1)}s but comp ends at ${durationS}s — narration overruns visuals by ${(-gap).toFixed(1)}s`,
      });
    } else {
      findings.audioCoverage.push({
        kind: "ok",
        message: `narration end (${lastWordEnd.toFixed(1)}s) within 2.5s of comp end (${durationS}s)`,
      });
    }
  } else {
    findings.audioCoverage.push({
      kind: "no-vtt",
      message: `no VTT cues — couldn't check narration timing`,
    });
  }

  // ---- accessibility: contrast + size at 1080p --------------------------
  // Sample one element per (scene, text) to avoid duplicate noise. Flag
  // contrast < 3:1 (large) / 4.5:1 (normal), and font size < 24px.
  const accSeen = new Set();
  for (const s of samples) {
    for (const v of s.visible) {
      const t = (v.text || "").trim();
      if (!t) continue;
      const key = `${s.activeSceneId || "?"}::${t}`;
      if (accSeen.has(key)) continue;
      accSeen.add(key);
      const isLarge = (v.fontSize >= 24 && v.fontWeight < 700) || (v.fontSize >= 18.66 && v.fontWeight >= 700);
      const threshold = isLarge ? 3 : 4.5;
      if (v.contrast < threshold) {
        findings.accessibility.push({
          kind: "contrast",
          scene: s.activeSceneId,
          text: t.slice(0, 40),
          ratio: v.contrast,
          threshold,
          message: `scene ${s.activeSceneId || "?"}: "${t.slice(0, 40)}" contrast ${v.contrast.toFixed(2)}:1 < ${threshold}:1`,
        });
      }
      if (v.fontSize > 0 && v.fontSize < 24) {
        // Only flag truly tiny text — kicker/url/footer may legitimately sit
        // at 18-24px. Below 18 is hard to read at 1080p.
        if (v.fontSize < 18) {
          findings.accessibility.push({
            kind: "small-text",
            scene: s.activeSceneId,
            text: t.slice(0, 40),
            fontSize: v.fontSize,
            message: `scene ${s.activeSceneId || "?"}: "${t.slice(0, 40)}" at ${v.fontSize.toFixed(1)}px — hard to read at 1080p`,
          });
        }
      }
    }
  }

  // ---- brand palette use ------------------------------------------------
  // Two checks:
  //   (a) per-scene background hex must appear in the brand-token set (or be
  //       transparent / inherit), else warn.
  //   (b) the assembled HTML's inline <style> blocks must reference
  //       var(--card-) at least once — zero references means the template
  //       hardcoded its own palette and silently bypassed brand tokens.
  if (!tokenHexes || tokenHexes.size === 0) {
    findings.brandPaletteUse.push({
      kind: "no-tokens",
      message: tokensPath
        ? `tokens file ${path.relative(projectRoot, tokensPath).replace(/\\/g, "/")} parsed but yielded no brand hex codes — palette check skipped`
        : `no design/tokens-<slug>.css resolved for this comp — palette check skipped`,
    });
  } else {
    // (a) scene bg vs brand-set
    if (sceneCensus && sceneCensus.size) {
      for (const [sceneId, c] of sceneCensus) {
        if (!c.bgHex) continue; // transparent / inherit — skip
        if (!tokenHexes.has(c.bgHex)) {
          findings.brandPaletteUse.push({
            kind: "scene-bg-off-palette",
            scene: sceneId,
            bgHex: c.bgHex,
            message: `scene ${sceneId}: surface color ${c.bgHex} not in brand tokens`,
          });
        }
      }
    }
    // (b) var(--card-) reference count in inline <style> blocks
    let varRefs = 0;
    if (compHtml) {
      const styleBlocks = [...compHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
      for (const block of styleBlocks) {
        const matches = block.match(/var\(--card-/g);
        if (matches) varRefs += matches.length;
      }
    }
    if (varRefs === 0) {
      findings.brandPaletteUse.push({
        kind: "zero-var-refs",
        severity: "error",
        message: `zero var(--card-) references in assembled comp — brand tokens completely bypassed`,
      });
    } else {
      findings.brandPaletteUse.push({
        kind: "var-refs-present",
        count: varRefs,
        message: `${varRefs} var(--card-) reference${varRefs === 1 ? "" : "s"} in assembled <style> — brand tokens consumed`,
      });
    }
  }

  // ---- brand asset use --------------------------------------------------
  // For each asset listed in assets/<slug>/manifest.json, look for an exact
  // src="<path>" match in the assembled HTML. Pulled-but-unused = wasted
  // extraction. If BOTH hero AND logo are unused, escalate to a single error
  // (visual identity completely absent).
  if (!manifestAssets) {
    findings.brandAssetUse.push({
      kind: "no-manifest",
      message: manifestPath
        ? `manifest.json found at ${path.relative(projectRoot, manifestPath).replace(/\\/g, "/")} but no assets[] array — asset check skipped`
        : `no assets/<slug>/manifest.json — asset check skipped`,
    });
  } else if (manifestAssets.length === 0) {
    findings.brandAssetUse.push({
      kind: "manifest-empty",
      message: `manifest.json has zero assets — nothing to check`,
    });
  } else {
    let heroUnused = false;
    let heroPresent = false;
    let logoUnused = false;
    let logoPresent = false;
    let unusedCount = 0;
    for (const asset of manifestAssets) {
      const assetPath = (asset?.path || "").replace(/\\/g, "/");
      if (!assetPath) continue;
      const kind = (asset?.kind || "asset").toLowerCase();
      // Exact src= match — quoted with either " or ' so we don't false-positive
      // on a substring of a longer path. Also tolerate ./ prefix.
      const pattern = new RegExp(
        `src=["'](?:\\.\\/)?${assetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`
      );
      const used = pattern.test(compHtml || "");
      if (kind === "hero") { heroPresent = true; if (!used) heroUnused = true; }
      if (kind === "logo") { logoPresent = true; if (!used) logoUnused = true; }
      if (!used) {
        unusedCount++;
        findings.brandAssetUse.push({
          kind: "asset-unused",
          assetKind: kind,
          assetPath,
          message: `asset ${kind} (${assetPath}) was pulled but never shown in the comp`,
        });
      }
    }
    if (heroPresent && logoPresent && heroUnused && logoUnused) {
      // Escalate: drop the per-asset warns for hero+logo and replace with a
      // single error finding (the brief calls for "single error finding").
      findings.brandAssetUse = findings.brandAssetUse.filter(f =>
        !(f.kind === "asset-unused" && (f.assetKind === "hero" || f.assetKind === "logo"))
      );
      findings.brandAssetUse.push({
        kind: "visual-identity-absent",
        severity: "error",
        message: `brand visual identity completely absent: neither hero nor logo appears in any scene`,
      });
    }
    if (unusedCount === 0) {
      findings.brandAssetUse.push({
        kind: "all-shown",
        message: `all ${manifestAssets.length} pulled asset${manifestAssets.length === 1 ? "" : "s"} appear in the comp`,
      });
    }
  }

  // ---- scene visual density --------------------------------------------
  // Text-only scene = zero images AND zero decorative non-text elements AND
  // (effectively) default surface bg. 3+ consecutive text-only scenes = "comp
  // reads as editorial slideshow rather than brand video" — single error.
  if (sceneCensus && sceneCensus.size) {
    // Order by start time so "consecutive" is meaningful.
    const sceneOrder = [];
    for (const s of samples) {
      if (!s.activeSceneId) continue;
      if (!sceneOrder.includes(s.activeSceneId) && sceneCensus.has(s.activeSceneId)) {
        sceneOrder.push(s.activeSceneId);
      }
    }
    const textOnlyFlags = sceneOrder.map(id => ({
      id, textOnly: !!sceneCensus.get(id)?.textOnly,
    }));
    let maxRun = 0;
    let curRun = 0;
    for (const f of textOnlyFlags) {
      if (f.textOnly) {
        curRun++;
        if (curRun > maxRun) maxRun = curRun;
      } else {
        curRun = 0;
      }
    }
    for (const f of textOnlyFlags) {
      if (!f.textOnly) continue;
      const c = sceneCensus.get(f.id);
      findings.sceneVisualDensity.push({
        kind: "text-only-scene",
        scene: f.id,
        bgHex: c?.bgHex || null,
        message: `scene ${f.id} is text-only on default background`,
      });
    }
    if (maxRun >= 3) {
      findings.sceneVisualDensity.push({
        kind: "consecutive-text-only",
        severity: "error",
        runLength: maxRun,
        message: `${maxRun}+ consecutive text-only scenes — comp reads as editorial slideshow rather than brand video`,
      });
    }
  } else {
    findings.sceneVisualDensity.push({
      kind: "no-census",
      message: `scene census not available — visual density check skipped`,
    });
  }

  // ---- motion continuity ------------------------------------------------
  // Per-scene PNG-byte-diff between adjacent timestamp samples (see
  // checkMotionContinuity). Emit one finding per static / near-static pair,
  // and escalate when a single scene racks up 2+ static pairs or all of its
  // pairs are near-static (whole-scene freeze).
  if (motionContinuity && Array.isArray(motionContinuity.perScene) && motionContinuity.perScene.length) {
    for (const scene of motionContinuity.perScene) {
      const staticPairs = scene.pairs.filter(p => p.kind === "static");
      const nearPairs = scene.pairs.filter(p => p.kind === "near-static");
      const nonMoving = staticPairs.length + nearPairs.length;

      // (1) Whole-scene freeze: every pair is static OR near-static (and we
      //     have at least 2 pairs to draw a conclusion from).
      if (scene.pairs.length >= 2 && nonMoving === scene.pairs.length) {
        const sceneDur = (scene.windowEnd - scene.windowStart + 1).toFixed(0);
        findings.motionContinuity.push({
          kind: "scene-frozen",
          severity: "error",
          scene: scene.sceneId,
          pairCount: scene.pairs.length,
          message: `scene ${scene.sceneId} is fully static across its ${sceneDur}s duration — no visible motion in any sampled pair`,
        });
        continue; // don't double-report individual moments for a frozen scene
      }

      // (2) Multiple static moments in same scene = "PowerPoint" hand-off.
      if (staticPairs.length >= 2) {
        findings.motionContinuity.push({
          kind: "multiple-static",
          severity: "error",
          scene: scene.sceneId,
          staticCount: staticPairs.length,
          pairs: staticPairs.map(p => `${p.aT}s–${p.bT}s`),
          message: `scene ${scene.sceneId} has ${staticPairs.length} consecutive static frames (${staticPairs.map(p => `${p.aT}s–${p.bT}s`).join(", ")}) — reads as PowerPoint, not video`,
        });
        // fall through — we still want to surface near-static moments
      }

      // (3) Single static or near-static moment → warn, one per pair.
      for (const p of staticPairs) {
        // If we already escalated via (2), skip the per-pair warns.
        if (staticPairs.length >= 2) continue;
        findings.motionContinuity.push({
          kind: "static-moment",
          scene: scene.sceneId,
          atStart: p.aT,
          atEnd: p.bT,
          message: `scene ${scene.sceneId} at t=${p.aT}s–${p.bT}s: identical frames, no visible motion`,
        });
      }
      for (const p of nearPairs) {
        findings.motionContinuity.push({
          kind: "near-static-moment",
          scene: scene.sceneId,
          atStart: p.aT,
          atEnd: p.bT,
          diffPct: p.diffPct,
          message: `scene ${scene.sceneId} at t=${p.aT}s–${p.bT}s: near-static (${(p.diffPct * 100).toFixed(2)}% byte change)`,
        });
      }
    }
    // Add an "ok" line if no findings — useful for the markdown report.
    if (findings.motionContinuity.length === 0) {
      findings.motionContinuity.push({
        kind: "ok",
        message: `all ${motionContinuity.perScene.length} scenes show pixel motion between adjacent samples`,
      });
    }
  } else {
    findings.motionContinuity.push({
      kind: "no-frames",
      message: `motion continuity check did not run (no scene windows or screenshot failure)`,
    });
  }

  // ---- script timing ----------------------------------------------------
  // Cross-check spoken word ↔ visible text ↔ scene structure. Catches three
  // failure modes the verifier was previously blind to:
  //   1) script density imbalance — one scene crammed, another empty.
  //   2) scene-narration mismatch — visuals on a different beat than audio.
  //   3) word-emphasis orphan — brand-name spoken in mid-scene quiet.
  // Plus two informational signals: silence beats + total budget.
  //
  // Heuristic-only — no LLM calls. Tokenize lowercase non-stopwords, score
  // overlap. Cheap and deterministic.
  const stHtmlScenes = Array.isArray(sceneWindowsHtml) ? sceneWindowsHtml : [];
  const fxEvents = Array.isArray(emphasisEvents) ? emphasisEvents : [];

  if (!vttCues.length) {
    findings.scriptTiming.push({
      kind: "no-vtt",
      message: `no VTT cues — script-timing checks skipped`,
    });
  } else if (!stHtmlScenes.length) {
    findings.scriptTiming.push({
      kind: "no-scenes",
      message: `no .scene.clip windows parsed from comp HTML — script-timing checks skipped`,
    });
  } else {
    const sceneVisibleTokens = buildSceneVisibleTokens(samples);
    const cueBeatMap = buildCueBeatMap(vttCues, copyJson, durationS);
    const beats = Array.isArray(copyJson?.beats) ? copyJson.beats : [];

    // Group cues by scene (HTML-derived windows — authoritative).
    const sceneCues = new Map();
    for (const sc of stHtmlScenes) sceneCues.set(sc.id, []);
    for (const cue of vttCues) {
      const cueT = (cue.start + cue.end) / 2;
      const sc = sceneAt(stHtmlScenes, cueT);
      if (!sc) continue;
      sceneCues.get(sc.id).push(cue);
    }

    // 1) script-density-imbalance ------------------------------------------
    // Per-scene words/sec vs comp average. Outliers <0.5x or >2.0x flag.
    let totalSpokenWords = 0;
    let totalSpokenDur = 0;
    const densityRows = [];
    for (const sc of stHtmlScenes) {
      const cues = sceneCues.get(sc.id) || [];
      const wps = cues.length / Math.max(0.001, sc.duration);
      densityRows.push({ sceneId: sc.id, words: cues.length, dur: sc.duration, wps });
      totalSpokenWords += cues.length;
      totalSpokenDur += sc.duration;
    }
    const compAvgWps = totalSpokenDur > 0 ? totalSpokenWords / totalSpokenDur : 0;
    if (compAvgWps > 0) {
      for (const row of densityRows) {
        // Skip near-empty CTA scenes (<2 spoken words) — narration almost
        // always tapers before the CTA, that's a feature not a bug.
        if (row.words < 2) continue;
        const ratio = row.wps / compAvgWps;
        if (ratio > 2.0) {
          findings.scriptTiming.push({
            kind: "script-density-imbalance",
            scene: row.sceneId,
            wordsPerSec: +row.wps.toFixed(2),
            ratio: +ratio.toFixed(2),
            message: `scene ${row.sceneId}: ${row.wps.toFixed(2)} words/sec is ${ratio.toFixed(1)}x the comp avg (${compAvgWps.toFixed(2)}) — reads as rushed`,
          });
        } else if (ratio < 0.5) {
          findings.scriptTiming.push({
            kind: "script-density-imbalance",
            scene: row.sceneId,
            wordsPerSec: +row.wps.toFixed(2),
            ratio: +ratio.toFixed(2),
            message: `scene ${row.sceneId}: ${row.wps.toFixed(2)} words/sec is ${ratio.toFixed(2)}x the comp avg (${compAvgWps.toFixed(2)}) — reads as draggy`,
          });
        }
      }
    }

    // 2) scene-narration-mismatch ------------------------------------------
    // For each scene, what % of its spoken words have ANY token overlap
    // with the visible text in that scene? <25% = visual drift.
    for (const sc of stHtmlScenes) {
      const cues = sceneCues.get(sc.id) || [];
      if (cues.length < 4) continue; // too few words — skip noise
      const visTokens = sceneVisibleTokens.get(sc.id) || new Set();
      if (!visTokens.size) continue; // empty scene already flagged elsewhere
      let aligned = 0;
      for (const cue of cues) {
        const wTokens = tokenizeForScriptTiming(cue.word || "");
        if (!wTokens.length) continue;
        const beatIdx = cueBeatMap.get(cue);
        const beat = (beatIdx != null) ? beats[beatIdx] : null;
        const beatTokens = beat
          ? new Set([
              ...tokenizeForScriptTiming(beat.headline || ""),
              ...tokenizeForScriptTiming(beat.body || ""),
              ...tokenizeForScriptTiming(beat.kicker || ""),
            ])
          : null;
        // Alignment fires if (a) the spoken word itself appears in the
        // scene's visible text, OR (b) the beat the word belongs to shares
        // any token with the visible text. The former handles literal
        // matches ("local" → "Just local."), the latter handles paraphrase
        // (narration says "doors down" while visual says "neighbours").
        let hit = false;
        for (const wt of wTokens) {
          if (visTokens.has(wt)) { hit = true; break; }
        }
        if (!hit && beatTokens) {
          for (const bt of beatTokens) {
            if (visTokens.has(bt)) { hit = true; break; }
          }
        }
        if (hit) aligned++;
      }
      const pct = aligned / cues.length;
      if (pct < 0.25) {
        findings.scriptTiming.push({
          kind: "scene-narration-mismatch",
          scene: sc.id,
          alignedWords: aligned,
          totalWords: cues.length,
          alignmentPct: +(pct * 100).toFixed(0),
          message: `scene ${sc.id}: only ${aligned}/${cues.length} spoken words (${(pct * 100).toFixed(0)}%) align with visible text — visuals on a different beat`,
        });
      }
    }

    // 3) silence-beat-misplaced (info) -------------------------------------
    // Gaps > 1.0s between adjacent VTT cues — informational.
    for (let i = 1; i < vttCues.length; i++) {
      const gap = vttCues[i].start - vttCues[i - 1].end;
      if (gap <= 1.0) continue;
      const midT = (vttCues[i - 1].end + vttCues[i].start) / 2;
      const sc = sceneAt(stHtmlScenes, midT);
      findings.scriptTiming.push({
        kind: "silence-beat-misplaced",
        scene: sc ? sc.id : null,
        atStart: +vttCues[i - 1].end.toFixed(2),
        atEnd: +vttCues[i].start.toFixed(2),
        durationS: +gap.toFixed(2),
        message: `silence gap ${gap.toFixed(2)}s in scene ${sc ? sc.id : "(none)"} (${vttCues[i - 1].end.toFixed(2)}s–${vttCues[i].start.toFixed(2)}s)`,
      });
    }

    // 4) narration-overrun-into-cta (watch) + narration-past-comp-end (error)
    // Two related cases:
    //  - Narration runs past the LAST .scene.clip start (the CTA): WATCH.
    //    Some templates deliberately speak the CTA tagline as the CTA
    //    appears (designed audio/visual sync). Flagging as a watch keeps
    //    it visible without blocking ship.
    //  - Narration runs past the COMP end: ERROR. The audio gets clipped
    //    at render time — definitely a bug.
    if (stHtmlScenes.length >= 2) {
      const lastScene = stHtmlScenes[stHtmlScenes.length - 1];
      const lastCueEnd = vttCues[vttCues.length - 1].end;
      const compEnd = lastScene.end;
      if (lastCueEnd > compEnd + 0.05) {
        findings.scriptTiming.push({
          kind: "narration-past-comp-end",
          severity: "error",
          scene: lastScene.id,
          narrationEnd: +lastCueEnd.toFixed(2),
          compEnd: +compEnd.toFixed(2),
          overrunS: +(lastCueEnd - compEnd).toFixed(2),
          message: `narration ends at ${lastCueEnd.toFixed(2)}s but comp ends at ${compEnd.toFixed(2)}s — narration will be clipped by ${(lastCueEnd - compEnd).toFixed(2)}s`,
        });
      } else if (lastCueEnd > lastScene.start + 0.05) {
        findings.scriptTiming.push({
          kind: "narration-overrun-into-cta",
          scene: lastScene.id,
          narrationEnd: +lastCueEnd.toFixed(2),
          ctaStart: +lastScene.start.toFixed(2),
          overrunS: +(lastCueEnd - lastScene.start).toFixed(2),
          message: `narration ends at ${lastCueEnd.toFixed(2)}s but CTA scene ${lastScene.id} starts at ${lastScene.start.toFixed(2)}s — narration overruns into CTA by ${(lastCueEnd - lastScene.start).toFixed(2)}s (acceptable when narration speaks the CTA tagline)`,
        });
      }
    }

    // 5) word-emphasis-orphan ----------------------------------------------
    // Identity tokens (brand name / URL host / cta verb / first-beat keywords)
    // should land at a visual emphasis moment: first 1.5s of a scene OR
    // within 0.3s of a stamp/glitch/burst/etc event.
    const identityTokens = buildIdentityTokens(copyJson, brandName, brandUrl);
    const orphanSeen = new Set(); // de-dupe per (token, scene)
    if (identityTokens.size) {
      for (const cue of vttCues) {
        const wTokens = tokenizeForScriptTiming(cue.word || "");
        const isIdentity = wTokens.some(t => identityTokens.has(t));
        if (!isIdentity) continue;
        const cueMid = (cue.start + cue.end) / 2;
        const sc = sceneAt(stHtmlScenes, cueMid);
        if (!sc) continue;
        const intoScene = cueMid - sc.start;
        const inEntrance = intoScene <= 1.5;
        let nearStamp = false;
        for (const ev of fxEvents) {
          if (Math.abs(ev.at - cueMid) <= 0.3) { nearStamp = true; break; }
        }
        if (inEntrance || nearStamp) continue;
        const idTok = wTokens.find(t => identityTokens.has(t)) || cue.word;
        const key = `${idTok}::${sc.id}`;
        if (orphanSeen.has(key)) continue;
        orphanSeen.add(key);
        findings.scriptTiming.push({
          kind: "word-emphasis-orphan",
          scene: sc.id,
          atSec: +cueMid.toFixed(2),
          token: idTok,
          message: `identity word "${cue.word}" spoken at ${cueMid.toFixed(2)}s in scene ${sc.id} lands in mid-scene quiet (no entrance/stamp event within 0.3s)`,
        });
      }
    }

    // 6) script-fits-budget (info) -----------------------------------------
    // Total narration duration vs comp duration.
    const lastEnd = vttCues[vttCues.length - 1].end;
    const slack = durationS - lastEnd;
    findings.scriptTiming.push({
      kind: "script-fits-budget",
      narrationS: +lastEnd.toFixed(2),
      compS: durationS,
      slackS: +slack.toFixed(2),
      message: slack >= 0
        ? `narration runs ${lastEnd.toFixed(2)}s of ${durationS}s comp — ${slack.toFixed(2)}s slack`
        : `narration runs ${lastEnd.toFixed(2)}s vs ${durationS}s comp — ${(-slack).toFixed(2)}s overrun`,
    });
  }

  return findings;
}

function deriveVerdict(findings) {
  // Major (blocks ship):
  //   - any placeholder leakage (template seed text leaked through)
  //   - brand name absent from visible text
  //   - URL host absent from visible text
  //   - zero var(--card-) refs in assembled <style> (palette bypassed)
  //   - both hero AND logo unused (visual identity absent)
  //   - 3+ consecutive text-only scenes (editorial slideshow)
  //   - any motion-continuity error (scene-frozen / multiple-static)
  // We deliberately don't escalate `beat-headline-missing` to major: the comp
  // may have been hand-written or recut without exact-headline-substring
  // match, which is fine. It's a "watch" signal.
  const motionMajor = (findings.motionContinuity || []).some(f =>
    f.kind === "scene-frozen" || f.kind === "multiple-static"
  );
  // Script-timing majors:
  //   - any narration-past-comp-end (audio clipped at render — hard error)
  //   - 2+ scene-narration-mismatch warnings (script + visuals disagree)
  // narration-overrun-into-cta is a watch signal, not a major — it's a
  // designed pattern in some templates (CTA tagline spoken as CTA appears).
  const scriptTiming = findings.scriptTiming || [];
  const narrationPastEnd = scriptTiming.some(f => f.kind === "narration-past-comp-end");
  const sceneMismatchCount = scriptTiming.filter(f => f.kind === "scene-narration-mismatch").length;
  const scriptTimingMajor = narrationPastEnd || sceneMismatchCount >= 2;
  const newErrors =
    findings.brandPaletteUse.some(f => f.kind === "zero-var-refs") ||
    findings.brandAssetUse.some(f => f.kind === "visual-identity-absent") ||
    findings.sceneVisualDensity.some(f => f.kind === "consecutive-text-only") ||
    motionMajor ||
    scriptTimingMajor;
  const hasMajor =
    findings.placeholderLeakage.length > 0 ||
    findings.brandFidelity.some(f => f.kind === "brand-name-missing" || f.kind === "url-missing") ||
    newErrors;
  const watchSignals =
    findings.pacing.length +
    findings.accessibility.length +
    findings.composition.filter(f => f.kind !== "ok").length +
    findings.brandFidelity.filter(f => f.kind === "beat-headline-missing").length +
    findings.audioCoverage.filter(f => f.kind !== "ok").length +
    findings.brandPaletteUse.filter(f => f.kind === "scene-bg-off-palette").length +
    findings.brandAssetUse.filter(f => f.kind === "asset-unused").length +
    findings.sceneVisualDensity.filter(f => f.kind === "text-only-scene").length +
    (findings.motionContinuity || []).filter(f =>
      f.kind === "static-moment" || f.kind === "near-static-moment"
    ).length +
    // Script-timing watch signals — density outliers + lone scene-mismatch +
    // word-emphasis orphans + narration-overrun-into-cta (designed pattern
    // when narration speaks the CTA tagline, but worth surfacing).
    // silence-beat / script-fits-budget are info-only.
    scriptTiming.filter(f =>
      f.kind === "script-density-imbalance" ||
      f.kind === "scene-narration-mismatch" ||
      f.kind === "word-emphasis-orphan" ||
      f.kind === "narration-overrun-into-cta"
    ).length;
  if (hasMajor) return "needs-fix";
  if (watchSignals > 2) return "watch";
  return "ship";
}

function writeMarkdownReport({ outPath, slug, template, tone, durationS, samples, vttCues, copyJson, findings, verdict }) {
  const lines = [];
  lines.push(`# Render Verification — ${slug}`);
  lines.push("");
  lines.push(`- date: ${new Date().toISOString()}`);
  lines.push(`- template: ${template || "(unknown)"}`);
  lines.push(`- tone: ${tone || "(unknown)"}`);
  lines.push(`- duration: ${durationS}s`);
  lines.push(`- vtt cues: ${vttCues.length}`);
  lines.push(`- verdict: **${verdict}**`);
  lines.push("");

  lines.push("## Per-second alignment");
  lines.push("");
  lines.push("| t | scene | spoken | visible (top 3) |");
  lines.push("| --- | --- | --- | --- |");
  for (const s of samples) {
    const spoken = wordAt(vttCues, s.t) || "—";
    const top = s.visible
      .map(v => v.text)
      .filter(Boolean)
      .slice(0, 3)
      .map(t => t.replace(/\|/g, "/").slice(0, 50))
      .join(" · ") || "—";
    lines.push(`| ${s.t} | ${s.activeSceneId || "—"} | ${spoken.replace(/\|/g, "/")} | ${top} |`);
  }
  lines.push("");

  const renderSection = (title, items, emptyText) => {
    lines.push(`## ${title}`);
    lines.push("");
    if (!items.length) {
      lines.push(`_${emptyText}_`);
      lines.push("");
      return;
    }
    for (const f of items) {
      lines.push(`- ${f.message}`);
    }
    lines.push("");
  };
  renderSection("Composition", findings.composition, "no scene-text findings");
  renderSection("Brand fidelity", findings.brandFidelity, "no brand-fidelity findings");
  renderSection("Placeholder leakage", findings.placeholderLeakage, "no template seed-copy detected");
  renderSection("Pacing", findings.pacing, "scene lengths look balanced");
  renderSection("Audio coverage", findings.audioCoverage, "no audio coverage findings");
  renderSection("Accessibility", findings.accessibility, "no contrast/size findings");
  renderSection("Brand palette use", findings.brandPaletteUse, "no palette findings");
  renderSection("Brand asset use", findings.brandAssetUse, "no asset findings");
  renderSection("Scene visual density", findings.sceneVisualDensity, "no scene-density findings");
  renderSection("Motion continuity", findings.motionContinuity, "no motion-continuity findings");
  renderSection("Script timing", findings.scriptTiming || [], "no script-timing findings");

  lines.push("## Verdict");
  lines.push("");
  if (verdict === "ship") {
    lines.push("`ship` — no major findings. Render is consistent with copy.json + narration timing.");
  } else if (verdict === "watch") {
    lines.push("`watch` — render is shippable but multiple minor findings (pacing, contrast, layout). Worth a glance before posting.");
  } else {
    lines.push("`needs-fix` — major findings (placeholder leakage and/or missing brand). Fix before re-rendering.");
  }
  lines.push("");

  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
}

function appendLedgerRow({ slug, template, tone, durationS, findings, verdict }) {
  const ledgerPath = path.join(projectRoot, "docs", "render-learnings", "LEDGER.md");
  const dateStr = new Date().toISOString().slice(0, 10);
  const majorBits = [];
  if (findings.placeholderLeakage.length) majorBits.push(`${findings.placeholderLeakage.length} placeholder leak`);
  // Only "brand-name-missing" / "url-missing" are major. "beat-headline-missing"
  // is a watch signal (recut comps may not preserve copy.json's exact wording).
  const missingBrand = findings.brandFidelity.some(f => f.kind === "brand-name-missing" || f.kind === "url-missing");
  if (missingBrand) majorBits.push("brand missing");
  const headlineMisses = findings.brandFidelity.filter(f => f.kind === "beat-headline-missing").length;
  if (headlineMisses) majorBits.push(`${headlineMisses} headline mismatch`);
  const pacingCount = findings.pacing.length;
  if (pacingCount) majorBits.push(`${pacingCount} pacing`);
  const a11yCount = findings.accessibility.length;
  if (a11yCount) majorBits.push(`${a11yCount} a11y`);
  const audioIssue = findings.audioCoverage.some(f => f.kind !== "ok" && f.kind !== "no-vtt");
  if (audioIssue) majorBits.push("audio gap");
  // New brand-fidelity categories — surface in a sized, plain-language form.
  const paletteOff = findings.brandPaletteUse.filter(f => f.kind === "scene-bg-off-palette").length;
  if (paletteOff) majorBits.push(`${paletteOff} palette mismatch`);
  if (findings.brandPaletteUse.some(f => f.kind === "zero-var-refs")) majorBits.push("zero brand tokens");
  const unusedAssets = findings.brandAssetUse.filter(f => f.kind === "asset-unused").length;
  if (unusedAssets) majorBits.push(`${unusedAssets} unused asset${unusedAssets === 1 ? "" : "s"}`);
  if (findings.brandAssetUse.some(f => f.kind === "visual-identity-absent")) majorBits.push("hero+logo absent");
  const textOnly = findings.sceneVisualDensity.filter(f => f.kind === "text-only-scene").length;
  if (textOnly) majorBits.push(`${textOnly} text-only`);
  // Motion continuity chips: per-scene freezes / static-moment counts.
  const motion = findings.motionContinuity || [];
  const frozenScenes = motion.filter(f => f.kind === "scene-frozen").map(f => f.scene);
  if (frozenScenes.length) {
    majorBits.push(`scene ${frozenScenes.join(",")} fully static`);
  }
  const multiStatic = motion.filter(f => f.kind === "multiple-static");
  for (const m of multiStatic) {
    majorBits.push(`scene ${m.scene}: ${m.staticCount} static moments`);
  }
  const staticMoments = motion.filter(f => f.kind === "static-moment").length;
  const nearStaticMoments = motion.filter(f => f.kind === "near-static-moment").length;
  if (staticMoments) majorBits.push(`${staticMoments} static moment${staticMoments === 1 ? "" : "s"}`);
  if (nearStaticMoments) majorBits.push(`${nearStaticMoments} near-static`);
  // Script-timing chips: scene-mismatch · narration overruns · density outliers
  // · emphasis orphans. silence-beat + script-fits-budget are info-only and
  // omitted from the ledger row to keep the chips load-bearing.
  const scriptTiming = findings.scriptTiming || [];
  const sceneMismatches = scriptTiming.filter(f => f.kind === "scene-narration-mismatch").length;
  if (sceneMismatches) majorBits.push(`${sceneMismatches} scene-mismatch`);
  if (scriptTiming.some(f => f.kind === "narration-past-comp-end")) majorBits.push("narration past comp end");
  if (scriptTiming.some(f => f.kind === "narration-overrun-into-cta")) majorBits.push("narration into cta");
  const densityOut = scriptTiming.filter(f => f.kind === "script-density-imbalance").length;
  if (densityOut) majorBits.push(`${densityOut} density outlier${densityOut === 1 ? "" : "s"}`);
  const emphasisOrphans = scriptTiming.filter(f => f.kind === "word-emphasis-orphan").length;
  if (emphasisOrphans) majorBits.push(`${emphasisOrphans} emphasis orphan${emphasisOrphans === 1 ? "" : "s"}`);
  const major = majorBits.length ? majorBits.join(", ") : "clean";

  const cells = [dateStr, slug, template || "—", tone || "—", `${durationS}s`, major, verdict];
  const row = `| ${cells.map(c => String(c).replace(/\|/g, "/")).join(" | ")} |`;

  let cur = "";
  try { cur = fs.readFileSync(ledgerPath, "utf8"); } catch { /* file may not exist yet */ }
  if (!cur.includes("| date |")) {
    cur = (cur || "").trimEnd() +
      "\n\n| date | slug | template | tone | duration | major findings | verdict |\n" +
      "| --- | --- | --- | --- | --- | --- | --- |\n";
  }
  fs.writeFileSync(ledgerPath, cur.trimEnd() + "\n" + row + "\n", "utf8");
}

// --- main -----------------------------------------------------------------
const t0 = Date.now();

const compPath = abs(compArg);
if (!fileExists(compPath)) {
  console.error(`✗ comp not found: ${compPath}`);
  process.exit(2);
}

// Slug derivation: explicit --copy wins (its filename IS the slug), else
// use comp filename without extension, then guessSlugFromIndex for index.html.
// Without the --copy short-circuit, guessSlugFromIndex's sha256 lookup can
// match stale per-brand meta.json files and pick the wrong slug — caller
// already passed --copy, trust that.
const compBaseName = path.basename(compPath, ".html");
let slug;
if (copyArg) {
  slug = path.basename(copyArg).replace(/\.copy\.json$/, "");
} else if (compBaseName === "index") {
  slug = guessSlugFromIndex(compPath);
} else {
  slug = compBaseName;
}

const copyPath = abs(copyArg || `compositions/${slug}.copy.json`);
const vttPath = abs(vttArg || `assets/voiceover/${slug}.vtt`);

let copyJson = null;
if (fileExists(copyPath)) {
  try { copyJson = readJson(copyPath); } catch (err) { console.warn(`  ! couldn't parse ${copyPath}: ${err.message}`); }
} else {
  console.warn(`  ! copy.json not found at ${copyPath} — running without copy data`);
}

let vttCues = [];
if (fileExists(vttPath)) {
  try { vttCues = parseVtt(fs.readFileSync(vttPath, "utf8")); }
  catch (err) { console.warn(`  ! couldn't parse vtt ${vttPath}: ${err.message}`); }
} else {
  console.warn(`  ! vtt not found at ${vttPath} — running without narration timing`);
}

console.log(`▶ verify-render ${path.relative(projectRoot, compPath)}`);
console.log(`  slug=${slug}  copy=${fileExists(copyPath) ? "yes" : "no"}  vtt=${vttCues.length ? vttCues.length + " cues" : "no"}`);

let serverInfo;
try { serverInfo = await ensureServer(); }
catch (err) { console.error(`✗ ${err.message}`); process.exit(2); }

if (serverInfo.spawned) console.log(`  preview spawned on :${port}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

// Load the comp via file:// rather than the preview server's per-project
// route. Why: the preview-shell injects studio chrome that historically
// rendered comp content as raw source-as-text on this Windows env, which
// silently zeroed out the visible-text capture (every scene looked
// "no visible text at any sampled second"). The motion-continuity check
// already side-steps the same issue by using file:// for screenshots —
// reuse that proven path here. The preview server stays up (ensureServer
// above) so the user can keep the studio open while we verify.
const fileUrl = "file:///" + compPath.replace(/\\/g, "/");

try {
  await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForFunction(
    () => window.__timelines && Object.keys(window.__timelines).length > 0,
    { timeout: 8000 }
  );
} catch (err) {
  console.error(`✗ navigation/timeline-wait failed: ${err.message}`);
  await browser.close();
  process.exit(2);
}

const probe = await page.evaluate(() => {
  const tlKey = Object.keys(window.__timelines)[0];
  const tl = window.__timelines[tlKey];
  return {
    tlKey,
    duration: tl.duration(),
    title: document.title,
    sceneCount: document.querySelectorAll(".scene").length,
  };
});
const durationS = Math.round(probe.duration);
console.log(`  timeline ${probe.tlKey} · ${durationS}s · ${probe.sceneCount} scenes`);

const samples = await scrubTimeline(page, durationS);

// --- brand-token + manifest preload (for new check categories) -----------
// Read raw HTML once for the var(--card-) census + asset src= match.
let compHtml = "";
try { compHtml = fs.readFileSync(compPath, "utf8"); } catch {}

// Resolve tokens path (slug, then copyJson.slug, then short-form fallback).
let copyJsonForTokens = null;
if (fileExists(copyPath)) {
  try { copyJsonForTokens = readJson(copyPath); } catch {}
}
const tokensPath = resolveTokensPath(slug, copyJsonForTokens);
let tokenHexes = new Set();
if (tokensPath) {
  try { tokenHexes = parseBrandTokenHexes(fs.readFileSync(tokensPath, "utf8")); }
  catch (err) { console.warn(`  ! couldn't parse tokens ${tokensPath}: ${err.message}`); }
}

// Build scene windows for the census pass — derived from samples we already
// have (avoids a second full scrub).
const sceneWindowsForCensus = new Map();
for (const s of samples) {
  if (!s.activeSceneId) continue;
  const w = sceneWindowsForCensus.get(s.activeSceneId) || { start: Infinity, end: -Infinity };
  w.start = Math.min(w.start, s.t);
  w.end = Math.max(w.end, s.t);
  sceneWindowsForCensus.set(s.activeSceneId, w);
}

// Run scene census while the page is still open.
let sceneCensus = new Map();
try {
  sceneCensus = await censusScenes(page, sceneWindowsForCensus, [...tokenHexes]);
} catch (err) {
  console.warn(`  ! scene census failed: ${err.message}`);
}

// Compute the run stamp NOW so the motion-continuity frame dir can use it
// (the same stamp later names the JSON + markdown report).
const stamp = tsStamp();

// Run motion-continuity check — capture comp-rect screenshots and PNG-byte-
// diff between adjacent samples per scene. Catches "PowerPoint" failure
// mode in <30s, before the 7-minute MP4 render. Uses a 2nd page in the
// SAME browser instance pointed at the file:// URL (the preview server's
// shell injects studio chrome that breaks pixel screenshots on this env).
let motionContinuity = null;
try {
  motionContinuity = await checkMotionContinuity(
    browser, compPath, sceneWindowsForCensus, durationS, slug, stamp
  );
} catch (err) {
  console.warn(`  ! motion-continuity check failed: ${err.message}`);
}

await browser.close();

// Read manifest.json (canonical asset list from pull-assets.mjs).
const manifestCandidates = [
  abs(`assets/${slug}/manifest.json`),
];
if (copyJsonForTokens?.slug && copyJsonForTokens.slug !== slug) {
  manifestCandidates.push(abs(`assets/${copyJsonForTokens.slug}/manifest.json`));
}
let manifestPath = null;
let manifestAssets = null;
for (const cand of manifestCandidates) {
  if (fileExists(cand)) {
    manifestPath = cand;
    try {
      const m = readJson(cand);
      if (Array.isArray(m?.assets)) { manifestAssets = m.assets; break; }
    } catch (err) {
      console.warn(`  ! couldn't parse manifest ${cand}: ${err.message}`);
    }
  }
}

// Brand identity for fidelity checks. Order:
//   1) copy.json title prefix (most reliable when copy exists)
//   2) copy.json slug
//   3) page <title> from the comp HTML — handles hand-recut comps without copy
//   4) slug from filename (last resort, may be a recut-suffix variant)
const brandName = (() => {
  if (copyJson?.title) return copyJson.title.split(/[—\-|·:]/)[0].trim().slice(0, 24);
  if (copyJson?.slug) return copyJson.slug;
  try {
    const html = fs.readFileSync(compPath, "utf8");
    const tm = html.match(/<title>([^<]+)<\/title>/i);
    if (tm) {
      const t = tm[1].split(/[—\-|·:]/)[0].trim();
      if (t.length > 1 && t.length < 30) return t;
    }
  } catch {}
  return slug;
})();
const brandUrl = copyJson?.url || copyJson?.cta?.url || null;
const template = copyJson?.template || null;
// Tone is not in copy.json schema but may live in meta.json — best-effort.
let tone = null;
try {
  const metaPath = abs(`compositions/${slug}.meta.json`);
  if (fileExists(metaPath)) {
    const m = readJson(metaPath);
    tone = m.tone || m.brandTone || null;
  }
} catch {}

// Script-timing prep: parse .scene.clip windows + emphasis events from the
// assembled comp HTML once. Done here (not in categorize) so we can emit the
// structured data into the JSON payload alongside findings.
const sceneWindowsHtml = parseSceneWindowsFromHtml(compHtml);
const emphasisEvents = parseEmphasisEvents(compHtml);

const findings = categorize({
  samples, vttCues, copyJson, durationS, brandName, brandUrl,
  compHtml, tokenHexes, tokensPath, manifestAssets, manifestPath, sceneCensus,
  motionContinuity, sceneWindowsHtml, emphasisEvents,
});
const verdict = deriveVerdict(findings);

// --- write outputs --------------------------------------------------------
// stamp was computed pre-browser-close so motion-continuity frame dir aligns.
const learnDir = path.join(projectRoot, "docs", "render-learnings");
fs.mkdirSync(learnDir, { recursive: true });

const jsonOutPath = path.join(learnDir, `${slug}-${stamp}.json`);
const mdOutPath = outArg ? abs(outArg) : path.join(learnDir, `${slug}-${stamp}.md`);

const jsonPayload = {
  slug,
  template,
  tone,
  durationS,
  generatedAt: new Date().toISOString(),
  comp: path.relative(projectRoot, compPath).replace(/\\/g, "/"),
  copy: fileExists(copyPath) ? path.relative(projectRoot, copyPath).replace(/\\/g, "/") : null,
  vtt: fileExists(vttPath) ? path.relative(projectRoot, vttPath).replace(/\\/g, "/") : null,
  vttCueCount: vttCues.length,
  brandName,
  brandUrl,
  tokensPath: tokensPath ? path.relative(projectRoot, tokensPath).replace(/\\/g, "/") : null,
  tokenHexes: [...tokenHexes],
  manifestPath: manifestPath ? path.relative(projectRoot, manifestPath).replace(/\\/g, "/") : null,
  manifestAssetCount: Array.isArray(manifestAssets) ? manifestAssets.length : 0,
  sceneCensus: Array.from(sceneCensus.entries()).map(([id, c]) => ({ id, ...c })),
  motionContinuity: motionContinuity ? {
    frameDir: path.relative(projectRoot, motionContinuity.frameDir).replace(/\\/g, "/"),
    perScene: motionContinuity.perScene,
  } : null,
  // Script-timing inputs — surfaced so downstream tools (and humans reading
  // the JSON) can verify the boundaries the checker used. Cheap to include.
  scriptTiming: {
    sceneWindows: sceneWindowsHtml,
    emphasisEvents,
  },
  samples,
  findings,
  verdict,
};
fs.writeFileSync(jsonOutPath, JSON.stringify(jsonPayload, null, 2), "utf8");
writeMarkdownReport({ outPath: mdOutPath, slug, template, tone, durationS, samples, vttCues, copyJson, findings, verdict });
appendLedgerRow({ slug, template, tone, durationS, findings, verdict });

const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log("");
console.log(`  composition         ${findings.composition.length} entries`);
console.log(`  brand fidelity      ${findings.brandFidelity.length} entries`);
console.log(`  placeholder leakage ${findings.placeholderLeakage.length} entries${findings.placeholderLeakage.length ? "  ← MAJOR" : ""}`);
console.log(`  pacing              ${findings.pacing.length} entries`);
console.log(`  audio coverage      ${findings.audioCoverage.length} entries`);
console.log(`  accessibility       ${findings.accessibility.length} entries`);
const paletteMajor = findings.brandPaletteUse.some(f => f.kind === "zero-var-refs");
const assetMajor = findings.brandAssetUse.some(f => f.kind === "visual-identity-absent");
const densityMajor = findings.sceneVisualDensity.some(f => f.kind === "consecutive-text-only");
console.log(`  brand palette use   ${findings.brandPaletteUse.length} entries${paletteMajor ? "  ← MAJOR" : ""}`);
console.log(`  brand asset use     ${findings.brandAssetUse.length} entries${assetMajor ? "  ← MAJOR" : ""}`);
console.log(`  scene visual density ${findings.sceneVisualDensity.length} entries${densityMajor ? " ← MAJOR" : ""}`);
const motionMajor = (findings.motionContinuity || []).some(f =>
  f.kind === "scene-frozen" || f.kind === "multiple-static"
);
console.log(`  motion continuity   ${findings.motionContinuity.length} entries${motionMajor ? "  ← MAJOR" : ""}`);
const scriptTimingMajor = (findings.scriptTiming || []).some(f =>
  f.kind === "narration-overrun-into-cta"
) || (findings.scriptTiming || []).filter(f => f.kind === "scene-narration-mismatch").length >= 2;
console.log(`  script timing       ${(findings.scriptTiming || []).length} entries${scriptTimingMajor ? "  ← MAJOR" : ""}`);
console.log("");
console.log(`◇ verdict: ${verdict} (${dt}s)`);
console.log(`  json: ${path.relative(projectRoot, jsonOutPath).replace(/\\/g, "/")}`);
console.log(`  md:   ${path.relative(projectRoot, mdOutPath).replace(/\\/g, "/")}`);
console.log(`  ledger updated: docs/render-learnings/LEDGER.md`);

process.exit(verdict === "needs-fix" ? 1 : 0);

// --- helpers (hoisted) ----------------------------------------------------
function guessSlugFromIndex(indexPath) {
  // index.html is the assembled comp. Slug derivation order:
  //   1) data-composition-id with a matching <id>.copy.json   (strong)
  //   2) data-composition-id with a matching <id>.meta.json   (medium — copy
  //      may be missing for hand-recut comps; we still prefer the id)
  //   3) meta.json next to index.html with { id } that maps to <id>.copy.json
  //   4) sha256 of index matches a compositions/*.meta.json#comp.sha256
  //   5) brand-name (from <title>) substring found in any copy.json title
  //   6) fall back to "index"
  try {
    const html = fs.readFileSync(indexPath, "utf8");
    const m = html.match(/data-composition-id="([^"]+)"/);
    if (m) {
      const id = m[1];
      const directCopy = abs(`compositions/${id}.copy.json`);
      if (fileExists(directCopy)) return id;
      const directMeta = abs(`compositions/${id}.meta.json`);
      if (fileExists(directMeta)) return id; // valid slug even without copy
    }
    // (3) meta.json adjacent
    const metaPath = path.join(path.dirname(indexPath), "meta.json");
    if (fileExists(metaPath)) {
      const meta = readJson(metaPath);
      if (meta.id && fileExists(abs(`compositions/${meta.id}.copy.json`))) return meta.id;
    }
    // (4) sha256 lookup
    const indexSha = sha256OfFile(indexPath);
    const compsDir = abs("compositions");
    if (fs.existsSync(compsDir)) {
      for (const name of fs.readdirSync(compsDir)) {
        if (!name.endsWith(".meta.json")) continue;
        try {
          const meta = readJson(path.join(compsDir, name));
          if (meta?.comp?.sha256 === indexSha) {
            return meta.slug || name.replace(/\.meta\.json$/, "");
          }
        } catch {}
      }
    }
    // (5) title-substring scan — low confidence, last resort.
    if (fs.existsSync(compsDir)) {
      for (const name of fs.readdirSync(compsDir)) {
        if (!name.endsWith(".copy.json")) continue;
        try {
          const cp = readJson(path.join(compsDir, name));
          const probe = (cp.title || "").split(/[—\-|·:]/)[0].trim();
          if (probe && probe.length > 4 && html.includes(probe)) {
            return cp.slug || name.replace(/\.copy\.json$/, "");
          }
        } catch {}
      }
    }
  } catch {}
  return "index";
}

function sha256OfFile(p) {
  try {
    const data = fs.readFileSync(p);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch { return null; }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
