/* ══════════════════════════════════════════════════════════════
   CRAFTED GLITCHES — procedural black-hole vortex (raw WebGL)
   A high-contrast, glitch-warped swirl echoing the org mark.
   Falls back to the static logo if WebGL is unavailable.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var canvas = document.getElementById("gl");
  var fallback = document.getElementById("fallback");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var gl = null;
  try {
    gl = canvas.getContext("webgl", { antialias: true, alpha: false }) ||
         canvas.getContext("experimental-webgl", { antialias: true, alpha: false });
  } catch (e) { gl = null; }

  if (!gl) {                       // no WebGL → show the real logo
    canvas.style.display = "none";
    if (fallback) fallback.hidden = false;
    return;
  }

  /* ── shaders ────────────────────────────────────────────────── */
  var VERT =
    "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2  u_res;",
    "uniform float u_time;",
    "uniform vec2  u_mouse;",   // 0..1
    "uniform float u_intro;",   // 0..1 reveal

    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }",
    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  float a = hash(i), b = hash(i+vec2(1.,0.));",
    "  float c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));",
    "  vec2 u = f*f*(3.-2.*f);",
    "  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);",
    "}",
    "float fbm(vec2 p){",
    "  float s = 0.0, a = 0.5;",
    "  for(int i=0;i<5;i++){ s += a*noise(p); p *= 2.03; a *= 0.5; }",
    "  return s;",
    "}",

    // single-channel vortex mask
    "float vortex(vec2 uv, float t){",
    "  float r = length(uv);",
    "  float a = atan(uv.y, uv.x);",
    "  float swirl = a + 2.4/(r+0.16) - t*0.28;",     // inward twist
    "  float arms  = sin(swirl*6.0);",                // 6 spiral arms (logo)
    "  float n     = fbm(vec2(swirl*1.6, r*4.0 - t*0.35));",
    "  float v     = arms*0.62 + (n-0.5)*1.35;",
    "  float edge  = 0.02 + r*0.05;",                 // softer outward
    "  float mask  = smoothstep(-edge, edge, v);",
    "  mask *= smoothstep(0.0, 0.19, r);",            // event horizon
    "  mask *= 1.0 - smoothstep(0.52, 0.98, r);",     // outer fade
    "  return mask;",
    "}",

    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / min(u_res.x, u_res.y);",
    "  uv *= 1.9;",
    "  vec2 m = (u_mouse - 0.5);",
    "  uv += m * 0.10;",                               // parallax toward cursor
    "  float t = u_time;",

    // horizontal glitch band displacement
    "  float band = step(0.985, fract(sin(floor(uv.y*40.0)+floor(t*3.0))*4113.0));",
    "  uv.x += band * (hash(vec2(floor(t*12.0), floor(uv.y*40.0)))-0.5) * 0.15;",

    // chromatic aberration: sample the mask rotated per channel
    "  float ca = 0.010 + length(m)*0.02;",
    "  float rC = vortex(uv + vec2( ca,  0.0), t);",
    "  float gC = vortex(uv,                    t);",
    "  float bC = vortex(uv + vec2(-ca,  ca*0.6), t);",
    "  vec3 col = vec3(rC, gC, bC);",
    "  float r = length(uv);",

    // calm the very centre so the wordmark stays legible
    "  col *= smoothstep(0.0, 0.30, r);",
    // faint cool core glow around the event horizon
    "  col += smoothstep(0.34, 0.02, r) * 0.22 * vec3(0.30, 0.55, 0.78);",

    // baked scanline + outer fade
    "  col *= 0.9 + 0.1*sin(gl_FragCoord.y*1.6);",
    "  col *= smoothstep(1.35, 0.30, r);",

    // dim to ambience so type reads on top
    "  col *= 0.62;",

    // intro reveal (radial wipe from centre)
    "  col *= smoothstep(0.0, 0.6, u_intro) * (0.35 + 0.65*step(r, u_intro*1.7));",

    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) {                // compile failure → fallback
    canvas.style.display = "none";
    if (fallback) fallback.hidden = false;
    return;
  }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // fullscreen triangle
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes   = gl.getUniformLocation(prog, "u_res");
  var uTime  = gl.getUniformLocation(prog, "u_time");
  var uMouse = gl.getUniformLocation(prog, "u_mouse");
  var uIntro = gl.getUniformLocation(prog, "u_intro");

  /* ── state ──────────────────────────────────────────────────── */
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var mouse = { x: 0.5, y: 0.5 };
  var target = { x: 0.5, y: 0.5 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.floor(canvas.clientWidth * dpr);
    var h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resize);
  resize();

  window.addEventListener("pointermove", function (e) {
    target.x = e.clientX / window.innerWidth;
    target.y = 1.0 - e.clientY / window.innerHeight;
  }, { passive: true });

  /* ── render loop ────────────────────────────────────────────── */
  var start = performance.now();
  var introDone = 0;

  function frame(now) {
    var t = (now - start) / 1000;
    // reduced motion → resolve to one calm, static frame (no perpetual motion)
    var tt = reduce ? 6.0 : t;

    mouse.x += (target.x - mouse.x) * 0.06;
    mouse.y += (target.y - mouse.y) * 0.06;

    introDone = Math.min(1, introDone + (reduce ? 0.06 : 0.012));

    gl.uniform1f(uTime, tt);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uIntro, introDone);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // keep animating normally; under reduced motion, stop once revealed
    if (!reduce || introDone < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
