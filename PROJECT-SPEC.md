# PROJECT SPEC — Anatomy of Thrust

> **For:** Claude Code
> **Project:** Interactive Jet Engine Infographic
> **Client context:** Morph Digital · Front-End Developer Assessment
> **Submission deadline:** 27 May 2026, 12:00pm
> **Target completion:** 3 days from start

---

## 1. Project Overview

Design and develop a cinematic, interactive infographic that tells the story of how a modern turbofan jet engine converts air into thrust. The deliverable is a **standalone embeddable Web Component** that occupies a section of a host webpage — not a multi-page site.

The infographic walks the viewer through **5 scenes**:
1. **Intake** — air flows in
2. **Compression** — pressure climbs 40×
3. **Combustion** — fuel ignites at 1,500°C
4. **Turbine** — turbines spin at 10,000 RPM
5. **Thrust** — engine produces 84,000 lbf of thrust

Aesthetic direction: **editorial × cinematic × premium engineering documentary**. Think Apple product page × Dassault Systèmes industrial storytelling × aviation magazine spread.

---

## 2. Hard Requirements (from the brief)

| # | Requirement | Notes |
|---|---|---|
| 1 | Canvas size — Desktop: 1440×900px, Mobile: 375×677px | Fixed dimensions for the asset itself |
| 2 | Built with HTML, CSS, JavaScript | No frameworks like Nuxt/React/Vue |
| 3 | Animation libraries allowed (GSAP, Anime.js, ScrollReveal) | We use GSAP + ScrollTrigger |
| 4 | Web Component implementation | Encouraged in brief — use Custom Element + Shadow DOM |
| 5 | Minimum 3 types of interactive elements | We deliver 5+ |
| 6 | Responsive design — desktop + mobile | Mobile variant required |
| 7 | Smooth scrolling/transitions between sections | GSAP ScrollTrigger drives this |
| 8 | Maintainable, well-documented code | Comments on logic, clean structure |
| 9 | Git repository (GitHub or GitLab) | Public repo |
| 10 | README with run instructions, features, limitations | Already scaffolded |
| 11 | Hosted demo on Netlify | Deploy on Day 3 |
| 12 | **Bonus:** Three.js integration | Core to our approach — stylized engine model |

---

## 3. Tech Stack

```
HTML5 + Vanilla JS (ES Modules)
├── Web Components (Custom Elements + Shadow DOM)
├── Three.js          → 3D engine model
├── GSAP + ScrollTrigger → animation choreography
└── Vite              → dev server + build
```

**Why this stack:**
- Vanilla = framework-agnostic embeddability (the whole point of a Web Component)
- Vite = fast HMR + tiny optimized build
- No PHP/Nuxt/React — those would defeat the embeddable goal

---

## 4. Project Structure

```
/jet-engine-infographic
├── index.html              ← Demo host page (faux editorial article)
├── /src
│   ├── jet-engine.js       ← <jet-engine-infographic> Web Component
│   ├── engine-model.js     ← Three.js turbofan model (built from primitives)
│   ├── scenes.js           ← (Day 2) GSAP scene choreography module
│   ├── interactions.js     ← (Day 2) Raycaster tooltips + ignition logic
│   └── host.css            ← Host page styles only
├── vite.config.js
├── package.json
├── .gitignore
└── README.md
```

---

## 5. Design System

### Color Palette
| Role | Color | Hex | Usage |
|---|---|---|---|
| Background | Near-black | `#0A0B0F` | Main canvas |
| Surface | Deep charcoal | `#13151C` | Cards, tooltips |
| Cool accent | Electric blue | `#4FC3F7` | Intake, fan, scenes 1–2 |
| Hot accent | Combustion orange | `#FF6B35` | Combustion, exhaust, scenes 3–5 |
| Ink | Warm white | `#F5F5F0` | Headlines, key data |
| Muted | Soft gray | `#8B8D98` | Body, captions |
| Hairline | `rgba(255,255,255,0.08)` | Borders, dividers |

**Color narrative:** Scenes shift from cool blue (air) → neutral (compression) → orange (combustion) → warm amber (turbine + thrust). The palette tells the story.

### Typography
- **Display:** Fraunces (Light/Regular, optical size 144) — characterful serif, editorial
- **Body/UI:** Geist Sans — distinctive modern sans
- **Data/Mono:** JetBrains Mono — for stats, labels, technical readouts

**Type scale:**
- Hero display: `clamp(48px, 6vw, 96px)` — Fraunces Light, tracking -0.02em
- Scene title: `clamp(32px, 4.5vw, 56px)` — Fraunces Regular
- Body: 16px — Geist Regular, line-height 1.6
- Caption/label: 11px — JetBrains Mono, uppercase, tracking 0.2em
- Data readout: 18px — JetBrains Mono Medium

### Motion Principles
- Easings: `power2.out` for entrances, `power3.inOut` for camera moves
- No bouncy/elastic — too playful for this tone
- Durations: headlines 0.8s, camera moves 1.2s, counters 1.5s
- Stagger reveals by 0.1s per element
- Idle state: fan blades always rotate, particles always drift — never fully static

---

## 6. Scene-by-Scene Spec

### Scene 1 — Intake
- **Camera:** Wide shot, 3/4 front, slight low angle
- **Headline:** *"It begins with air."*
- **Subline:** *Every second, the fan pulls in 1.2 tonnes of it.*
- **Stats:** `AIR FLOW: 1,200 kg/s` · `FAN DIAMETER: 3.05 m`
- **Animation:** Blue particle stream flowing into fan from the left
- **Color temp:** Cool blue dominant

### Scene 2 — Compression
- **Camera:** Slow dolly into engine, past the fan blades
- **Headline:** *"Squeezed forty times tighter."*
- **Subline:** *Fourteen stages of blades compress the airflow to extreme density.*
- **Stats:** `PRESSURE RATIO: 40:1` · `STAGES: 14`
- **Animation:** Pressure gradient builds, compressor stages glow sequentially
- **Color temp:** Blue fading to neutral

### Scene 3 — Combustion ⚡ (Click to ignite)
- **Camera:** Tight on combustion chamber, slight orbit
- **Headline:** *"Then, ignition."*
- **Subline:** *Fuel meets compressed air at 1,500°C — hotter than molten lava.*
- **Stats:** `TEMPERATURE: 1,500°C` · `FUEL: 4,000 L/hr`
- **Animation:** Click-to-ignite triggers fuel inject → spark → glow → sustained burn. Combustion chamber emissiveIntensity ramps 0→1.5
- **Color temp:** Orange takeover

### Scene 4 — Turbine
- **Camera:** Pulls back slightly, turbine visible spinning
- **Headline:** *"The fire spins the wheel."*
- **Subline:** *Expanding gases drive turbines at 10,000 RPM, powering the fan that started it all.*
- **Stats:** `RPM: 10,000` · `EFFICIENCY: 40%`
- **Animation:** Turbine speed visibly accelerates, energy flow lines connect turbine → fan
- **Color temp:** Warm orange + amber

### Scene 5 — Thrust (Free explore mode)
- **Camera:** Free-rotate unlocked (OrbitControls enabled)
- **Headline:** *"And the world moves."*
- **Subline:** *84,000 pounds of thrust — enough to lift 38 cars off the ground.*
- **Stats:** `THRUST: 84,000 lbf` · `LIFTS: 38 cars`
- **Animation:** Exhaust particle stream from nozzle, full engine slowly rotating
- **Interactive:** Drag to rotate + hover tooltips on every named part (fan, compressor, combustion, turbine, nozzle)
- **Color temp:** Cinematic orange with ambient blue rim light

---

## 7. Interactive Elements (5 total — exceeds minimum of 3)

| # | Element | Where | Implementation |
|---|---|---|---|
| 1 | Scroll-triggered scene transitions | All 5 scenes | GSAP ScrollTrigger pins canvas, drives camera + content |
| 2 | Hover tooltips with raycasting | Scenes 3–5 | Three.js Raycaster detects part under cursor → tooltip with specs |
| 3 | Click-to-ignite | Scene 3 | Button triggers combustion animation sequence (fuel → spark → glow → sustained) |
| 4 | Drag-to-rotate | Scene 5 | OrbitControls enabled only on final scene |
| 5 | Animated data counters | Every scene | Numbers count up when scene activates (GSAP) |

---

## 8. Three.js Engine Model

**Approach:** Build from primitives (cylinders, boxes, tori, cones) — NOT a GLTF download.

**Why:**
- Full control over individual parts for animation (fan, turbine, combustion all separately animatable)
- Tiny file size, fast load
- Stylized aesthetic matches 3DS visual language better than photorealism
- Shows actual Three.js skill, not just file-loading

**Composition (already scaffolded):**
- `shell` — outer nacelle (cylinder)
- `fan` — group of 20 blades on a hub
- `compressor` — 4 stages of decreasing-diameter blade rings
- `combustion` — emissive cylinder + transparent glow shell
- `turbine` — 2 stages of blade rings (rotates opposite direction)
- `nozzle` — flared exhaust cylinder + inner cone
- `pylon` — subtle mount point at top

**Lighting:** Cinematic three-point setup
- Key light: white, top-right, intensity 1.2
- Rim light: electric blue (`#4FC3F7`), back-left, intensity 0.8
- Fill light: combustion orange (`#FF6B35`), bottom-front, intensity 0.3
- Ambient: cool blue-gray, intensity 0.6

---

## 9. Web Component API

```html
<jet-engine-infographic></jet-engine-infographic>
```

**Future attributes (optional):**
- `theme="dark"` (default) | `"light"`
- `auto-play="true"` — start animation on viewport entry

**Encapsulation:** Full Shadow DOM. No style/script leakage into host page.

**Embeddability test:** The component should work when dropped into:
- A vanilla HTML page
- A Nuxt page (`client-only` wrapper)
- A WordPress block
- A plain CodePen

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Desktop (≥1024px) | Full 1440×900 canvas, all features active |
| Tablet (768–1023px) | Scale canvas to fit, maintain aspect ratio |
| Mobile (<768px) | 375×677 canvas. Reduce particle count 50%. Disable drag-rotate, replace with tap-to-cycle preset views. Stack data readouts. Hide secondary stats. |

---

## 11. Current Build Status

### ✅ Day 1 — Complete (scaffolded)
- [x] Project structure + Vite config
- [x] Faux editorial host page (`index.html`)
- [x] Web Component shell with Shadow DOM
- [x] Three.js scene setup (camera, renderer, lighting)
- [x] Stylized engine model from primitives
- [x] Scene data structure for all 5 scenes
- [x] Idle motion (fan + turbine rotating continuously)
- [x] Scene dots navigation (click to jump)
- [x] Loading state, progress bar, top label
- [x] Initial README

### 🔨 Day 2 — TODO
- [ ] GSAP ScrollTrigger choreography for all 5 scenes
- [ ] Camera animation between scene positions
- [ ] Animated text reveals (stagger, fade in/up)
- [ ] Animated data counters (numbers count up)
- [ ] Combustion ignition sequence (Scene 3)
- [ ] Raycaster-based hover tooltips
- [ ] Click-to-ignite button + interaction
- [ ] OrbitControls unlock on Scene 5
- [ ] Particle systems (intake airflow + exhaust)

### 🎨 Day 3 — TODO
- [ ] Mobile responsive tuning
- [ ] Touch interaction handlers
- [ ] Performance optimization (particle count, pixel ratio)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] README finalization with feature list + limitations
- [ ] Final polish (easings, timing, color tweaks)
- [ ] Netlify deployment
- [ ] Test embedded demo flow

---

## 12. Evaluation Criteria (from brief)

The reviewer will assess:
1. **Visual design and creativity** → editorial aesthetic + 3D model + color narrative
2. **Interactivity and user experience** → 5 interaction types, smooth choreography
3. **Responsiveness across devices** → desktop + mobile variants
4. **Code quality, organization, and documentation** → modular files, comments, README

---

## 13. Constraints & Decisions

- **No PHP, no Nuxt, no React** — vanilla only, to preserve embeddability
- **Three.js model built from primitives** — not GLTF, for control + performance
- **Shadow DOM** — to guarantee no host-page collisions
- **Vite** — for dev speed, not because we need bundling sophistication
- **GSAP over Anime.js** — ScrollTrigger is the cleanest scroll-driven animation API available
- **Scope discipline:** No sound effects, no multiple engine comparisons, no post-processing shaders. These are rabbit holes for a 3-day sprint.

---

## 14. Author Context

Built by **Ahmad Baihaqie Mohd Yusri (Qie)** — UI/UX-focused Software Engineer in Kuala Lumpur. Primary stack: Vue/Nuxt/Tailwind/TypeScript in fintech. Choosing vanilla + Web Components here is an intentional architectural decision to match the brief's embeddability requirement.

Personal brand: axelnova.tech
