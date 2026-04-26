// Verify-render — every render is a learning event.
//
// Pairs the assembled HTML composition (or rendered MP4) against the narration
// VTT + copy.json, scrubs a per-second visible-text snapshot, and writes:
//   - JSON findings        docs/render-learnings/<slug>-<timestamp>.json
//   - Markdown report      docs/render-learnings/<slug>-<timestamp>.md
//   - One ledger row       docs/render-learnings/LEDGER.md (append)
//
// Categories surfaced:
//   - composition         visible text per scene (length, alignment with narration)
//   - brand fidelity      brand name + URL presence; on-screen text vs copy.json
//   - placeholder leakage literal seed text from the template that didn't get swapped
//   - pacing              scene durations vs narration beat boundaries
//   - audio coverage      narration end vs comp end (gaps, overruns)
//   - accessibility       text-vs-bg contrast + font size at 1080p
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

// --- categorize findings --------------------------------------------------
function categorize({ samples, vttCues, copyJson, durationS, brandName, brandUrl }) {
  const findings = {
    composition: [],
    brandFidelity: [],
    placeholderLeakage: [],
    pacing: [],
    audioCoverage: [],
    accessibility: [],
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

  return findings;
}

function deriveVerdict(findings) {
  // Major (blocks ship):
  //   - any placeholder leakage (template seed text leaked through)
  //   - brand name absent from visible text
  //   - URL host absent from visible text
  // We deliberately don't escalate `beat-headline-missing` to major: the comp
  // may have been hand-written or recut without exact-headline-substring
  // match, which is fine. It's a "watch" signal.
  const hasMajor =
    findings.placeholderLeakage.length > 0 ||
    findings.brandFidelity.some(f => f.kind === "brand-name-missing" || f.kind === "url-missing");
  const watchSignals =
    findings.pacing.length +
    findings.accessibility.length +
    findings.composition.filter(f => f.kind !== "ok").length +
    findings.brandFidelity.filter(f => f.kind === "beat-headline-missing").length +
    findings.audioCoverage.filter(f => f.kind !== "ok").length;
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

// Slug derivation: explicit --copy wins, else use comp filename without
// extension, then strip the well-known suffix variants.
const compBaseName = path.basename(compPath, ".html");
const slug = compBaseName === "index" ? guessSlugFromIndex(compPath) : compBaseName;

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

// hyperframes preview serves the project from a per-project route. We use the
// project name from the working directory (matches smoke.mjs's pattern).
const projectName = path.basename(projectRoot);
const previewUrl = `http://localhost:${port}/api/projects/${projectName}/preview`;

try {
  await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
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
await browser.close();

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

const findings = categorize({ samples, vttCues, copyJson, durationS, brandName, brandUrl });
const verdict = deriveVerdict(findings);

// --- write outputs --------------------------------------------------------
const stamp = tsStamp();
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
