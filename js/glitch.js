/* ══════════════════════════════════════════════════════════════
   CRAFTED GLITCHES — interface behaviour
   boot · text decode/scramble · custom cursor · live coordinates
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GLYPHS = "01<>/\\[]{}*#%&$@!?=+-░▒▓█▚▞".split("");
  function rnd(a) { return a[(Math.random() * a.length) | 0]; }

  /* ── decode-in: char-by-char scramble that resolves to target ── */
  function decode(el, text, opts) {
    opts = opts || {};
    var speed = opts.speed || 26;        // ms/tick
    var settle = opts.settle || 2;       // ticks a char scrambles before locking
    var i = 0, tick = 0;

    var timer = setInterval(function () {
      tick++;
      var s = "";
      for (var k = 0; k < text.length; k++) {
        if (k < i) { s += text[k]; }
        else if (k === i) { s += text[k] === " " ? " " : rnd(GLYPHS); }
        else { s += ""; }
      }
      el.textContent = s;
      if (tick % settle === 0) i++;
      if (i > text.length) {
        clearInterval(timer);
        el.textContent = text;
        el.classList.add("done");
        if (opts.done) opts.done();
      }
    }, speed);
  }

  /* ── quick scramble reveal for short labels ──────────────────── */
  function scramble(el) {
    var text = el.getAttribute("data-final") || el.textContent;
    el.setAttribute("data-final", text);
    if (reduce) { el.textContent = text; return; }
    var frame = 0, total = 10 + text.length;
    var timer = setInterval(function () {
      frame++;
      var reveal = Math.floor((frame / total) * text.length);
      var s = "";
      for (var k = 0; k < text.length; k++) {
        s += (k < reveal || /\s/.test(text[k])) ? text[k] : rnd(GLYPHS);
      }
      el.textContent = s;
      if (frame >= total) { clearInterval(timer); el.textContent = text; }
    }, 40);
  }

  /* ── boot sequence, then reveal the interface ────────────────── */
  var boot = document.getElementById("boot");
  function runReveal() {
    // scramble all short labels
    document.querySelectorAll("[data-scramble]").forEach(function (el, idx) {
      setTimeout(function () { scramble(el); }, 120 * idx);
    });
    // decode the tagline
    var tag = document.querySelector("[data-decode]");
    if (tag) {
      var txt = tag.getAttribute("data-decode");
      if (reduce) { tag.textContent = txt; tag.classList.add("done"); }
      else { tag.textContent = ""; setTimeout(function () { decode(tag, txt, { speed: 24, settle: 1 }); }, 400); }
    }
  }

  function dismissBoot() {
    if (boot) boot.classList.add("gone");
    runReveal();
  }

  if (reduce) {
    dismissBoot();
  } else {
    // hold the "establishing link" beat, then wipe
    setTimeout(dismissBoot, 1400);
  }

  /* ── custom cursor ───────────────────────────────────────────── */
  var cursor = document.getElementById("cursor");
  var fine = window.matchMedia("(pointer:fine)").matches;
  if (cursor && fine) {
    document.body.classList.add("cursor-on");
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var tx = cx, ty = cy;
    window.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll("a, .node").forEach(function (el) {
      el.addEventListener("pointerenter", function () { cursor.classList.add("is-hot"); });
      el.addEventListener("pointerleave", function () { cursor.classList.remove("is-hot"); });
    });
  } else if (cursor) {
    cursor.style.display = "none";
  }

  /* ── live pseudo-coordinate readout (obscure telemetry vibe) ── */
  var coord = document.getElementById("coord");
  if (coord && !reduce) {
    setInterval(function () {
      var a = (Math.random() * 90).toFixed(4);
      var b = (Math.random() * 180).toFixed(4);
      coord.textContent = a + " / " + b;
    }, 1400);
  }

  /* ── occasional full-frame glitch flicker on the mark ────────── */
  var mark = document.querySelector(".mark");
  if (mark && !reduce) {
    setInterval(function () {
      if (Math.random() < 0.5) return;
      mark.style.transform = "translate(" + ((Math.random() - 0.5) * 4).toFixed(1) + "px,0) skewX(" +
        ((Math.random() - 0.5) * 2).toFixed(1) + "deg)";
      setTimeout(function () { mark.style.transform = ""; }, 90);
    }, 3200);
  }
})();
