# Anatomy of Thrust — Interactive Jet Engine Infographic

A cinematic, interactive infographic exploring how a modern turbofan engine
converts air into 84,000 pounds of thrust. Built as an embeddable Web Component.

> **Live demo:** _(to be added on Day 3)_
> **Built for:** Morph Digital · Front-End Developer Assessment · May 2026

---

## Concept

An editorial-style scrollable narrative across five scenes:

1. **Intake** — air flows in
2. **Compression** — pressure climbs 40×
3. **Combustion** — fuel ignites at 1,500°C
4. **Turbine** — turbines spin at 10,000 RPM
5. **Thrust** — engine produces 84,000 lbf of thrust

The interactive asset is rendered as a custom HTML element
(`<jet-engine-infographic>`) so it can be dropped into any host page
regardless of framework — Nuxt, WordPress, plain HTML, etc.

---

## Tech Stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Markup | HTML5 + Custom Element | Framework-agnostic, embeddable anywhere |
| Styling | Vanilla CSS (Shadow DOM scoped) | Zero leakage into host page |
| 3D | Three.js (built from primitives) | Full control over individual parts for animation |
| Animation | GSAP + ScrollTrigger | Industry standard for cinematic scroll choreography |
| Build | Vite | Fast HMR for development, optimised static output for Netlify |

The component is encapsulated in **Shadow DOM** to prevent style or script
collisions with the host page.

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
├── index.html              ← Demo host page (faux editorial article)
├── /src
│   ├── jet-engine.js       ← <jet-engine-infographic> Web Component
│   ├── engine-model.js     ← Three.js turbofan model
│   └── host.css            ← Host page styles
├── vite.config.js
├── package.json
└── README.md
```

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

- [x] Stylized turbofan model built from Three.js primitives
- [x] Cinematic three-point lighting (key, rim, fill)
- [x] Idle motion (continuous fan + turbine rotation, subtle engine sway)
- [x] Scene navigation with progress indicator
- [x] Responsive layout (desktop 1440×900, mobile 375×677)
- [x] Encapsulated in Shadow DOM
- [ ] GSAP ScrollTrigger scene choreography _(Day 2)_
- [ ] Hover tooltips on engine parts _(Day 2)_
- [ ] Click-to-ignite interaction _(Day 2)_
- [ ] Drag-to-rotate exploration mode _(Day 2)_
- [ ] Animated data counters _(Day 2)_

---

## Author

Built by **Ahmad Baihaqie Mohd Yusri (Qie)** — UI/UX-focused Software Engineer
based in Kuala Lumpur.

axelnova.tech
