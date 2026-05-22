# PROJECT SPEC — Anatomy of Thrust

> **Project:** Interactive Jet Engine Infographic
> **Subject:** Airbus A350-1000 · Rolls-Royce Trent XWB-97
> **Client context:** Morph Digital · Front-End Developer Assessment
> **Submission deadline:** 27 May 2026, 12:00pm

This is a living spec — it documents the project **as built**, not the original
day-one plan. The companion [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) is the source of
truth for visual decisions.

---

## 1. Project Overview

A cinematic, interactive infographic that tells the story of how a modern turbofan
converts air into thrust — narrated through a real aircraft and a real engine: the
**Airbus A350-1000** and its **Rolls-Royce Trent XWB-97**, the most powerful civil
turbofan in service. The deliverable is a **standalone embeddable Web Component**
that occupies a section of a host webpage (a faux editorial article), not a
multi-page site.

The experience runs across **9 scenes** in three acts:

**Act I — The aircraft (context)**
1. **Intro** — orbit the full A350-1000 on the runway
2. **The engine** — approach the nacelle under the wing
3. **Engine exterior** — the aircraft ghosts out and the engine is revealed inside it

**Act II — Anatomy of thrust (the engine, 5 numbered stages)**
4. **Intake** — the 22-blade fan draws in 1,335 kg of air per second
5. **Compression** — 14 stages raise pressure to 50:1
6. **Combustion** — fuel ignites at 1,700°C (click to ignite)
7. **Turbine** — six stages spin the HP shaft at 12,200 RPM
8. **Thrust** — 97,000 lbf per engine

**Act III — Departure (payoff)**
9. **Departure** — the aircraft flies through an atmospheric sky as the camera orbits

Aesthetic direction: **editorial × cinematic × premium engineering documentary** —
Apple product page × Dassault Systèmes industrial storytelling × aviation magazine
spread.

---

## 2. Hard Requirements (from the brief)

| # | Requirement | How it's met |
|---|---|---|
| 1 | Canvas size — Desktop 1440×900, Mobile 375×677 | Fluid/responsive: component capped at 1440px wide; stage is 16:9 (≤720px tall) on desktop, taller portrait crop on mobile. Designed against the brief's targets but not pinned to fixed pixels — see §10. |
| 2 | Built with HTML, CSS, JavaScript | Vanilla ES modules. No Nuxt/React/Vue. |
| 3 | Animation libraries allowed | GSAP + ScrollTrigger, with Lenis for smooth scroll |
| 4 | Web Component implementation | Custom Element + full Shadow DOM |
| 5 | Minimum 3 types of interactive elements | 7+ delivered — see §7 |
| 6 | Responsive design — desktop + mobile | Two-panel responsive layout with mobile media queries |
| 7 | Smooth scrolling/transitions | Lenis smooth scroll + GSAP camera/text choreography |
| 8 | Maintainable, well-documented code | Modular `src/`, "why" comments throughout |
| 9 | Git repository | Public repo |
| 10 | README with run instructions, features, limitations | Maintained |
| 11 | Hosted demo on Netlify | `base: './'` set for static hosting; deploy at sign-off |
| 12 | **Bonus:** Three.js integration | Core — GLB aircraft + primitives engine + Sky shader |

---

## 3. Tech Stack

```
HTML5 + Vanilla JS (ES Modules)
├── Web Components (Custom Elements + Shadow DOM)
├── Three.js
│   ├── GLTFLoader + DRACOLoader → Airbus A350 GLB (public/a350.glb)
│   ├── primitives                → Trent XWB-97 engine (engine-model.js)
│   ├── Sky shader + sprites      → departure finale (sky.js)
│   └── EffectComposer + UnrealBloomPass → selective bloom on hot pixels (jet-engine.js)
├── GSAP + ScrollTrigger          → camera, text, counters, hero timeline, editorial sections
├── Lenis                         → smooth host-page scrolling
├── @fontsource-variable          → Playfair Display + JetBrains Mono (Geist via CDN)
└── Vite                          → dev server + static build
```

**Why this stack:**
- Vanilla + Shadow DOM = framework-agnostic embeddability (the whole point).
- Three.js does double duty: a loaded GLB for the recognisable airframe, hand-built
  primitives for the engine so every part stays individually animatable.
- Lenis gives the host article the buttery scroll the cinematic hero needs; GSAP
  ScrollTrigger pins and scrubs that hero, while the component drives its own scenes.
- Vite for fast HMR and a tiny optimised build.

---

## 4. Project Structure

```
/jet-engine-infographic
├── index.html              ← Host page: cinematic hero + faux editorial article
│                              (hero → intro → sticky chapters → stat strip →
│                               <jet-engine-infographic> → outro → pull quote → footer)
├── /public
│   ├── a350.glb            ← Airbus A350-1000 model (DRACO-compressed)
│   ├── A350.png            ← Hero flyby plane
│   ├── airbus_a350_blueprint.png ← Hero blueprint reveal
│   ├── chapter-1/2/3.png   ← Sticky-chapter media (aircraft · engine · test rig)
│   ├── quote-bg.png        ← Pull-quote parallax background
│   └── /favicon            ← Favicons + site.webmanifest (PWA install metadata)
├── /src
│   ├── jet-engine.js       ← <jet-engine-infographic> Web Component (scene data, styles, Three.js setup, bloom composer)
│   ├── engine-model.js     ← Trent XWB-97 engine + procedural A350 fallback body
│   ├── model-loader.js     ← GLB loading, normalization, DRACO, graceful fallback
│   ├── scenes.js           ← Camera presets, particles, scene transitions, counters, takeoff finale
│   ├── interactions.js     ← Raycaster tooltips + click-to-ignite sequence
│   ├── sky.js              ← Departure finale: Sky shader + drifting cloud sprites
│   ├── host-animations.js  ← Lenis + GSAP pinned hero timeline + editorial-section ScrollTriggers (host page)
│   ├── fonts.css           ← @fontsource-variable imports
│   └── host.css            ← Host page styles only (incl. editorial sections)
├── /docs
│   ├── PROJECT-SPEC.md           ← this file
│   ├── DESIGN-SYSTEM.md          ← visual source of truth
│   └── EDITORIAL-SECTIONS-SPEC.md ← spec for the 3 host-page editorial sections
├── vite.config.js
├── package.json
└── README.md
```

---

## 5. Design System (summary)

Full detail lives in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). Headlines:

**Color** — near-black canvas (`#0A0B0F`), warm-white ink (`#F5F5F0`), a cool→hot
story arc: electric blue (`#4FC3F7`) for air/intake → neutral compression → combustion
orange (`#FF6B35`) → warm amber (`#FFB07A`) for turbine/thrust. The aircraft acts (Act I)
and finale (Act III) use a sky-blue ambient palette; the engine anatomy (Act II) plays
out against dark.

**Type** — **Playfair Display** (variable) for editorial serif headlines, **Geist Sans**
for body/UI, **JetBrains Mono** (variable) for labels and data readouts. (The original
spec used Fraunces; it was replaced by Playfair Display — see DESIGN-SYSTEM §3.)

**Motion** — `power2/power3` GSAP easings, no bounce/elastic. Idle motion is sacred:
fan + turbine always rotate, particles drift, clouds stream in the finale.

---

## 6. Scene-by-Scene Spec

Scene data lives in the `SCENES` array in [src/jet-engine.js](../src/jet-engine.js);
camera presets in `SCENE_CAMERAS` in [src/scenes.js](../src/scenes.js).

### Act I — The aircraft

**Scene 0 — Intro** (`intro`)
- **Camera:** Wide runway orbit of the full aircraft (OrbitControls enabled, wheel-zoom on)
- **Headline:** *"Explore the aircraft."*
- **Stats:** `MAX RANGE: 16,100 km` · `PASSENGERS: 369`
- **Interaction:** Drag to orbit, hover for aircraft-zone tooltips, **VIEW ENGINE** CTA
- **Environment:** Sky-blue background + fog, bright sun lighting

**Scene 1 — The engine** (`engine-approach`)
- **Camera:** Front-side approach, the starboard nacelle framed under the wing
- **Headline:** *"The engine."*
- **Stats:** `ENGINES: 2` · `TOTAL THRUST: 194,000 lbf`
- **CTA:** **EXPLORE ENGINE**

**Scene 2 — Engine exterior** (`exterior`)
- **Camera:** Pulls onto the nacelle centreline; engine sits dead-centre
- **Headline:** *"The machine beneath the wing."*
- **Stats:** `DRY WEIGHT: 7,277 kg` · `DIAMETER: 3.0 m`
- **Animation:** Aircraft ghosts to 25% opacity and aligns its nacelle to origin; the
  primitives engine fades in inside it; sky darkens. **BEGIN WALKTHROUGH** CTA.

### Act II — Anatomy of thrust

**Scene 3 — Intake** (`intake`)
- **Camera:** On centreline, looking into the intake face
- **Headline:** *"It begins with air."* · *Every second, the 22-blade fan draws in 1,335 kg of air.*
- **Stats:** `AIR FLOW: 1,335 kg/s` · `FAN DIAMETER: 3.0 m`
- **Animation:** Blue intake particle stream into the fan

**Scene 4 — Compression** (`compression`)
- **Headline:** *"Squeezed fifty times tighter."*
- **Stats:** `PRESSURE RATIO: 50:1` · `COMPRESSOR STAGES: 14`

**Scene 5 — Combustion** ⚡ (`combustion`, click to ignite)
- **Camera:** Tight on the combustion chamber
- **Headline:** *"Then, ignition."* · *Fuel ignites at 1,700°C.*
- **Stats:** `TEMPERATURE: 1,700°C` · `FUEL BURN: 4,200 L/hr`
- **Animation:** **IGNITE** button → flash, emissive ramp to 2.8, sustained breathing
  pulse, a one-shot exhaust puff, plus a camera impact-shake then pull-back.

**Scene 6 — Turbine** (`turbine`)
- **Headline:** *"The fire spins the wheel."*
- **Stats:** `HP SHAFT SPEED: 12,200 RPM` · `EFFICIENCY: 42%`

**Scene 7 — Thrust** (`thrust`)
- **Camera:** Slight elevation, wide reveal of the whole engine
- **Headline:** *"And the world moves."* · *97,000 lbf of thrust per engine.*
- **Stats:** `THRUST: 97,000 lbf` · `BYPASS RATIO: 9.3:1`
- **Animation:** Orange exhaust plume from the nozzle. **Watch takeoff** leads to the finale.

### Act III — Departure

**Scene 8 — Departure** (`departure`)
- **Camera:** A scripted **takeoff run** (`playTakeoff()` in scenes.js) — the aircraft
  starts parked at the back of the runway, a low chase cam shows it accelerate down the
  roll, it rotates nose-up and lifts off, the runway fades away beneath it, and the camera
  settles into a slow auto-orbiting hero sky shot (OrbitControls re-enabled).
- **Headline:** *"And it flies."*
- **Stats:** `CRUISE SPEED: 945 km/h` · `CRUISE ALTITUDE: 13,100 m`
- **Environment:** Three.js Sky shader + drifting cloud sprites; the aircraft bobs and
  banks while the cloud field streams past. **REPLAY** returns to Scene 0.

---

## 7. Interactive Elements (10+ — far exceeds the minimum of 3)

| # | Element | Where | Implementation |
|---|---|---|---|
| 1 | Cinematic scroll hero | Host page | GSAP ScrollTrigger pins the hero; a flyby plane enters, expands, and dissolves into the A350 title + blueprint, scrubbed by Lenis |
| 2 | Smooth scrolling | Host page | Lenis driven by the GSAP ticker, synced to ScrollTrigger |
| 3 | Sticky chapter scroll | Host page (Section B) | A pinned media frame cross-fades through 3 chapter images as the right-hand text column scrolls past (3DS-style); on mobile it becomes a horizontal swipe carousel with progress dots. See EDITORIAL-SECTIONS-SPEC.md |
| 4 | Animated stat strip | Host page (Section A) | Four mono stats count up from 0 once, when the strip enters the viewport |
| 5 | Pull-quote parallax | Host page (Section C) | Full-bleed quote whose background image scrubs slower than the text on scroll, with a fade-up reveal |
| 6 | Drag-to-orbit | Scenes 0 & 8 | OrbitControls with damping; wheel-zoom toggled per scene via `data-lenis-prevent` |
| 7 | Hover tooltips (raycasting) | Scene 0 + Scenes 3–7 | Raycaster resolves aircraft zones (Scene 0) and named engine parts (anatomy scenes) |
| 8 | Scene navigation | All scenes | CTA buttons (Acts I/III) + Prev/Next stage nav (Act II), each driving a GSAP camera + content transition |
| 9 | Click-to-ignite | Scene 5 | Button triggers the combustion timeline + bloom ramp + camera shake/pull-back + exhaust puff |
| 10 | Animated data counters | Every scene | Numbers count up from 0 on scene activation (GSAP, tabular-nums) |

---

## 8. Three.js Models

### Aircraft — loaded GLB (`public/a350.glb`)
- Loaded with **GLTFLoader + DRACOLoader** (Google CDN decoder).
- `model-loader.js` normalizes it: rotates nose to +X, scales the fuselage to a target
  length, drops the belly onto the runway plane, shifts so the starboard nacelle
  (`engine_r`) sits co-axial with the primitives engine at the origin, and patches every
  material to `transparent: true` (so the Scene 2 ghost-fade works) with sRGB textures.
- **Graceful fallback:** if the GLB is missing or fails, `buildAircraftBody()` builds a
  full procedural A350 (fuselage, wings, tail, engine pods, runway) so the demo never
  breaks.

### Engine — built from primitives (`engine-model.js`)
Hand-built so each part is individually animatable and tooltip-targetable:
- `nacelle` — fan cowl, intake lip, bypass + fan-nozzle rings, core cowl, chevron serrations
- `fan` — 22 wide-chord blades + spinner + hub (named `fan`)
- `compressor` — 4 stage rings (named `compressor`)
- `combustion` — emissive cylinder + `combustionGlow` shell
- `turbine` — 3 stage rings, counter-rotating (named `turbine`)
- `nozzle` — core nozzle + exhaust plug cone + exit ring

**Lighting:** sun key light, electric-blue rim, combustion-orange fill, sky ambient.
Ambient/key intensity and fog are re-tuned per act (bright sky in Acts I/III, dark in Act II).
ACES filmic tone mapping on the renderer.

**Post-processing — selective bloom.** The scene renders through an `EffectComposer`
(`RenderPass` → `UnrealBloomPass` → `OutputPass`) with a high threshold (~0.72) so only
bright/hot pixels bloom past their edges. Strength is driven per scene by `setBloom()`:
a low base (`BLOOM_BASE ≈ 0.16`) through the cool scenes, ramped on combustion (≈0.85
while ignited) and the thrust reveal (≈0.55). The composer falls back to a direct render
if it fails to initialise.

### Finale environment (`sky.js`)
Three.js `Sky` atmospheric-scattering shader + a recycled field of canvas-painted
billboard cloud sprites that drift past the flying aircraft. Hidden (zero cost) until Scene 8.

---

## 9. Web Component API

```html
<jet-engine-infographic></jet-engine-infographic>
```

**Encapsulation:** Full Shadow DOM — no style/script leakage into the host page. Design
tokens are declared on `:host`.

**Host integration:** the component sets `data-lenis-prevent` on itself during orbit
scenes (0 & 8) so the mouse wheel zooms the canvas there but scrolls the host page
everywhere else.

**Embeddability:** drops into a vanilla HTML page, a Nuxt page (`client-only`), a
WordPress block, or a CodePen with a single tag + module script.

---

## 10. Responsive Behavior

The component is **fluid**, designed against the brief's desktop/mobile targets rather
than pinned to fixed pixels:

| Breakpoint | Behavior |
|---|---|
| Desktop (≥769px) | Component capped at 1440px wide; stage is 16:9, max-height 720px; all features active |
| Mobile (≤768px) | Stage switches to a taller portrait crop (~375:560, max-height 560px); tighter padding; smaller type; data readouts compressed; **on-canvas controls (ignite / explore / stage-nav) clear the 44px touch-target minimum**; OrbitControls handle touch (drag + pinch) |
| Narrow phone (≤420px) | Data row + stage-nav padding tighten further so nothing crowds or overflows |

**Host page** mirrors this: the hero uses `100dvh` (no URL-bar crop), its title scales
down and the secondary flight-strip metrics collapse so the line never overflows; the
hero's A350 reveal **restacks** on mobile (title centred up top, full blueprint below,
instead of the desktop title-left / blueprint-right split — driven by `gsap.matchMedia`);
body copy drops the desktop full-bleed negative margins for a comfortable reading gutter,
the sticky-chapter section becomes a **horizontal swipe carousel** (CSS scroll-snap, one
image-per-card, numbered progress indicators), and the pull quote reclaims its inner padding.

Pixel ratio is capped at 2 for performance. `prefers-reduced-motion` collapses
animation/transition durations.

---

## 11. Current Build Status

### ✅ Shipped
- [x] Project scaffold, Vite config (`base: './'` for static hosting)
- [x] Cinematic host hero (pinned plane flyby → A350 title → blueprint) + faux article
- [x] Web Component with Shadow DOM, design tokens, two-panel layout
- [x] Three.js scene, ACES tone mapping, per-act lighting/fog
- [x] **GLB A350 loader** with DRACO + procedural fallback + auto-normalization
- [x] **Primitives Trent XWB-97 engine** (all named parts)
- [x] 9-scene data + camera presets + GSAP transitions
- [x] Animated text reveals + data counters (count-up from 0)
- [x] Combustion ignition sequence (flash, ramp, breathing pulse, camera shake/pull-back)
- [x] Raycaster tooltips (aircraft zones + engine parts)
- [x] Particle systems (intake stream, exhaust plume + ignition puff)
- [x] **Selective bloom** post-processing (EffectComposer + UnrealBloomPass, per-scene strength)
- [x] OrbitControls + wheel-zoom ownership per scene (Lenis-aware)
- [x] **Departure finale** — scripted runway takeoff roll → lift-off → Sky shader + drifting clouds + flight bob/bank
- [x] **Host editorial sections** — sticky chapter scroll (B), animated stat strip (A), pull-quote parallax (C)
- [x] **Favicons + web manifest** (PWA install metadata in `public/favicon/`)
- [x] Idle motion (fan + turbine rotation, engine sway)
- [x] Mobile media queries + reduced-motion handling
- [x] **Mobile responsiveness pass** — ≥44px touch targets on all on-canvas controls,
  flight-strip collapse + hero type scaling (no horizontal overflow), readable body-text
  gutters, `100dvh` hero, tightened editorial-section rhythm, narrow-phone (≤420px) refinements

### 🔲 Remaining before submission
- [ ] Cross-browser pass (Chrome, Safari, Firefox) + on-device check at 375×677
- [ ] Netlify deploy + verify the embedded demo flow

---

## 12. Evaluation Criteria (from brief)

1. **Visual design and creativity** → editorial aesthetic, real GLB airframe + primitives
   engine, cool→hot color narrative, cinematic hero + sky finale
2. **Interactivity and user experience** → 7+ interaction types, smooth choreography
3. **Responsiveness across devices** → fluid desktop + mobile layouts
4. **Code quality, organization, and documentation** → modular `src/`, "why" comments,
   docs + README

---

## 13. Constraints & Decisions

- **No PHP, no Nuxt, no React** — vanilla only, to preserve embeddability.
- **GLB for the aircraft, primitives for the engine** — the original "no GLTF" rule was
  reversed for the airframe (a recognisable A350 sells the story better than a procedural
  body), but kept for the engine so every part stays individually animatable. A procedural
  fallback guarantees the demo survives a missing/blocked GLB.
- **Shadow DOM** — guarantees no host-page collisions.
- **Lenis + ScrollTrigger** — Lenis carries the host-page scroll feel; ScrollTrigger pins
  and scrubs the hero. The *component's* scenes are button/CTA-driven (not scroll-pinned),
  which reads as more deliberate for an embedded asset.
- **GSAP over Anime.js** — cleanest timeline + scroll API.
- **DRACO decoder via CDN** — keeps the repo light; can be vendored into `public/draco/`
  for offline use.
- **Post-processing kept to one restrained pass** — the original spec ruled out
  post-processing entirely; that was relaxed to a *single* selective `UnrealBloomPass`
  (high threshold, low base strength) because it makes the combustion and thrust scenes
  read as genuinely hot without tipping into a glowy/neon look. No other shader passes.
- **Scope discipline:** no sound, no engine comparisons, no further post-processing.

---

## 14. Author Context

Built by **Ahmad Baihaqie Mohd Yusri (Qie)** — UI/UX-focused Software Engineer in Kuala
Lumpur. Primary stack: Vue/Nuxt/Tailwind/TypeScript in fintech. Choosing vanilla + Web
Components here is an intentional architectural decision to match the brief's
embeddability requirement.

Personal brand: axelnova.tech
