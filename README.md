<div align="center">

# ✈&nbsp;&nbsp;ANATOMY OF THRUST

### An interactive, cinematic infographic of a modern turbofan

How the **Rolls-Royce Trent XWB-97** on the **Airbus A350-1000** turns still air
into **97,000 lbf** of thrust — told across nine scenes and shipped as a single
embeddable Web Component.

<br/>

![Three.js](https://img.shields.io/badge/THREE.JS-r165-0A0B0F?style=for-the-badge&logo=threedotjs&logoColor=4FC3F7)
![GSAP](https://img.shields.io/badge/GSAP-SCROLLTRIGGER-0A0B0F?style=for-the-badge&logo=greensock&logoColor=4FC3F7)
![Lenis](https://img.shields.io/badge/LENIS-SMOOTH_SCROLL-0A0B0F?style=for-the-badge)
![Vite](https://img.shields.io/badge/VITE-5-0A0B0F?style=for-the-badge&logo=vite&logoColor=FF6B35)
![Web Component](https://img.shields.io/badge/WEB_COMPONENT-SHADOW_DOM-0A0B0F?style=for-the-badge)

<br/>

### [▶ &nbsp;View the live demo](https://anatomy-of-thrust.netlify.app/)

Built for **Morph Digital** · Front-End Developer Assessment · May 2026

</div>

> *Editorial engineering documentary — cinematic, restrained, technical, and quietly
> luxurious.* The design philosophy that drives the build drives this page too:
> **type does the heavy lifting, motion is choreographed, and nothing is decorative.**

---

### Flight plan

[**The story**](#the-story) &nbsp;·&nbsp;
[**Quickstart**](#quickstart) &nbsp;·&nbsp;
[**Embed it anywhere**](#embed-it-anywhere) &nbsp;·&nbsp;
[**Features**](#features) &nbsp;·&nbsp;
[**Under the hood**](#under-the-hood) &nbsp;·&nbsp;
[**Design language**](#design-language) &nbsp;·&nbsp;
[**Assumptions--limitations**](#assumptions--limitations)

---

## The story

An editorial-style narrative across **nine scenes in three acts** — the air's journey
through the engine, choreographed as one continuous camera move:

```
  AIR  ──▸  ◗ FAN  ──▸  ▮▮▮ COMPRESSOR  ──▸  ◆ COMBUSTOR  ──▸  ✦ TURBINE  ──▸  THRUST ▸▸▸
          intake         50:1 pressure       1,700°C ignite     12,200 RPM      97,000 lbf
```

| Act | # | Scene | What happens |
|:---:|:---:|---|---|
| **I**<br/>_context_ | 0 | **Intro** | Orbit the full A350-1000 on the runway |
| | 1 | **The engine** | Approach the nacelle under the wing |
| | 2 | **Engine exterior** | The aircraft ghosts out; the engine is revealed inside it |
| **II**<br/>_anatomy_ | 3 | **Intake** | The 22-blade fan draws in 1,335 kg of air per second |
| | 4 | **Compression** | 14 stages raise pressure to 50:1 |
| | 5 | **Combustion** | Fuel ignites at 1,700°C — **click to ignite** |
| | 6 | **Turbine** | Six stages spin the HP shaft at 12,200 RPM |
| | 7 | **Thrust** | 97,000 lbf per engine |
| **III**<br/>_payoff_ | 8 | **Departure** | The aircraft rolls down the runway, lifts off, cruises through an atmospheric sky — then **seamlessly loops back to the intro** |

The interactive itself is a custom element — `<jet-engine-infographic>` — so it drops into
any host page regardless of framework (Nuxt, WordPress, plain HTML…). The demo page wraps
it in a full editorial experience: a cinematic scroll hero, a sticky chapter scroll, an
animated stat strip, and a parallax pull-quote.

---

## Quickstart

```bash
npm install        # install dependencies
npm run dev        # start the dev server  →  http://localhost:5173
npm run build      # produce the optimised static build (dist/)
npm run preview    # serve the production build locally
```

That's the whole loop — `npm install`, then `npm run dev`, and open
**[localhost:5173](http://localhost:5173)**. No environment variables, no API keys, no
backend.

---

## Embed it anywhere

The infographic is encapsulated in **Shadow DOM**, so it carries its own styles and never
leaks into — or inherits from — the host page. Two lines:

```html
<script type="module" src="path/to/jet-engine.js"></script>
<jet-engine-infographic></jet-engine-infographic>
```

No framework setup. No build step on the host side. Drop it into a section and it owns that
box.

---

## Features

Twelve-plus interactive elements (the brief asked for three). They split cleanly between
the **interactive itself** and the **editorial host page** that frames it.

### Inside the component

The 3D piece is the centrepiece — a continuous, scrubbable engine story.

- **Real airframe, animatable engine.** A DRACO-compressed A350-1000 GLB anchors the
  aircraft acts; the Trent XWB-97 is built from Three.js primitives so every part — fan,
  compressor, combustor, turbine — animates individually. A full procedural fallback stands
  in if the GLB ever fails to load.
- **Cinematic rendering.** Three-point lighting, ACES tone mapping, and a restrained
  `UnrealBloomPass` that blooms only the hot/bright pixels. Acts I & III play against an
  atmospheric **Sky shader** with drifting clouds; per-scene tone-mapping exposure is the
  real "how blue" lever.
- **Choreographed scene flow.** Nine scenes driven by GSAP camera + content transitions,
  with idle motion that never stops — the fan and turbine keep turning, the engine sways
  gently, so the frame is never static.
- **Hover to inspect.** Raycaster-driven tooltips resolve aircraft zones (Scene 0) and
  named engine parts (Scenes 3–7).
- **Click to ignite.** Scene 5 fires a full combustion timeline — flash, bloom ramp, camera
  shake and pull-back, exhaust puff.
- **Drag to explore.** Free orbit in Scenes 0 & 8 with damped `OrbitControls`, and
  Lenis-aware wheel-zoom ownership so the page and the canvas never fight over the scroll.
- **Live data readouts.** Per-scene counters animate up from zero with `tabular-nums`, so
  digits stay aligned as they tick.
- **The departure finale.** Runway takeoff → cruise → a **seamless auto-loop back to
  Scene 0** — no manual replay needed.
- **Always a way through.** Scene 0 offers two entry CTAs (a considered _View engine_ walk
  and a _Watch takeoff_ shortcut to the finale), plus a ⟲ replay control in the top bar.

### The host editorial experience

The surrounding page turns "a Web Component demo" into "a complete editorial experience
built around a Web Component" — modelled on Dassault Systèmes' industrial storytelling.

- **Cinematic scroll hero** — a flyby plane enters, expands, and dissolves into the A350
  title and a blueprint reveal; always starts at the top on refresh.
- **Sticky chapter scroll** — a pinned media frame cross-fades through three chapters
  (aircraft in flight → engine cutaway → test rig) as the text column scrolls past.
- **Animated stat strip** — four mono figures count up once as the strip enters view.
- **Pull-quote parallax** — a full-bleed quote whose background scrubs slower than the
  text, with a fade-up reveal.
- **Buttery smooth scroll** — Lenis driven by the GSAP ticker, synced to ScrollTrigger.

### Built for every screen

Responsive throughout, with `prefers-reduced-motion` honoured (particles off, scene
changes cross-fade instead of flying the camera). On mobile: 44px touch targets, a portrait
engine framing, a numbered chapter carousel in place of the sticky scroll, and a restacked
hero reveal.

---

## Under the hood

| Concern | Choice | Why |
| --- | --- | --- |
| Markup | HTML5 + Custom Element | Framework-agnostic, embeddable anywhere |
| Styling | Vanilla CSS, Shadow-DOM scoped | Zero leakage into the host page |
| 3D | Three.js (GLB airframe + primitives engine) | Recognisable aircraft, individually animatable engine parts |
| Post-FX | EffectComposer + UnrealBloomPass | Restrained selective bloom on hot/bright pixels |
| Animation | GSAP + ScrollTrigger | Cinematic scroll choreography, hero + editorial sections |
| Smooth scroll | Lenis | Buttery host-page scrolling, synced to the GSAP ticker |
| Build | Vite | Fast HMR in dev, optimised static output for Netlify |

<details>
<summary><b>Project structure</b> — click to expand</summary>

```
jet-engine-infographic/
├── index.html              ← Demo host page (hero → editorial sections → embedded component)
├── public/
│   ├── a350.glb            ← Airbus A350-1000 model (DRACO-compressed)
│   ├── A350.png · airbus_a350_blueprint.png   ← Hero assets
│   ├── chapter-1/2/3.png · quote-bg.png        ← Editorial-section imagery
│   └── favicon/            ← Favicons + site.webmanifest
├── src/
│   ├── jet-engine.js       ← <jet-engine-infographic> Web Component (+ bloom composer)
│   ├── engine-model.js     ← Trent XWB-97 engine + procedural A350 fallback
│   ├── model-loader.js     ← GLB loading, normalization, DRACO, graceful fallback
│   ├── scenes.js           ← Camera presets, particles, transitions, takeoff finale
│   ├── interactions.js     ← Raycaster tooltips + click-to-ignite
│   ├── sky.js              ← Departure finale: Sky shader + drifting clouds
│   ├── host-animations.js  ← Lenis + GSAP hero timeline + editorial ScrollTriggers
│   ├── fonts.css · host.css
├── docs/                   ← PROJECT-SPEC · DESIGN-SYSTEM
├── vite.config.js
└── package.json
```

</details>

---

## Design language

This project ships with its own design system. The one sentence that settles every
decision:

> *"Would this appear in a Rolls-Royce or 3DEXPERIENCE brand film?"* — if yes, ship it; if
> no, cut it.

Three guiding principles run through every pixel: **restraint over decoration**, **type
does the heavy lifting** (high-contrast serif headlines + precise monospace data), and
**motion is choreographed, not sprinkled** — no bouncy easings, no decorative wiggles.

→ [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) for the full visual language (tokens,
type, motion) · [docs/PROJECT-SPEC.md](docs/PROJECT-SPEC.md) for the living build spec.

---

## Assumptions & limitations

**Assumptions**

- A **WebGL2-capable evergreen browser** (Chrome, Safari, Firefox). No IE/legacy support.
- **Network access on first load** for the DRACO decoder (Google CDN). It can be vendored
  to `public/draco/` for fully offline use.
- The engine is an **authored, recognisable representation** built from Three.js
  primitives — the figures are real, the geometry is illustrative, not CAD-accurate.
- Canvas sizing was designed against the brief's targets (1440×900 desktop, 375×677 mobile)
  but implemented **fluid**, so it adapts beyond those exact dimensions.

**Limitations**

- **Hover tooltips are pointer-only.** Touch devices have no hover, so engine-part tooltips
  don't appear on mobile — an accepted trade-off, since all primary actions are buttons.
- **DRACO decoder loads from a CDN** by default (see assumptions above to vendor it).
- **WebGL-dependent.** The GLB has a procedural fallback, but the experience as a whole
  requires WebGL.

---

<div align="center">

Built by **Ahmad Baihaqie Mohd Yusri (Qie)** — UI/UX-focused Software Engineer · Kuala Lumpur

[axelnovaventures.com](https://axelnovaventures.com)

</div>
