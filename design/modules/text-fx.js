// =========================================================================
// MODULE — TEXT FX
// =========================================================================
// Six kinetic text recipes that drop into any GSAP timeline. All deterministic
// (seeded PRNG, no Math.random) so HyperFrames frame-by-frame capture is safe.
//
// Loading (in your composition's <head>):
//   <script src="design/modules/text-fx.js"><\/script>
//   <link  rel="stylesheet" href="design/modules/text-fx.css">
//
// Use inside a composition's <script> after the timeline is built:
//   const tl = gsap.timeline({ paused: true });
//   window.__timelines["scene-id"] = tl;
//
//   textFx.explode (tl, "#title",     { at: 1.0, duration: 0.8 });
//   textFx.stamp   (tl, "#sub",       { at: 1.6 });
//   textFx.cascade (tl, "#body",      { at: 2.2, stagger: 0.08 });
//   textFx.stagger (tl, "#mark",      { at: 3.0 });
//   textFx.typeOn  (tl, "#caption",   { at: 3.8, duration: 1.2 });
//   textFx.counter (tl, "#stat",      { at: 4.5, duration: 1.4, from: 0 });
//
// Notes:
// - Each recipe internally calls splitText() which replaces the element's
//   text content with per-char or per-word <span data-fx-piece>. If your
//   element has nested HTML, that nesting is lost — strip styling before
//   splitting, or wrap each segment separately.
// - Spaces are preserved as non-breaking spaces / text nodes so layout
//   doesn't collapse.
// - For "explode/in" the chars ASSEMBLE from a scattered field (entry).
//   For "explode/out" they SCATTER away from assembled text (exit).
// - `seed` controls the deterministic scatter pattern. Same seed → same
//   pattern across renders. Defaults to 1.

(function (global) {
  "use strict";

  // ---------- helpers ----------------------------------------------------

  function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resolveTarget(target) {
    if (target instanceof Element) return target;
    if (typeof target === "string") return document.querySelector(target);
    return null;
  }

  // Wrap each char or word in a positioned <span>. Idempotent — calling twice
  // with the same mode returns the existing pieces.
  function splitText(el, mode /* "chars" | "words" */) {
    if (!el) return [];
    if (el.dataset.textFxSplit === mode) {
      return Array.from(el.querySelectorAll("[data-fx-piece]"));
    }
    const text = el.textContent;
    el.textContent = "";
    el.dataset.textFxSplit = mode;
    const pieces = [];

    if (mode === "words") {
      const tokens = text.split(/(\s+)/);
      for (const tok of tokens) {
        if (!tok) continue;
        if (/^\s+$/.test(tok)) {
          el.appendChild(document.createTextNode(tok));
        } else {
          const span = document.createElement("span");
          span.dataset.fxPiece = "word";
          span.className = "fx-piece";
          span.textContent = tok;
          el.appendChild(span);
          pieces.push(span);
        }
      }
    } else {
      // chars
      for (const ch of text) {
        if (ch === " ") {
          el.appendChild(document.createTextNode("\u00A0"));
        } else {
          const span = document.createElement("span");
          span.dataset.fxPiece = "char";
          span.className = "fx-piece";
          span.textContent = ch;
          el.appendChild(span);
          pieces.push(span);
        }
      }
    }
    return pieces;
  }

  // ---------- recipes ----------------------------------------------------

  // EXPLODE — chars assemble from scattered field (mode "in") or scatter
  // outward (mode "out"). Distance scales with text size.
  function explode(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 0.8;
    const seed = o.seed != null ? +o.seed : 1;
    const distance = +o.distance || 400;
    const mode = o.mode === "out" ? "out" : "in";
    const ease = o.ease || (mode === "in" ? "back.out(1.6)" : "power3.in");
    const stagger = +o.stagger || 0.02;

    const el = resolveTarget(target);
    if (!el) { console.warn("textFx.explode: no element for", target); return; }
    const pieces = splitText(el, "chars");
    const rand = mulberry32(seed);

    pieces.forEach((piece, i) => {
      const angle = rand() * Math.PI * 2;
      const dist  = distance * (0.5 + rand() * 0.5);
      const dx    = Math.cos(angle) * dist;
      const dy    = Math.sin(angle) * dist;
      const rot   = (rand() - 0.5) * 720;
      const t     = at + i * stagger;

      if (mode === "in") {
        timeline.from(piece,
          { x: dx, y: dy, rotation: rot, scale: 0, opacity: 0,
            duration, ease },
          t);
      } else {
        timeline.to(piece,
          { x: dx, y: dy, rotation: rot, scale: 0, opacity: 0,
            duration, ease },
          t);
      }
    });

    return { pieces: pieces.length };
  }

  // STAMP — slam-impact scale-down with brief screen shake on parent.
  function stamp(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 0.45;
    const fromScale = +o.fromScale || 1.8;
    const ease = o.ease || "back.out(2.4)";
    const shake = o.shake !== false;

    const el = resolveTarget(target);
    if (!el) { console.warn("textFx.stamp: no element for", target); return; }

    timeline.from(el,
      { scale: fromScale, opacity: 0, duration, ease },
      at);

    if (shake) {
      const parent = el.parentElement || el;
      const shakeStart = at + duration * 0.2;
      timeline.call(() => parent.classList.add("vibe-shake"),    [], shakeStart);
      timeline.call(() => parent.classList.remove("vibe-shake"), [], shakeStart + 0.18);
    }

    return { duration };
  }

  // CASCADE — words fall into place top-to-bottom.
  function cascade(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 0.6;
    const stagger = +o.stagger || 0.08;
    const distance = +o.distance || 80;
    const ease = o.ease || "power3.out";

    const el = resolveTarget(target);
    if (!el) { console.warn("textFx.cascade: no element for", target); return; }
    const pieces = splitText(el, "words");

    pieces.forEach((piece, i) => {
      timeline.from(piece,
        { y: distance, opacity: 0, duration, ease },
        at + i * stagger);
    });

    return { pieces: pieces.length };
  }

  // STAGGER — per-letter pop with rotation. The bread-and-butter kinetic.
  function stagger(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 0.6;
    const step = +o.stagger || 0.04;
    const rotation = o.rotation != null ? +o.rotation : -15;
    const fromY = +o.fromY || 0;
    const ease = o.ease || "back.out(1.7)";

    const el = resolveTarget(target);
    if (!el) { console.warn("textFx.stagger: no element for", target); return; }
    const pieces = splitText(el, "chars");

    pieces.forEach((piece, i) => {
      timeline.from(piece,
        { scale: 0, rotation, y: fromY, opacity: 0, duration, ease },
        at + i * step);
    });

    return { pieces: pieces.length };
  }

  // TYPE-ON — character reveal one-by-one, no easing (raw typewriter feel).
  function typeOn(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 1.2;

    const el = resolveTarget(target);
    if (!el) { console.warn("textFx.typeOn: no element for", target); return; }
    const pieces = splitText(el, "chars");
    if (!pieces.length) return { pieces: 0 };

    // Hide all, reveal at evenly spaced times.
    timeline.set(pieces, { opacity: 0 }, Math.max(0, at - 0.001));
    const perChar = duration / pieces.length;
    pieces.forEach((piece, i) => {
      timeline.set(piece, { opacity: 1 }, at + i * perChar);
    });

    return { pieces: pieces.length };
  }

  // COUNTER — number flips up to its target. Preserves prefix/suffix and
  // comma formatting from the source text content.
  function counter(timeline, target, opts) {
    const o = opts || {};
    const at = +o.at || 0;
    const duration = +o.duration || 1.4;
    const ease = o.ease || "power2.out";

    const el = resolveTarget(target);
    if (!el) { console.warn("textFx.counter: no element for", target); return; }

    const raw = el.textContent.trim();
    const match = raw.match(/^([^\d\-+]*)(-?[\d,]+\.?\d*)(.*)$/);
    if (!match) {
      console.warn("textFx.counter: couldn't parse number in", raw);
      return;
    }
    const prefix = match[1];
    const numStr = match[2].replace(/,/g, "");
    const suffix = match[3];
    const targetN = +numStr;
    const from = o.from != null ? +o.from : 0;
    const decimals = (numStr.split(".")[1] || "").length;
    const useCommas = match[2].includes(",");

    const format = (v) => {
      let s = v.toFixed(decimals);
      if (useCommas) {
        const [whole, dec] = s.split(".");
        s = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? "." + dec : "");
      }
      return prefix + s + suffix;
    };

    const state = { v: from };
    timeline.to(state,
      { v: targetN, duration, ease,
        onUpdate: () => { el.textContent = format(state.v); } },
      at);
    timeline.call(() => { el.textContent = format(targetN); }, [], at + duration);

    return { from, to: targetN };
  }

  global.textFx = { explode, stamp, cascade, stagger, typeOn, counter, splitText };
})(typeof window !== "undefined" ? window : this);
