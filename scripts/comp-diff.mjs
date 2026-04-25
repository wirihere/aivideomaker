// comp-diff.mjs — structural diff for two HyperFrames compositions.
//
// Compares the *shape* of two comps — scenes, durations, tween structure,
// asset references, module imports, color tokens — not literal text. For text,
// `git diff` is already the right tool. Use this for "v3 vs v3.1" iterations
// when you want to know whether you accidentally added a 4th scene or doubled
// the tween count.
//
// Usage: node scripts/comp-diff.mjs <a.html> <b.html> [--json|--md]
// Exit:  0 = no diffs, 1 = differences found, 2 = parse error.
// READ-ONLY. Zero new npm deps.

import fs from "node:fs";
import path from "node:path";

// --- args -------------------------------------------------------------------
const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith("--"));
const flags = Object.fromEntries(
  argv.filter(a => a.startsWith("--")).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

if (positional.length !== 2) {
  process.stderr.write(
    "usage: node scripts/comp-diff.mjs <a.html> <b.html> [--json|--md]\n",
  );
  process.exit(2);
}

const [pathA, pathB] = positional.map(p => path.resolve(process.cwd(), p));
const wantJson = flags.json === true;
const wantMd = flags.md === true;

// --- tiny ANSI helpers (no external dep) ------------------------------------
const isTty = process.stdout.isTTY && !wantJson && !wantMd;
const wrap = (open, close) => (s) => isTty ? `\x1b[${open}m${s}\x1b[${close}m` : `${s}`;
const c = {
  red: wrap(31, 39), green: wrap(32, 39), yellow: wrap(33, 39),
  cyan: wrap(36, 39), gray: wrap(90, 39), bold: wrap(1, 22), dim: wrap(2, 22),
};

// --- read inputs ------------------------------------------------------------
function readOrDie(p) {
  if (!fs.existsSync(p)) {
    process.stderr.write(`comp-diff: file not found: ${p}\n`);
    process.exit(2);
  }
  return fs.readFileSync(p, "utf8");
}
const srcA = readOrDie(pathA);
const srcB = readOrDie(pathB);

// --- parser -----------------------------------------------------------------
// Minimal HTML scraping via RegExp — sufficient because we only need attribute
// values, src/href URLs, and inline <script> bodies. No DOM library: zero deps,
// and HyperFrames comps are already authored to a strict shape.
const NON_PROP_KEYS = new Set([
  "duration", "ease", "stagger", "delay", "repeat", "yoyo",
  "onStart", "onComplete", "at",
]);

function extract(src, label) {
  // Strip HTML comments so commented-out clips/scripts don't pollute results.
  const clean = src.replace(/<!--[\s\S]*?-->/g, "");

  // 1. clip elements (any tag with class containing "clip")
  const clips = [];
  const clipRe = /<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*\bclass\s*=\s*"[^"]*\bclip\b[^"]*"[^>]*)>/g;
  let m;
  while ((m = clipRe.exec(clean)) !== null) {
    const tag = m[1], attrs = m[2];
    const attr = (n) => { const r = new RegExp(`\\b${n}\\s*=\\s*"([^"]*)"`).exec(attrs); return r ? r[1] : null; };
    const dataStart = attr("data-start"), dataDuration = attr("data-duration"), dataTrackIndex = attr("data-track-index");
    if (dataStart === null || dataDuration === null) continue;
    clips.push({
      id: attr("id") || `${tag}@${m.index}`,
      tag,
      dataStart: Number(dataStart),
      dataDuration: Number(dataDuration),
      dataTrackIndex: dataTrackIndex !== null ? Number(dataTrackIndex) : null,
    });
  }

  // 2. modules — <link href="..."> + <script src="...">
  const modules = new Set();
  for (const re of [/<link\b[^>]*\bhref\s*=\s*"([^"]+)"[^>]*>/g, /<script\b[^>]*\bsrc\s*=\s*"([^"]+)"[^>]*>/g]) {
    let r; while ((r = re.exec(clean)) !== null) modules.add(r[1]);
  }

  // 3. media srcs
  const assets = new Set();
  const assetRe = /<(?:img|video|audio|source)\b[^>]*\bsrc\s*=\s*"([^"]+)"[^>]*>/g;
  let a; while ((a = assetRe.exec(clean)) !== null) assets.add(a[1]);

  // 4. sub-composition placeholders
  const subComps = new Set();
  const subRe = /\bdata-composition-src\s*=\s*"([^"]+)"/g;
  while ((a = subRe.exec(clean)) !== null) subComps.add(a[1]);

  // 5. inline-script tween extraction. Inline only, so external GSAP doesn't pollute.
  const tweens = [];
  const inlineScriptRe = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let scriptBlob = "", sm;
  while ((sm = inlineScriptRe.exec(clean)) !== null) scriptBlob += "\n" + sm[1];

  // Match tl.to / tl.from / tl.fromTo / tl.set; balance parens so args with
  // their own parens (e.g. ease "back.out(1.6)") don't truncate.
  const tweenCallRe = /\btl\s*\.\s*(to|from|fromTo|set)\s*\(/g;
  while ((sm = tweenCallRe.exec(scriptBlob)) !== null) {
    const kind = sm[1], startIdx = tweenCallRe.lastIndex;
    let depth = 1, i = startIdx;
    while (i < scriptBlob.length && depth > 0) {
      const ch = scriptBlob[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "\"" || ch === "'" || ch === "`") {
        const q = ch; i++;
        while (i < scriptBlob.length && scriptBlob[i] !== q) { if (scriptBlob[i] === "\\") i++; i++; }
      }
      i++;
    }
    const argSlice = scriptBlob.slice(startIdx, i - 1);
    const tm = /^\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|`[^`]*`)/.exec(argSlice);
    const target = tm ? tm[1] : "<unknown>";
    // Top-level object keys from each {...} block in the args.
    const props = new Set();
    const objRe = /\{([^{}]*)\}/g;
    let obj;
    while ((obj = objRe.exec(argSlice)) !== null) {
      const keyRe = /(?:^|[,{\s])([a-zA-Z_$][\w$]*)\s*:/g;
      let k; while ((k = keyRe.exec(obj[1])) !== null) {
        if (!NON_PROP_KEYS.has(k[1])) props.add(k[1]);
      }
    }
    tweens.push({ kind, target, properties: [...props].sort() });
  }

  // 6. color tokens — var(--name) references in inline <style> blocks
  const tokens = new Set();
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/g;
  let styleBlob = "", stm;
  while ((stm = styleRe.exec(clean)) !== null) styleBlob += "\n" + stm[1];
  const tokenRe = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let t; while ((t = tokenRe.exec(styleBlob)) !== null) tokens.add(t[1]);

  // 7. total duration — root clip's data-duration, else max(start+dur)
  const root = clips.find(cl => cl.dataTrackIndex === 0) || clips[0];
  let totalDuration = root ? root.dataDuration : 0;
  for (const cl of clips) totalDuration = Math.max(totalDuration, cl.dataStart + cl.dataDuration);

  if (clips.length === 0 && modules.size === 0) {
    process.stderr.write(`comp-diff: ${label} does not look like a HyperFrames composition (no clips, no modules).\n`);
    process.exit(2);
  }
  return {
    label, clips,
    modules: [...modules].sort(),
    assets: [...assets].sort(),
    subComps: [...subComps].sort(),
    tweens,
    tokens: [...tokens].sort(),
    totalDuration,
  };
}

const A = extract(srcA, pathA);
const B = extract(srcB, pathB);

// --- diff helpers -----------------------------------------------------------
function setDiff(setA, setB) {
  const a = new Set(setA), b = new Set(setB);
  const removed = [...a].filter(x => !b.has(x)).sort();
  const added = [...b].filter(x => !a.has(x)).sort();
  return { added, removed };
}

function sceneDiff(a, b) {
  const byIdA = new Map(a.map(s => [s.id, s]));
  const byIdB = new Map(b.map(s => [s.id, s]));
  const removed = [];
  const added = [];
  const changed = [];
  for (const [id, sa] of byIdA) {
    if (!byIdB.has(id)) {
      removed.push(sa);
      continue;
    }
    const sb = byIdB.get(id);
    if (sa.dataDuration !== sb.dataDuration ||
        sa.dataStart !== sb.dataStart ||
        sa.dataTrackIndex !== sb.dataTrackIndex) {
      changed.push({
        id,
        before: { start: sa.dataStart, duration: sa.dataDuration, track: sa.dataTrackIndex },
        after: { start: sb.dataStart, duration: sb.dataDuration, track: sb.dataTrackIndex },
      });
    }
  }
  for (const [id, sb] of byIdB) {
    if (!byIdA.has(id)) added.push(sb);
  }
  return { added, removed, changed };
}

function tweenDiff(a, b) {
  // Bucket by target so we can compare per-target counts + properties.
  const bucket = (list) => {
    const m = new Map();
    for (const t of list) {
      const k = `${t.target}`;
      if (!m.has(k)) m.set(k, { count: 0, kinds: [], properties: new Set() });
      const e = m.get(k);
      e.count++;
      e.kinds.push(t.kind);
      for (const p of t.properties) e.properties.add(p);
    }
    return m;
  };
  const ba = bucket(a), bb = bucket(b);
  const removed = [], added = [], changed = [];
  for (const [target, ea] of ba) {
    if (!bb.has(target)) {
      removed.push({ target, count: ea.count, properties: [...ea.properties].sort() });
      continue;
    }
    const eb = bb.get(target);
    const propA = [...ea.properties].sort().join(",");
    const propB = [...eb.properties].sort().join(",");
    if (ea.count !== eb.count || propA !== propB) {
      changed.push({
        target,
        before: { count: ea.count, properties: [...ea.properties].sort() },
        after: { count: eb.count, properties: [...eb.properties].sort() },
      });
    }
  }
  for (const [target, eb] of bb) {
    if (!ba.has(target)) added.push({ target, count: eb.count, properties: [...eb.properties].sort() });
  }
  return {
    added, removed, changed,
    totalA: a.length, totalB: b.length,
  };
}

const diff = {
  scenes: sceneDiff(A.clips, B.clips),
  tweens: tweenDiff(A.tweens, B.tweens),
  assets: setDiff(A.assets, B.assets),
  modules: setDiff(A.modules, B.modules),
  subComps: setDiff(A.subComps, B.subComps),
  tokens: setDiff(A.tokens, B.tokens),
  durations: {
    a: A.totalDuration,
    b: B.totalDuration,
    deltaSec: Number((B.totalDuration - A.totalDuration).toFixed(3)),
    mismatch: Math.abs(B.totalDuration - A.totalDuration) > 0.1,
  },
};

const hasDiffs =
  diff.scenes.added.length || diff.scenes.removed.length || diff.scenes.changed.length ||
  diff.tweens.added.length || diff.tweens.removed.length || diff.tweens.changed.length ||
  diff.assets.added.length || diff.assets.removed.length ||
  diff.modules.added.length || diff.modules.removed.length ||
  diff.subComps.added.length || diff.subComps.removed.length ||
  diff.tokens.added.length || diff.tokens.removed.length ||
  diff.durations.mismatch;

// --- emitters ---------------------------------------------------------------
function emitJson() {
  process.stdout.write(JSON.stringify({
    a: pathA, b: pathB, ...diff,
  }, null, 2) + "\n");
}

function emitMd() {
  const lines = [
    `# Composition diff`, ``,
    `- A: \`${path.relative(process.cwd(), pathA) || pathA}\``,
    `- B: \`${path.relative(process.cwd(), pathB) || pathB}\``, ``,
    `## Durations`, ``,
    `| | A | B | delta |`, `|-|---|---|-------|`,
    `| Total (s) | ${A.totalDuration} | ${B.totalDuration} | ${diff.durations.deltaSec >= 0 ? "+" : ""}${diff.durations.deltaSec} |`, ``,
  ];
  const fmt = (r) => typeof r === "string" ? r : JSON.stringify(r);
  const section = (title, { added = [], removed = [], changed = [] }) => {
    lines.push(`## ${title}`, ``);
    if (!added.length && !removed.length && !changed.length) { lines.push(`_No changes._`, ``); return; }
    if (removed.length) { lines.push(`### Removed`); for (const r of removed) lines.push(`- ${fmt(r)}`); lines.push(``); }
    if (added.length)   { lines.push(`### Added`);   for (const r of added)   lines.push(`- ${fmt(r)}`); lines.push(``); }
    if (changed.length) { lines.push(`### Changed`); for (const r of changed) lines.push(`- ${JSON.stringify(r)}`); lines.push(``); }
  };
  section("Scenes", diff.scenes);
  section("Tweens (by target)", diff.tweens);
  lines.push(`Tween totals: A=${diff.tweens.totalA}, B=${diff.tweens.totalB}`, ``);
  section("Assets", diff.assets);
  section("Modules / stylesheets", diff.modules);
  section("Sub-compositions", diff.subComps);
  section("Color tokens", diff.tokens);
  process.stdout.write(lines.join("\n") + "\n");
}

function emitTerminal() {
  const head = (s) => process.stdout.write(`\n${c.bold(c.cyan(s))}\n`);
  const item = (sym, color, text) => process.stdout.write(`  ${color(sym)} ${text}\n`);
  const note = (s) => process.stdout.write(`  ${c.gray(s)}\n`);

  process.stdout.write(c.bold("Composition diff") + "\n");
  note(`A: ${path.relative(process.cwd(), pathA) || pathA}`);
  note(`B: ${path.relative(process.cwd(), pathB) || pathB}`);

  // Durations
  head("Total duration");
  const delta = diff.durations.deltaSec;
  const fmtDelta = delta === 0 ? c.gray("±0.000s")
                  : delta > 0 ? c.red(`+${delta}s`)
                              : c.green(`${delta}s`);
  process.stdout.write(`  ${A.totalDuration}s -> ${B.totalDuration}s   ${fmtDelta}`);
  if (diff.durations.mismatch) process.stdout.write(c.yellow("  (mismatch >0.1s)"));
  process.stdout.write("\n");

  // Scenes
  head(`Scenes  (A=${A.clips.length}, B=${B.clips.length})`);
  for (const s of diff.scenes.removed) item("-", c.red, `${s.id}  start=${s.dataStart}s dur=${s.dataDuration}s track=${s.dataTrackIndex}`);
  for (const s of diff.scenes.added) item("+", c.green, `${s.id}  start=${s.dataStart}s dur=${s.dataDuration}s track=${s.dataTrackIndex}`);
  for (const s of diff.scenes.changed) {
    const durDelta = s.after.duration - s.before.duration;
    const sign = durDelta > 0 ? c.red(`+${durDelta}s`) : durDelta < 0 ? c.green(`${durDelta}s`) : c.gray("±0s");
    item("~", c.yellow, `${s.id}  ${s.before.start}s/${s.before.duration}s -> ${s.after.start}s/${s.after.duration}s  (dur ${sign})`);
  }
  if (!diff.scenes.added.length && !diff.scenes.removed.length && !diff.scenes.changed.length) {
    note("(no changes)");
  }

  // Tweens
  const tA = diff.tweens.totalA, tB = diff.tweens.totalB;
  const tCount = tB - tA;
  const tSign = tCount === 0 ? c.gray("±0") : tCount > 0 ? c.red(`+${tCount}`) : c.green(`${tCount}`);
  head(`Tweens  (A=${tA}, B=${tB}, ${tSign})`);
  for (const t of diff.tweens.removed) item("-", c.red, `${t.target}  count=${t.count}  props=[${t.properties.join(",")}]`);
  for (const t of diff.tweens.added) item("+", c.green, `${t.target}  count=${t.count}  props=[${t.properties.join(",")}]`);
  for (const t of diff.tweens.changed) {
    const cd = t.after.count - t.before.count;
    const cdSign = cd > 0 ? c.red(`+${cd}`) : cd < 0 ? c.green(`${cd}`) : c.gray("±0");
    item("~", c.yellow, `${t.target}  count ${t.before.count}->${t.after.count} (${cdSign})  props [${t.before.properties.join(",")}] -> [${t.after.properties.join(",")}]`);
  }
  if (!diff.tweens.added.length && !diff.tweens.removed.length && !diff.tweens.changed.length) {
    note("(no changes)");
  }

  // Assets / modules / sub-comps / tokens
  for (const [title, payload] of [
    ["Assets", diff.assets],
    ["Modules / stylesheets", diff.modules],
    ["Sub-compositions", diff.subComps],
    ["Color tokens", diff.tokens],
  ]) {
    head(title);
    for (const r of payload.removed) item("-", c.red, r);
    for (const r of payload.added) item("+", c.green, r);
    if (!payload.added.length && !payload.removed.length) note("(no changes)");
  }

  process.stdout.write("\n");
  if (!hasDiffs) process.stdout.write(c.green("no differences") + "\n");
  else process.stdout.write(c.yellow(`differences detected`) + "\n");
}

// --- emit + exit ------------------------------------------------------------
if (wantJson) emitJson();
else if (wantMd) emitMd();
else emitTerminal();

process.exit(hasDiffs ? 1 : 0);
