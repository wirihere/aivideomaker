// Brand asset puller — given a URL + slug, downloads the brand's reusable
// visual assets (logo, favicon, hero photo, product shot) into
// assets/<slug>/, plus a manifest.json the orchestrator can read.
//
// Usage:
//   node scripts/pull-assets.mjs <url> [--name=<slug>] [--max=4] [--force]
//
// Examples:
//   node scripts/pull-assets.mjs https://kindred-nz.org --name=kindred-test
//   node scripts/pull-assets.mjs https://stripe.com --max=2
//
// Pipeline:
//   1. Fetch HTML (curl-style via https.get; Playwright fallback for SPAs).
//   2. Extract candidate URLs per kind: logo, favicon, hero, product.
//      - logo:    <img src/alt/class*=logo>, header svg, og:logo, manifest icons
//      - favicon: <link rel*="icon"> (apple-touch wins for size)
//      - hero:    <meta property="og:image">, twitter:image, first viewport <img>
//      - product: <meta name="twitter:image:src">, second hero candidate
//   3. Resolve relative → absolute, drop data:/javascript:/off-domain (unless
//      the URL is a known brand CDN — cloudfront, cloudinary, imgix, sanity,
//      shopifycdn, prismic, contentful, akamaized, fastly, ssl-images-amazon).
//   4. Download each (highest-priority first) via Node https — content-addressed
//      through assets/.cache/. Validate (magic-bytes, ≥ 50px, ≤ 2 MB).
//      On failure, fall through to the next candidate for that kind.
//   5. Write assets/<slug>/<kind>.<ext> + manifest.json.
//
// Constraints:
//   - Uses the existing scripts/lib/asset-cache.mjs — no re-implementation.
//   - No new npm deps. Built-in https + zlib. Playwright used only if curl is empty.
//   - Stops at --max=N successful downloads (default 4).
//
// Output contract (manifest.json):
//   {
//     "slug": "<slug>",
//     "url": "<source URL>",
//     "extractedAt": "ISO ts",
//     "assets": [
//       { "kind": "logo",    "path": "assets/<slug>/logo.png",    "src": "<orig URL>", "width": N, "height": N, "bytes": N },
//       { "kind": "favicon", "path": "assets/<slug>/favicon.png", "src": "...",       "width": N, "height": N, "bytes": N }
//     ]
//   }

import fs from "fs";
import path from "path";
import zlib from "zlib";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import { cacheGet, cachePut, cacheKey } from "./lib/asset-cache.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// --- args --------------------------------------------------------------------

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  argv
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    })
);

const url = positional[0];
const force = !!flags.force;
const max = parseInt(flags.max ?? "4", 10) || 4;

if (!url || !/^https?:\/\//.test(url)) {
  console.error(
    "Usage: node scripts/pull-assets.mjs <https://example.com> [--name=<slug>] [--max=4] [--force]"
  );
  process.exit(1);
}

const host = new URL(url).hostname.replace(/^www\./, "").replace(/\.[a-z]+$/i, "");
const slug = (flags.name ?? host)
  .toString()
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");

const outDir = path.join(projectRoot, "assets", slug);

console.log(`pull-assets: ${url}`);
console.log(`  slug:    ${slug}`);
console.log(`  outDir:  ${path.relative(projectRoot, outDir)}`);
console.log(`  max:     ${max}`);

// --- helpers -----------------------------------------------------------------

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// GET a URL (follows up to 5 redirects). Returns { status, headers, body: Buffer }.
// Decompresses gzip / deflate / br automatically.
function fetchBuf(targetUrl, { referer, maxRedirects = 5, timeout = 20_000 } = {}) {
  return new Promise((resolve, reject) => {
    const visit = (u, hopsLeft) => {
      let parsed;
      try {
        parsed = new URL(u);
      } catch (e) {
        return reject(new Error(`bad url: ${u}`));
      }
      const lib = parsed.protocol === "http:" ? http : https;
      const req = lib.request(
        {
          method: "GET",
          host: parsed.hostname,
          port: parsed.port || undefined,
          path: parsed.pathname + parsed.search,
          headers: {
            "User-Agent": UA,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9," +
              "image/avif,image/webp,image/svg+xml,image/png,image/*;q=0.8,*/*;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9",
            ...(referer ? { Referer: referer } : {}),
          },
          timeout,
        },
        (res) => {
          // Redirect?
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode || 0) &&
            res.headers.location &&
            hopsLeft > 0
          ) {
            const nextUrl = new URL(res.headers.location, parsed).toString();
            res.resume();
            return visit(nextUrl, hopsLeft - 1);
          }

          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            let buf = Buffer.concat(chunks);
            const enc = (res.headers["content-encoding"] || "").toLowerCase();
            try {
              if (enc === "gzip") buf = zlib.gunzipSync(buf);
              else if (enc === "deflate") buf = zlib.inflateSync(buf);
              else if (enc === "br") buf = zlib.brotliDecompressSync(buf);
            } catch (e) {
              return reject(new Error(`decode ${enc}: ${e.message}`));
            }
            resolve({
              status: res.statusCode || 0,
              headers: res.headers,
              body: buf,
              finalUrl: parsed.toString(),
            });
          });
        }
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy(new Error(`timeout after ${timeout}ms`));
      });
      req.end();
    };
    visit(targetUrl, maxRedirects);
  });
}

// Decode HTML entities found in attribute values. Most matter for URLs:
// `&amp;` → `&`, `&#x2F;` → `/`. Server-rendered HTML routinely entity-encodes
// `&` inside `href`/`src`/`content`, which then breaks downstream URL parsing.
function decodeHtmlEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function abs(maybeRelative, base) {
  try {
    return new URL(decodeHtmlEntities(maybeRelative), base).toString();
  } catch {
    return null;
  }
}

// Brand-CDN allowlist — patterns where third-party-domain assets are still
// safe to pull because the brand itself uploaded them there. Conservative.
const BRAND_CDN_PATTERNS = [
  /\.cloudfront\.net$/i,
  /\.cloudinary\.com$/i,
  /\.imgix\.net$/i,
  /\.sanity\.io$/i,
  /\.shopifycdn\.com$/i,
  /\.prismic\.io$/i,
  /\.cdn\.prismic\.io$/i,
  /\.contentful\.com$/i,
  /\.ctfassets\.net$/i,
  /\.akamaized\.net$/i,
  /\.fastly\.net$/i,
  /\.ssl-images-amazon\.com$/i,
  /\.amazonaws\.com$/i,
  /\.b-cdn\.net$/i,
  /\.netlify\.app$/i,
  /\.vercel\.app$/i,
  /\.githubusercontent\.com$/i,
  /\.wp\.com$/i, // Jetpack CDN for WP
  /\.wordpress\.com$/i,
  /\.squarespace-cdn\.com$/i,
  /\.webflow\.com$/i,
  /\.framerusercontent\.com$/i,
  /\.googleusercontent\.com$/i,
];

function isSafeAssetUrl(u, originHost) {
  if (!u) return false;
  if (/^data:/i.test(u)) return false;
  if (/^javascript:/i.test(u)) return false;
  if (/^mailto:/i.test(u)) return false;
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return false;
  }
  if (!/^https?:$/i.test(parsed.protocol)) return false;
  const h = parsed.hostname.toLowerCase();
  // Same site (origin host or a subdomain of the registrable root)?
  const o = originHost.toLowerCase();
  if (h === o || h.endsWith("." + o)) return true;
  // Brand-trusted CDN?
  if (BRAND_CDN_PATTERNS.some((re) => re.test(h))) return true;
  // Brand-name appears in the host? Stripe → images.stripeassets.com,
  // Notion → notion-static.com, GitHub → githubassets.com — common pattern
  // for first-party CDNs the brand controls.
  // Take the registrable-root label of the origin (e.g. "stripe" from
  // "stripe.com") and require it to appear as a substring in the candidate
  // host. Conservative: needs to be 4+ chars to avoid false positives.
  const originLabel = o.split(".").slice(-2)[0] || "";
  if (originLabel.length >= 4 && h.includes(originLabel)) return true;
  return false;
}

// Validate a downloaded buffer is actually a real image. Returns
// { ok, kind, ext, width, height, reason }.
//
// `kindForThreshold` lets callers loosen the min-size rule for favicons
// (which are legitimately 16/32/48 px). All other kinds enforce ≥50px.
function inspectImage(buf, urlForExtHint = "", kindForThreshold = "") {
  if (!buf || buf.length < 16) return { ok: false, reason: "too small (<16 bytes)" };
  if (buf.length > 2 * 1024 * 1024) {
    return { ok: false, reason: `too large (${(buf.length / 1024 / 1024).toFixed(2)} MB > 2 MB)` };
  }

  // Magic bytes
  const head = buf.slice(0, 32);
  let ext = null;
  let width = 0;
  let height = 0;
  let kind = null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    ext = ".png";
    kind = "png";
    // IHDR at offset 16: width(4) height(4) BE
    width = buf.readUInt32BE(16);
    height = buf.readUInt32BE(20);
  }
  // JPEG: FF D8 FF
  else if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    ext = ".jpg";
    kind = "jpeg";
    // Walk markers to SOF0/SOF2 for dimensions.
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const segLen = buf.readUInt16BE(i + 2);
      // SOFn markers: 0xC0..0xCF except DHT(C4), JPG(C8), DAC(CC).
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        height = buf.readUInt16BE(i + 5);
        width = buf.readUInt16BE(i + 7);
        break;
      }
      i += 2 + segLen;
    }
  }
  // GIF: "GIF87a" or "GIF89a"
  else if (
    head[0] === 0x47 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x38
  ) {
    ext = ".gif";
    kind = "gif";
    width = buf.readUInt16LE(6);
    height = buf.readUInt16LE(8);
  }
  // WebP: RIFF????WEBP
  else if (
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x57 &&
    head[9] === 0x45 &&
    head[10] === 0x42 &&
    head[11] === 0x50
  ) {
    ext = ".webp";
    kind = "webp";
    // VP8X chunk has dimensions at offset 24 (3 bytes width-1, 3 bytes height-1, LE)
    if (head[12] === 0x56 && head[13] === 0x50 && head[14] === 0x38 && head[15] === 0x58) {
      width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    } else if (head[12] === 0x56 && head[13] === 0x50 && head[14] === 0x38 && head[15] === 0x20) {
      // VP8 (lossy)
      width = buf.readUInt16LE(26) & 0x3fff;
      height = buf.readUInt16LE(28) & 0x3fff;
    } else if (head[12] === 0x56 && head[13] === 0x50 && head[14] === 0x38 && head[15] === 0x4c) {
      // VP8L (lossless): bit-packed at offset 21
      const b0 = buf[21],
        b1 = buf[22],
        b2 = buf[23],
        b3 = buf[24];
      width = 1 + (((b1 & 0x3f) << 8) | b0);
      height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    }
  }
  // ICO: 00 00 01 00
  else if (head[0] === 0x00 && head[1] === 0x00 && head[2] === 0x01 && head[3] === 0x00) {
    ext = ".ico";
    kind = "ico";
    // First entry width/height at offset 6/7. 0 means 256.
    width = head[6] === 0 ? 256 : head[6];
    height = head[7] === 0 ? 256 : head[7];
  }
  // SVG: text-based. Sniff for <svg.
  else {
    const text = buf.slice(0, Math.min(2048, buf.length)).toString("utf8").trim();
    if (/^<\?xml|^<svg/i.test(text)) {
      ext = ".svg";
      kind = "svg";
      // Try to read width/height attrs.
      const wMatch = text.match(/\bwidth\s*=\s*["']([0-9.]+)/i);
      const hMatch = text.match(/\bheight\s*=\s*["']([0-9.]+)/i);
      const vbMatch = text.match(/\bviewBox\s*=\s*["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)/i);
      width = wMatch ? Math.round(parseFloat(wMatch[1])) : vbMatch ? Math.round(parseFloat(vbMatch[1])) : 0;
      height = hMatch ? Math.round(parseFloat(hMatch[1])) : vbMatch ? Math.round(parseFloat(vbMatch[2])) : 0;
      // SVG has intrinsic infinite resolution — accept anything text-shaped.
      if (!width) width = 256;
      if (!height) height = 256;
    } else {
      return { ok: false, reason: "unrecognised image format" };
    }
  }

  // Reject 1×1 tracking pixels and tiny placeholders. SVGs bypass this since
  // they declare logical units, not bitmap pixels. Favicons get a lower bar
  // (16+) since 16/32/48 are legitimate favicon sizes.
  const minSize = kindForThreshold === "favicon" ? 16 : 50;
  if (kind !== "svg" && (width < minSize || height < minSize)) {
    return {
      ok: false,
      kind,
      ext,
      width,
      height,
      reason: `too small (${width}x${height} < ${minSize}px)`,
    };
  }

  return { ok: true, kind, ext, width, height };
}

// --- candidate extraction ----------------------------------------------------

// Pull every candidate URL from the HTML, ranked per kind.
// Returns { logo: [], favicon: [], hero: [], product: [] }.
function extractCandidates(html, baseUrl) {
  const candidates = { logo: [], favicon: [], hero: [], product: [] };
  const baseHost = new URL(baseUrl).hostname.replace(/^www\./, "");

  const push = (kind, srcUrl, score = 0, note = "") => {
    if (!srcUrl) return;
    const absolute = abs(srcUrl.trim(), baseUrl);
    if (!absolute) return;
    if (!isSafeAssetUrl(absolute, baseHost)) return;
    candidates[kind].push({ url: absolute, score, note });
  };

  // --- favicons: <link rel="icon|shortcut icon|apple-touch-icon"> ----
  // Prefer apple-touch-icon (always raster, usually 180+ px) over .ico.
  const linkRe = /<link\b([^>]+)>/gi;
  for (const m of html.matchAll(linkRe)) {
    const attrs = m[1];
    const rel = (attrs.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] || "").toLowerCase();
    const href = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    const sizes = attrs.match(/\bsizes\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    if (!href) continue;
    if (!/icon/.test(rel)) continue;
    let score = 0;
    if (rel.includes("apple-touch-icon")) score += 50;
    if (rel === "icon" || rel === "shortcut icon") score += 30;
    if (sizes) {
      const m2 = sizes.match(/(\d+)x(\d+)/);
      if (m2) score += Math.min(50, parseInt(m2[1], 10) / 4); // bigger = better
    }
    if (/\.svg(\?|$)/i.test(href)) score += 20;
    push("favicon", href, score, `link[rel="${rel}"]`);
  }

  // Well-known fallback paths — many bare-bones sites omit <link rel="icon">
  // entirely and rely on browser convention. Probe these last (low score) so
  // a declared <link> always wins.
  const fallbackPaths = [
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
    "/favicon.png",
    "/favicon.ico",
    "/icon.png",
  ];
  for (const p of fallbackPaths) {
    push("favicon", p, 5, `convention ${p}`);
  }

  // --- og/twitter meta images (hero + product) -----------------------
  const metaRe = /<meta\b([^>]+)>/gi;
  for (const m of html.matchAll(metaRe)) {
    const attrs = m[1];
    const prop = (
      attrs.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1] || ""
    ).toLowerCase();
    const content = attrs.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!content) continue;
    if (prop === "og:image" || prop === "og:image:url" || prop === "og:image:secure_url") {
      push("hero", content, 100, prop);
    } else if (prop === "twitter:image" || prop === "twitter:image:src") {
      push("hero", content, 90, prop);
      push("product", content, 60, prop);
    } else if (prop === "og:logo") {
      push("logo", content, 90, prop);
    }
  }

  // --- <img> elements: scan src + alt + class for kind hints ----------
  const imgRe = /<img\b([^>]+)>/gi;
  let imgIdx = 0;
  for (const m of html.matchAll(imgRe)) {
    imgIdx++;
    const attrs = m[1];
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
    const dataSrc =
      attrs.match(/\b(?:data-src|data-lazy-src|data-original)\s*=\s*["']([^"']+)["']/i)?.[1];
    const alt = (attrs.match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] || "").toLowerCase();
    const cls = (attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i)?.[1] || "").toLowerCase();
    const id = (attrs.match(/\bid\s*=\s*["']([^"']*)["']/i)?.[1] || "").toLowerCase();
    const real = src || dataSrc;
    if (!real) continue;

    const blob = `${real} ${alt} ${cls} ${id}`.toLowerCase();
    const looksLogo =
      /\blogo\b/.test(blob) || /\bbrand[-_]?mark\b/.test(blob) || /\bwordmark\b/.test(blob);
    const looksHero =
      /\bhero\b/.test(blob) || /\bbanner\b/.test(blob) || /\bcover\b/.test(blob);
    const looksProduct =
      /\bproduct\b/.test(blob) || /\bdevice\b/.test(blob) || /\bscreenshot\b/.test(blob);

    if (looksLogo) push("logo", real, 80 - imgIdx, `img[${imgIdx}].logo`);
    if (looksHero) push("hero", real, 70 - imgIdx, `img[${imgIdx}].hero`);
    if (looksProduct) push("product", real, 70 - imgIdx, `img[${imgIdx}].product`);

    // First few <img> with no hint → fallback hero/product candidates.
    if (!looksLogo && !looksHero && !looksProduct && imgIdx <= 8) {
      push("hero", real, 30 - imgIdx, `img[${imgIdx}].fallback`);
      if (imgIdx >= 2) push("product", real, 25 - imgIdx, `img[${imgIdx}].fallback`);
    }

    // Any image with srcset → grab the largest entry too.
    const srcset = attrs.match(/\bsrcset\s*=\s*["']([^"']+)["']/i)?.[1];
    if (srcset) {
      const parts = srcset.split(",").map((s) => s.trim());
      let biggest = null;
      let biggestW = 0;
      for (const p of parts) {
        const [u, sz] = p.split(/\s+/);
        const w = parseInt((sz || "0").replace(/[wx]/i, ""), 10) || 0;
        if (w > biggestW) {
          biggestW = w;
          biggest = u;
        }
      }
      if (biggest && (looksLogo || looksHero || looksProduct)) {
        const kind = looksLogo ? "logo" : looksHero ? "hero" : "product";
        push(kind, biggest, 75 - imgIdx, `img[${imgIdx}].srcset`);
      }
    }
  }

  // --- inline <svg> with logo class — skipped (we want raster files);
  //     handled separately by detecting svg <use href="...sprite#logo">.

  // Sort each kind by score descending.
  for (const k of Object.keys(candidates)) {
    candidates[k].sort((a, b) => b.score - a.score);
    // Dedupe by URL while preserving order.
    const seen = new Set();
    candidates[k] = candidates[k].filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    });
  }

  return candidates;
}

// --- download with cache + validate ------------------------------------------

// Try each candidate in order until one validates. Returns
// { ok, buf, info, candidate } or { ok: false }.
async function downloadFirstValid(kind, candidates, referer) {
  if (!candidates.length) return { ok: false, reason: "no candidates" };
  const limit = Math.min(candidates.length, 5); // cap how deep we'll walk
  for (let i = 0; i < limit; i++) {
    const cand = candidates[i];
    const key = cacheKey(cand.url);
    let buf;
    try {
      const hit = await cacheGet(key);
      if (hit) {
        buf = fs.readFileSync(hit);
        console.log(`  [${kind}] cache hit ${path.basename(hit)} ${cand.url}`);
      } else {
        const res = await fetchBuf(cand.url, { referer, timeout: 15_000 });
        if (res.status >= 400) {
          console.log(`  [${kind}] HTTP ${res.status} on ${cand.url} → next`);
          continue;
        }
        // Reject obvious non-image Content-Types early. SPAs serve 200 + HTML
        // for unknown paths, which would otherwise confuse the magic-byte
        // sniffer (HTML doesn't match any image signature → "unrecognised").
        // Cache the rejection (write the body anyway) so a subsequent run
        // hits the cache for the same useless URL and still rejects it via
        // inspectImage — saves the network round-trip.
        const ct = (res.headers["content-type"] || "").toLowerCase();
        const urlExt = path.extname(new URL(cand.url).pathname).toLowerCase();
        const ext = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".gif"].includes(urlExt)
          ? urlExt
          : "";
        await cachePut(key, res.body, ext);
        if (ct && !/^(image\/|application\/(octet-stream|x-icon)|text\/xml)/.test(ct)) {
          console.log(`  [${kind}] non-image Content-Type "${ct}" on ${cand.url} → next`);
          continue;
        }
        buf = res.body;
        console.log(`  [${kind}] downloaded ${(buf.length / 1024).toFixed(1)} KB ${cand.url}`);
      }
    } catch (e) {
      console.log(`  [${kind}] fetch fail (${e.message}) ${cand.url} → next`);
      continue;
    }

    const info = inspectImage(buf, cand.url, kind);
    if (!info.ok) {
      console.log(
        `  [${kind}] reject (${info.reason}) ${cand.url}` +
          (info.width ? ` [${info.width}x${info.height}]` : "")
      );
      continue;
    }
    console.log(
      `  [${kind}] OK ${info.kind} ${info.width}x${info.height} ${(buf.length / 1024).toFixed(1)} KB`
    );
    return { ok: true, buf, info, candidate: cand };
  }
  return { ok: false, reason: "all candidates rejected" };
}

// --- main --------------------------------------------------------------------

async function main() {
  // 1. Fetch HTML ------------------------------------------------------------
  console.log(`\n[1/4] fetching HTML`);
  let html = "";
  let finalUrl = url;
  try {
    const res = await fetchBuf(url, { timeout: 20_000 });
    if (res.status >= 400) {
      console.warn(`  HTTP ${res.status}`);
    }
    html = res.body.toString("utf8");
    finalUrl = res.finalUrl;
    console.log(`  fetched ${(res.body.length / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.error(`  curl-style fetch failed: ${e.message}`);
  }

  // Fallback to Playwright if HTML is empty / suspiciously small.
  if (!html || html.length < 500 || !/<\/html>|<\/body>/i.test(html)) {
    console.log(`  body looks empty/SPA — falling back to Playwright`);
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ headless: true });
      const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      page.on("pageerror", () => {});
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      } catch {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await page.waitForTimeout(1500);
      }
      html = await page.content();
      finalUrl = page.url();
      console.log(`  playwright rendered ${(html.length / 1024).toFixed(1)} KB`);
      await browser.close();
    } catch (e) {
      console.error(`  Playwright fallback failed: ${e.message}`);
      if (!html) {
        console.error(`  cannot proceed without HTML.`);
        process.exit(1);
      }
    }
  }

  // 2. Extract candidates ----------------------------------------------------
  console.log(`\n[2/4] extracting candidates`);
  const candidates = extractCandidates(html, finalUrl);
  for (const k of ["logo", "favicon", "hero", "product"]) {
    console.log(`  ${k}: ${candidates[k].length} candidate(s)`);
    candidates[k].slice(0, 3).forEach((c, i) => {
      console.log(`    ${i + 1}. [${c.score}] ${c.url}  (${c.note})`);
    });
  }

  // 3. Download + validate ---------------------------------------------------
  console.log(`\n[3/4] downloading + validating`);
  fs.mkdirSync(outDir, { recursive: true });

  // Order the kinds so logo + favicon always come first (these are the
  // safe-to-pull baseline). Hero/product can fail without breaking the run.
  const order = ["logo", "favicon", "hero", "product"];
  const manifestAssets = [];
  let downloaded = 0;
  let logoBuf = null;
  let logoInfo = null;
  let logoCandidate = null;

  for (const kind of order) {
    if (downloaded >= max) break;
    let result = await downloadFirstValid(kind, candidates[kind], finalUrl);

    // Favicon fallback: if no separate favicon is reachable, mirror the logo.
    // The contract requires logo + favicon at minimum; a brand's logo is
    // always a valid stand-in for its tab icon.
    if (!result.ok && kind === "favicon" && logoBuf) {
      console.log(`  [favicon] no valid candidate — mirroring logo`);
      result = {
        ok: true,
        buf: logoBuf,
        info: logoInfo,
        candidate: { ...logoCandidate, note: `mirrored from logo (${logoCandidate.note})` },
      };
    }

    if (!result.ok) {
      console.log(`  [${kind}] skipped (${result.reason || "no valid candidate"})`);
      continue;
    }

    // Stash the logo for the favicon-mirror path above.
    if (kind === "logo") {
      logoBuf = result.buf;
      logoInfo = result.info;
      logoCandidate = result.candidate;
    }
    const { buf, info, candidate } = result;
    const filename = `${kind}${info.ext}`;
    const outPath = path.join(outDir, filename);

    // If --force not set and file exists from a prior run, only overwrite when
    // the new buffer is different.
    if (!force && fs.existsSync(outPath)) {
      const existing = fs.readFileSync(outPath);
      if (existing.equals(buf)) {
        console.log(`  [${kind}] unchanged — skipping write`);
      } else {
        fs.writeFileSync(outPath, buf);
        console.log(`  [${kind}] wrote ${path.relative(projectRoot, outPath)}`);
      }
    } else {
      fs.writeFileSync(outPath, buf);
      console.log(`  [${kind}] wrote ${path.relative(projectRoot, outPath)}`);
    }

    manifestAssets.push({
      kind,
      path: path.relative(projectRoot, outPath).replace(/\\/g, "/"),
      src: candidate.url,
      width: info.width,
      height: info.height,
      bytes: buf.length,
      format: info.kind,
    });
    downloaded++;
  }

  // 4. Manifest --------------------------------------------------------------
  console.log(`\n[4/4] writing manifest`);
  const manifest = {
    slug,
    url,
    finalUrl,
    extractedAt: new Date().toISOString(),
    assets: manifestAssets,
  };
  const manifestPath = path.join(outDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`  wrote ${path.relative(projectRoot, manifestPath)}`);

  // Summary
  console.log(`\nSummary: ${manifestAssets.length} asset(s) in ${path.relative(projectRoot, outDir)}`);
  for (const a of manifestAssets) {
    console.log(
      `  ${a.kind.padEnd(8)} ${a.format.padEnd(5)} ${String(a.width).padStart(4)}x${String(a.height).padEnd(4)}  ${(
        a.bytes / 1024
      ).toFixed(1)} KB  ${a.path}`
    );
  }

  if (manifestAssets.length === 0) {
    console.error(`\nNo assets pulled. Possible causes: SPA without inline images, off-domain images, all candidates failed validation.`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(`pull-assets fatal: ${e.stack || e.message}`);
  process.exit(1);
});
