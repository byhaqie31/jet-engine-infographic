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
    btn.classList.remove('is-hinting');

    // Dismiss button + hint with a quick shrink-fade
    gsap.to(btn, {
      opacity: 0, scale: 0.88, duration: 0.18,
      onComplete() { btn.style.display = 'none'; },
    });
    const hint = component.shadowRoot.querySelector('[data-ignite-hint]');
    if (hint) hint.style.display = 'none';

    _runIgnitionSequence(component);
  });
}

function _runIgnitionSequence(component) {
  const combMat = component.combustion.material;     // emissiveIntensity target
  const glow    = component.combustionGlow;          // mesh — scale "pops" on flash
  const glowMat = glow.material;                     // opacity target
  const base    = glow.scale.clone();                // resting scale (1,1,1)

  const tl = gsap.timeline();

  // 1. Instant flash — fuel catches: glow snaps bright and balloons outward
  tl.to(glowMat, { opacity: 1.0, duration: 0.06 }, 0)
    .fromTo(glow.scale,
      { x: base.x, y: base.y, z: base.z },
      { x: base.x * 1.9, y: base.y * 1.9, z: base.z * 1.9, duration: 0.16, ease: 'power3.out' }, 0)
  // 2. Emissive ramp to a hotter full burn
    .to(combMat, { emissiveIntensity: 2.8, duration: 0.9, ease: 'power2.out' }, 0.05)
  // 3. Glow + scale settle to a sustained burn
    .to(glow.scale, { x: base.x, y: base.y, z: base.z, duration: 0.7, ease: 'power2.out' }, 0.18)
    .to(glowMat, { opacity: 0.7, duration: 0.8, ease: 'power2.out' }, 0.18)
  // 4. Breathing pulse — the engine breathes as it sustains combustion
    .add(() => {
      gsap.to(combMat, {
        emissiveIntensity: 2.0,
        duration: 0.95,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });

  // Bloom blooms with the fire: spike on the flash, then settle into the sustained
  // burn so the hot chamber physically glows past its edges.
  if (component.bloomPass) {
    gsap.killTweensOf(component.bloomPass);
    gsap.timeline()
      .to(component.bloomPass, { strength: 1.25, duration: 0.18, ease: 'power3.out' }, 0)
      .to(component.bloomPass, { strength: 0.85, duration: 0.9,  ease: 'power2.out' }, 0.18);
  }

  _cameraReveal(component); // jolt, then pull back so the burn is readable
  _exhaustPuff(component);  // one-time blast out the back
}

/** Ignition camera move: a short impact shake, then a smooth pull-back so the
 *  whole chamber glow (and exhaust) is readable instead of filling the frame. */
function _cameraReveal(component) {
  const cam    = component.camera;
  const target = component.cameraTarget;       // point the camera keeps facing
  const base   = cam.position.clone();

  // Wider framing: dolly outward along the current view direction, lifted a touch.
  // Pull back a fixed *amount* (not a ratio) so the reveal reads the same whether
  // the camera starts close (desktop close-up, ~3u) or far (mobile full-engine
  // framing, ~15u) — a 1.7× ratio would over-shrink the already-wide mobile shot.
  const dir    = base.clone().sub(target).normalize();
  const dist   = base.distanceTo(target);
  const pulled = target.clone().add(dir.multiplyScalar(dist + 2));
  pulled.y += 0.5;

  const shake = { p: 1 };
  gsap.timeline()
    // 1. Impact jolt around the close framing. Amplitude scales with distance so
    //    the jolt stays visible at the farther mobile framing (a fixed offset
    //    would vanish that far out; ~0.03·dist matches the old 0.09 at dist 3).
    .to(shake, {
      p: 0, duration: 0.4, ease: 'power2.out',
      onUpdate() {
        const amt = shake.p * dist * 0.03;
        cam.position.set(
          base.x + (Math.random() - 0.5) * amt,
          base.y + (Math.random() - 0.5) * amt,
          base.z + (Math.random() - 0.5) * amt,
        );
      },
      onComplete() { cam.position.copy(base); },
    })
    // 2. Pull back to reveal the sustained burn
    .to(cam.position, {
      x: pulled.x, y: pulled.y, z: pulled.z,
      duration: 1.4, ease: 'power2.inOut',
    });
}

/** A single burst of exhaust out the nozzle when the chamber ignites. */
function _exhaustPuff(component) {
  const ex = component.exhaustParticles;
  if (!ex) return;

  ex.visible = true;
  ex.material.opacity = 0;
  gsap.killTweensOf(ex.material);
  gsap.to(ex.material, {
    opacity: 0.7, duration: 0.18, ease: 'power2.out',
    onComplete() {
      gsap.to(ex.material, {
        opacity: 0, duration: 1.1, delay: 0.25, ease: 'power2.in',
        onComplete() {
          // Only hide if we're still on Combustion; otherwise let scene 7 own it
          if (component.currentScene === 5) ex.visible = false;
          ex.material.opacity = 0.65; // restore default for the Thrust scene
        },
      });
    },
  });
}
