# Anatomy of Thrust — Interactive Jet Engine Infographic

A cinematic, interactive infographic exploring how a modern turbofan — the
**Rolls-Royce Trent XWB-97** on the **Airbus A350-1000** — converts air into
97,000 pounds of thrust. Built as an embeddable Web Component.

> **Live demo:** _(Netlify URL added at sign-off)_
> **Built for:** Morph Digital · Front-End Developer Assessment · May 2026

---

## Concept

An editorial-style narrative across **nine scenes in three acts**:

**Act I — The aircraft (context)**
1. **Intro** — orbit the full A350-1000 on the runway
2. **The engine** — approach the nacelle under the wing
3. **Engine exterior** — the aircraft ghosts out and the engine is revealed inside it

**Act II — Anatomy of thrust (5 numbered stages)**
4. **Intake** — the 22-blade fan draws in 1,335 kg of air per second
5. **Compression** — 14 stages raise pressure to 50:1
6. **Combustion** — fuel ignites at 1,700°C (click to ignite)
7. **Turbine** — six stages spin the HP shaft at 12,200 RPM
8. **Thrust** — 97,000 lbf per engine

**Act III — Departure (payoff)**
9. **Departure** — the aircraft rolls down the runway, lifts off, and cruises through
   an atmospheric sky, then **seamlessly loops back to the intro** (no manual replay)

The interactive asset is a custom HTML element (`<jet-engine-infographic>`) so it can be
dropped into any host page regardless of framework — Nuxt, WordPress, plain HTML, etc.
The demo page wraps it in a full editorial experience (cinematic hero, sticky chapter
scroll, animated stat strip, and a parallax pull quote).

---

## Tech Stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Markup | HTML5 + Custom Element | Framework-agnostic, embeddable anywhere |
| Styling | Vanilla CSS (Shadow DOM scoped) | Zero leakage into host page |
| 3D | Three.js (loaded A350 GLB + primitives engine) | Recognisable airframe + individually animatable engine parts |
| Post-FX | EffectComposer + UnrealBloomPass | Restrained selective bloom on hot/bright pixels |
| Animation | GSAP + ScrollTrigger | Cinematic scroll choreography (hero + editorial sections) |
| Smooth scroll | Lenis | Buttery host-page scrolling, synced to the GSAP ticker |
| Build | Vite | Fast HMR for dev, optimised static output for Netlify |

The component is encapsulated in **Shadow DOM** to prevent style or script collisions with
the host page.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

Open <http://localhost:5173> in your browser.

---

## Project Structure

```
/jet-engine-infographic
├── index.html              ← Demo host page (hero → editorial sections → embedded component)
├── /public
│   ├── a350.glb            ← Airbus A350-1000 model (DRACO-compressed)
│   ├── A350.png · airbus_a350_blueprint.png  ← Hero assets
│   ├── chapter-1/2/3.png · quote-bg.png      ← Editorial-section imagery
│   └── /favicon            ← Favicons + site.webmanifest
├── /src
│   ├── jet-engine.js       ← <jet-engine-infographic> Web Component (+ bloom composer)
│   ├── engine-model.js     ← Trent XWB-97 engine + procedural A350 fallback
│   ├── model-loader.js     ← GLB loading, normalization, DRACO, graceful fallback
│   ├── scenes.js           ← Camera presets, particles, transitions, takeoff finale
│   ├── interactions.js     ← Raycaster tooltips + click-to-ignite
│   ├── sky.js              ← Departure finale: Sky shader + drifting clouds
│   ├── host-animations.js  ← Lenis + GSAP hero timeline + editorial ScrollTriggers
│   ├── fonts.css · host.css
├── /docs                   ← PROJECT-SPEC · DESIGN-SYSTEM
├── vite.config.js
├── package.json
└── README.md
```

See [docs/PROJECT-SPEC.md](docs/PROJECT-SPEC.md) for the full living spec and
[docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) for visual decisions.

---

## Embedding the Component

To embed the infographic in any page:

```html
<script type="module" src="path/to/jet-engine.js"></script>
<jet-engine-infographic></jet-engine-infographic>
```

That's it. No framework setup, no build step required on the host side.

---

## Features Implemented

- [x] Loaded A350-1000 GLB (DRACO) with a full procedural fallback
- [x] Trent XWB-97 engine built from Three.js primitives (every part individually animatable)
- [x] Cinematic three-point lighting + ACES tone mapping + selective bloom
- [x] Atmospheric blue Sky shader + drifting clouds, with per-scene tone-mapping exposure
- [x] Idle motion (continuous fan + turbine rotation, subtle engine sway)
- [x] 9-scene choreography with GSAP camera + content transitions
- [x] Hover tooltips on aircraft zones and engine parts (raycasting)
- [x] Click-to-ignite combustion sequence (flash, bloom ramp, camera shake/pull-back)
- [x] Drag-to-orbit exploration (Scenes 0 & 8) with Lenis-aware wheel-zoom ownership
- [x] Animated data counters (count up from 0 per scene)
- [x] Departure finale — runway takeoff → cruise → **seamless auto-loop back to Scene 0**
- [x] Scene 0 CTAs (VIEW ENGINE + WATCH TAKEOFF shortcut) and a top-bar ⟲ replay control
- [x] Host editorial sections — sticky chapter scroll, animated stat strip, pull-quote parallax
- [x] Cinematic scroll hero (plane flyby → A350 title → blueprint reveal); always starts at the top on refresh
- [x] Encapsulated in Shadow DOM
- [x] Responsive layout + `prefers-reduced-motion` handling — 44px touch targets, mobile
  chapter carousel (numbered indicators), portrait engine framing, hero reveal restack

### Known limitations
- Hover tooltips are pointer-only — touch devices have no hover, so engine-part tooltips
  don't appear on mobile (an accepted trade-off; all primary actions are buttons).
- DRACO decoder loads from the Google CDN (can be vendored to `public/draco/` for offline use).
- Targets evergreen browsers (Chrome, Safari, Firefox); no IE/legacy support.

---

## Author

Built by **Ahmad Baihaqie Mohd Yusri (Qie)** — UI/UX-focused Software Engineer
based in Kuala Lumpur.

axelnovaventures.com
