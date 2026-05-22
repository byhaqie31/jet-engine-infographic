/**
 * interactions.js
 * Raycaster-based hover tooltips and the click-to-ignite combustion sequence.
 *
 * Responsibilities:
 * - Hover tooltips on named engine parts (active in Scenes 3–5)
 * - Ignition button wiring + GSAP timeline for the combustion sequence
 */

import * as THREE from 'three';
import gsap from 'gsap';

// ─── TOOLTIP DATA ─────────────────────────────────────────────────────────────

// Trent XWB-97 / A350-1000 specifications
const PART_LABELS = {
  fan:        { name: 'Fan Assembly',       detail: 'Ø 3.0 m · 22 blades · 9.3:1 bypass' },
  compressor: { name: 'Compressor',         detail: '14 stages · 50:1 pressure ratio' },
  combustion: { name: 'Combustion Chamber', detail: '1,700°C · 4,200 L/hr fuel flow' },
  turbine:    { name: 'Turbine',            detail: '12,200 RPM HP shaft · 6 stages' },
  nozzle:     { name: 'Fan & Core Nozzle',  detail: 'Separate exhaust · 97,000 lbf' },
};

// Aircraft-level specs shown on hover in Scene 0
const AIRCRAFT_ZONES = [
  { xMax:  -18,  name: 'Tail & APU',         detail: 'H-shaped tail · Honeywell APU · 16.9 m height' },
  { xMax:   -9,  name: 'Wing Box',            detail: 'Span 64.75 m · 35° sweep · CFRP composite' },
  { xMax:    0,  name: 'RR Trent XWB-97',     detail: '97,000 lbf · Ø 3.0 m · 2 engines per aircraft' },
  { xMax: Infinity, name: 'Airbus A350-1000', detail: 'Length 73.79 m · MTOW 316 t · 369 passengers' },
];

// ─── TOOLTIP INIT ─────────────────────────────────────────────────────────────

/**
 * Attaches a mousemove raycaster to the canvas that shows part info in a
 * floating tooltip. Only fires in scenes 2–4 (0-indexed).
 */
export function initTooltips(component) {
  const host    = component.shadowRoot.querySelector('.canvas-host');
  const stage   = component.shadowRoot.querySelector('.stage');
  const tooltip = component.shadowRoot.querySelector('[data-tooltip]');
  if (!tooltip || !host || !component.engine) return;

  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();

  // Build a flat mesh → partName map so intersect checks are O(1) lookup
  const meshToPart = new Map();
  for (const partName of Object.keys(PART_LABELS)) {
    const obj = component.engine.getObjectByName(partName);
    if (!obj) continue;
    if (obj.isMesh) {
      meshToPart.set(obj, partName);
    } else {
      obj.traverse((child) => {
        if (child.isMesh) meshToPart.set(child, partName);
      });
    }
  }
  const meshes = Array.from(meshToPart.keys());

  // Aircraft meshes for Scene 0 hover — collected lazily once the GLB has loaded
  let aircraftMeshes = null;

  function _positionTooltip(e, stageRect) {
    let tx = e.clientX - stageRect.left + 16;
    let ty = e.clientY - stageRect.top  - 8;
    if (tx + 220 > stageRect.width) tx = e.clientX - stageRect.left - 230;
    tooltip.style.left = `${tx}px`;
    tooltip.style.top  = `${ty}px`;
  }

  host.addEventListener('mousemove', (e) => {
    const rect      = host.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, component.camera);

    // ── Scene 0: hover on the full aircraft ─────────────────────────────────
    if (component.currentScene === 0) {
      if (!component.aircraftBody) { tooltip.classList.remove('is-visible'); return; }

      // Lazy-collect meshes once the GLB is ready
      if (!aircraftMeshes) {
        aircraftMeshes = [];
        component.aircraftBody.traverse(c => { if (c.isMesh) aircraftMeshes.push(c); });
      }

      const hits = raycaster.intersectObjects(aircraftMeshes, false);
      if (hits.length > 0) {
        // Determine zone by world-space x of the hit point
        const wx = hits[0].point.x;
        const zone = AIRCRAFT_ZONES.find(z => wx < z.xMax) ?? AIRCRAFT_ZONES.at(-1);
        tooltip.querySelector('[data-tooltip-name]').textContent   = zone.name;
        tooltip.querySelector('[data-tooltip-detail]').textContent = zone.detail;
        _positionTooltip(e, stageRect);
        tooltip.classList.add('is-visible');
      } else {
        tooltip.classList.remove('is-visible');
      }
      return;
    }

    // ── Scenes 3–5: hover on named engine parts ──────────────────────────────
    if (component.currentScene < 3) {
      tooltip.classList.remove('is-visible');
      return;
    }

    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const info = PART_LABELS[meshToPart.get(hits[0].object)];
      if (!info) { tooltip.classList.remove('is-visible'); return; }

      tooltip.querySelector('[data-tooltip-name]').textContent   = info.name;
      tooltip.querySelector('[data-tooltip-detail]').textContent = info.detail;
      _positionTooltip(e, stageRect);
      tooltip.classList.add('is-visible');
    } else {
      tooltip.classList.remove('is-visible');
    }
  });

  host.addEventListener('mouseleave', () => tooltip.classList.remove('is-visible'));
}

// ─── IGNITION ─────────────────────────────────────────────────────────────────

/**
 * Wires the "IGNITE" button to the combustion animation sequence.
 * The button is shown/hidden by transitionScene in scenes.js.
 */
export function initIgnition(component) {
  const btn = component.shadowRoot.querySelector('[data-ignite]');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (component.ignited) return;
    component.ignited = true;
    btn.style.pointerEvents = 'none';

    // Dismiss button with a quick shrink-fade
    gsap.to(btn, {
      opacity: 0, scale: 0.88, duration: 0.18,
      onComplete() { btn.style.display = 'none'; },
    });

    _runIgnitionSequence(component);
  });
}

function _runIgnitionSequence(component) {
  const combMat = component.combustion.material;   // emissiveIntensity target
  const glowMat = component.combustionGlow.material; // opacity target

  const tl = gsap.timeline();

  // 1. Instant flash — fuel ignites
  tl.to(glowMat, { opacity: 0.95, duration: 0.07 })
  // 2. Emissive ramp to full burn
    .to(combMat, { emissiveIntensity: 1.5, duration: 1.0, ease: 'power2.out' }, 0.04)
  // 3. Glow settles to sustained level
    .to(glowMat, { opacity: 0.55, duration: 0.9, ease: 'power2.out' }, 0.08)
  // 4. Breathing pulse — the engine breathes as it sustains combustion
    .add(() => {
      gsap.to(combMat, {
        emissiveIntensity: 1.1,
        duration: 0.95,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });
}
