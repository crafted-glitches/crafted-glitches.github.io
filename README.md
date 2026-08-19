# crafted-glitches.github.io

Landing page for the **[Crafted Glitches](https://github.com/crafted-glitches)** GitHub org
— _a little bit of everything (and anything)._

Dark, minimal, futuristic. Fully static (no build step). The centrepiece is a
procedural **black-hole vortex** rendered live in a raw WebGL fragment shader,
echoing the org mark, with RGB-split glitch type, a decoding tagline, film grain,
scanlines and a custom cursor.

```
.
├── index.html        # structure + meta
├── 404.html          # glitch "signal lost" page
├── css/style.css     # dark system, overlays, glitch keyframes
├── js/vortex.js      # WebGL vortex shader (falls back to the logo)
├── js/glitch.js      # boot, text decode/scramble, cursor, telemetry
└── assets/logo.png   # org mark (favicon / OG / WebGL fallback)
```

## Local preview

Any static server works, e.g.:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Accessibility: honours `prefers-reduced-motion` and degrades to the static logo
when WebGL is unavailable.
