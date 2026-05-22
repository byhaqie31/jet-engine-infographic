# Claude Code Kickoff Prompt

Copy and paste the prompt below into Claude Code after opening the project folder.

---

## 📋 PROMPT TO PASTE

```
I'm building an interactive jet engine infographic as a Web Component for a frontend
developer assessment (Morph Digital). The deadline is 27 May 2026.

Please read PROJECT-SPEC.md first — it contains the full design spec, scene-by-scene
breakdown, tech decisions, and a precise task list.

Current status: Day 1 scaffold is complete. The Web Component renders, the Three.js
engine model is built from primitives, lighting is set up, and idle motion works.
Scene dots navigation works (click to swap content).

We are now starting DAY 2. Your job is to implement everything in the "Day 2 — TODO"
section of the spec, in this priority order:

1. GSAP ScrollTrigger choreography for all 5 scenes — pin the canvas, drive camera
   moves and content reveals based on scroll position within the embedded asset
2. Animated text reveals (Fraunces headline fades in + slides up, subline staggers
   in after, data readout fades in last)
3. Animated data counters (numbers count up from 0 when scene becomes active, using
   GSAP)
4. Camera positions per scene (defined in scenes.js — create this file):
   - Scene 1 (Intake):     position(6, 1.5, 6),   lookAt(2, 0, 0)
   - Scene 2 (Compression): position(3, 0.8, 3),   lookAt(0.5, 0, 0)
   - Scene 3 (Combustion):  position(0, 0.5, 3.5), lookAt(-0.4, 0, 0)
   - Scene 4 (Turbine):     position(-3, 0.8, 3),  lookAt(-1.2, 0, 0)
   - Scene 5 (Thrust):      position(7, 2, 7),     lookAt(0, 0, 0)
5. Combustion ignition sequence for Scene 3 — tween combustion material's
   emissiveIntensity from 0 → 1.5 with a slight pulse, and combustionGlow opacity
   from 0 → 0.6
6. Raycaster-based hover tooltips on the engine parts in Scenes 3-5 (fan, compressor,
   combustion, turbine, nozzle)
7. Click-to-ignite button overlay during Scene 3
8. OrbitControls unlock when Scene 5 becomes active
9. Particle systems — blue intake stream (Scene 1), orange exhaust plume (Scene 5)

Important constraints:
- Keep everything inside the Web Component (Shadow DOM) — no leakage to host page
- The asset is a fixed canvas, not page-scroll. Use ScrollTrigger with the component's
  internal scroll container, or implement a wheel/swipe-driven scene progression
  inside the canvas (your call — pick whichever feels more polished for an embedded
  asset)
- Vanilla JS only — no Vue, no React, no Nuxt
- Use the design tokens (colors, fonts, easings) already defined in jet-engine.js
- Keep code modular: split scene choreography into scenes.js, interactions
  (raycaster, ignition, controls) into interactions.js
- Comment the "why" behind non-obvious code
- Test that the engine still renders and is interactive after each major change

When you're done with Day 2, give me:
- A summary of what shipped
- A list of any deviations from the spec and why
- Anything that needs my decision before Day 3 (mobile + deploy)

Let's start. Begin by reading PROJECT-SPEC.md and the existing source files, then
propose a 1-paragraph plan for the order of operations before writing any code.
```

---

## 📁 Files to Drop Into Your Claude Code Workspace

Make sure these are in the project folder before starting:

1. The entire `jet-engine-infographic/` folder (from the zip I gave you)
2. `PROJECT-SPEC.md` (renamed from `jet-engine-infographic-SPEC.md`)

Folder should look like:

```
/jet-engine-infographic
├── PROJECT-SPEC.md          ← rename the spec file to this
├── index.html
├── /src
│   ├── jet-engine.js
│   ├── engine-model.js
│   └── host.css
├── vite.config.js
├── package.json
├── .gitignore
└── README.md
```

---

## 💡 Tips for Working with Claude Code

1. **Open the project folder first** before pasting the prompt — Claude Code needs
   filesystem access to read the spec and existing files.

2. **Run `npm install` yourself first** — Claude Code can do it but it's faster if
   dependencies are already there.

3. **Review each change before accepting** — for a portfolio piece, you want to
   understand every line. Don't just rubber-stamp.

4. **If Claude Code goes off-track**, push back with:
   *"Re-read section X of PROJECT-SPEC.md — that's the source of truth."*

5. **Commit after each Day** — `git commit -m "Day 2: GSAP choreography + interactions"`
   so you can roll back if something breaks.

6. **For Day 3**, start a fresh prompt with this opener:
   *"Day 2 is complete and committed. Please read PROJECT-SPEC.md and implement
   everything in the Day 3 TODO section. Start with mobile responsive tuning."*

---

## 🎯 What to Check After Day 2 Completes

Quick QA pass before moving to Day 3:

- [ ] All 5 scenes transition smoothly (no jumps, no flickers)
- [ ] Text reveals feel cinematic, not snappy
- [ ] Data counters animate from 0 to target value
- [ ] Combustion ignition feels dramatic when triggered
- [ ] Tooltips show on hover over engine parts in Scenes 3–5
- [ ] OrbitControls work in Scene 5 (drag to rotate)
- [ ] Idle fan + turbine motion still works
- [ ] No console errors in browser DevTools
- [ ] Component still renders correctly when embedded in the faux article
