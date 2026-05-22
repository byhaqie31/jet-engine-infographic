/**
 * scenes.js
 * Scene choreography for the jet engine infographic.
 *
 * Responsibilities:
 * - Camera position presets per scene
 * - Particle systems (intake stream + exhaust plume)
 * - Wheel / touch / keyboard navigation inside the canvas
 * - GSAP-driven transitions: camera, text reveals, data counters
 */

import * as THREE from 'three';
import gsap from 'gsap';

// Camera preset for each of the 5 scenes.
// The new model is taller (wing at y≈3.15) so cameras are pulled up and back
// relative to the original generic-engine build.
export const SCENE_CAMERAS = [
  { position: [8,    4.5, 8],   lookAt: [1.5,  1.5, 0] }, // 1 Intake      — wide 3/4 front, shows wing mount
  { position: [4,    1.8, 4],   lookAt: [0.8,  0.2, 0] }, // 2 Compression — dolly into compressor zone
  { position: [0,    0.5, 3.5], lookAt: [-0.3, 0,   0] }, // 3 Combustion  — tight on chamber
  { position: [-3,   0.8, 3],   lookAt: [-1.5, 0.2, 0] }, // 4 Turbine     — pulls back, turbine visible
  { position: [9,    5,   9],   lookAt: [0.5,  1.5, 0] }, // 5 Thrust      — wide reveal, full assembly
];

// ─── PARTICLE SYSTEMS ─────────────────────────────────────────────────────────

function _resetIntake(pos, i) {
  pos[i * 3]     = 4 + Math.random() * 3;          // ahead of the fan opening
  pos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
}

function _resetExhaust(pos, i) {
  pos[i * 3]     = -2.5 - Math.random() * 0.4;     // just behind the nozzle
  pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
  pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
}

/** Blue particle stream drawn into the intake fan (Scene 1). */
export function buildIntakeParticles() {
  const COUNT = 200;
  const pos = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    _resetIntake(pos, i);
    speeds[i] = 0.02 + Math.random() * 0.04;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.userData.speeds = speeds;

  const mat = new THREE.PointsMaterial({
    color: 0x4fc3f7,
    size: 0.045,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
  });

  const pts = new THREE.Points(geo, mat);
  pts.name = 'intakeParticles';
  pts.visible = false;
  return pts;
}

/** Orange exhaust plume emitted from the nozzle (Scene 5). */
export function buildExhaustParticles() {
  const COUNT = 300;
  const pos = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    _resetExhaust(pos, i);
    // Scatter initial positions along the plume so it doesn't all spawn at once
    pos[i * 3] -= Math.random() * 7;
    speeds[i] = 0.04 + Math.random() * 0.06;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.userData.speeds = speeds;

  const mat = new THREE.PointsMaterial({
    color: 0xff6b35,
    size: 0.055,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
  });

  const pts = new THREE.Points(geo, mat);
  pts.name = 'exhaustParticles';
  pts.visible = false;
  return pts;
}

/** Advance particle positions each animation frame. Only runs when visible. */
export function tickParticles(intake, exhaust) {
  if (intake?.visible) _tickIntake(intake);
  if (exhaust?.visible) _tickExhaust(exhaust);
}

function _tickIntake(pts) {
  const pos = pts.geometry.attributes.position.array;
  const speeds = pts.geometry.userData.speeds;
  for (let i = 0; i < speeds.length; i++) {
    pos[i * 3] -= speeds[i];
    if (pos[i * 3] < 1.8) _resetIntake(pos, i); // respawn ahead of fan
  }
  pts.geometry.attributes.position.needsUpdate = true;
}

function _tickExhaust(pts) {
  const pos = pts.geometry.attributes.position.array;
  const speeds = pts.geometry.userData.speeds;
  for (let i = 0; i < speeds.length; i++) {
    pos[i * 3] -= speeds[i];
    if (pos[i * 3] < -10) {
      _resetExhaust(pos, i);
    } else {
      // Natural cone expansion as the plume travels outward
      const dist = Math.abs(pos[i * 3] + 2.5) * 0.003;
      pos[i * 3 + 1] += (Math.random() - 0.5) * dist;
      pos[i * 3 + 2] += (Math.random() - 0.5) * dist;
    }
  }
  pts.geometry.attributes.position.needsUpdate = true;
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

/**
 * Attach wheel, touch, and keyboard handlers to the canvas stage so the user
 * can step through scenes without affecting the host page scroll.
 */
export function initWheelNavigation(component) {
  const stage = component.shadowRoot.querySelector('.stage');
  let cooldown = false;

  function step(dir) {
    if (cooldown) return;
    const next = Math.max(0, Math.min(component.scenes.length - 1, component.currentScene + dir));
    if (next === component.currentScene) return;
    cooldown = true;
    setTimeout(() => { cooldown = false; }, 1200); // match camera move duration
    component.goToScene(next);
  }

  // Wheel — prevent host page scroll while pointer is over the component
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // Touch swipe
  let touchY = 0;
  stage.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const delta = touchY - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) step(delta > 0 ? 1 : -1);
  }, { passive: true });

  // Arrow keys — only when the component is visible in the viewport
  window.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(e.key)) return;
    const rect = component.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    step(e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : -1);
  });
}

// ─── SCENE TRANSITION ─────────────────────────────────────────────────────────

/**
 * Drives the full scene change:
 *   camera tween → particle swap → ignite button → combustion reset →
 *   text fade-out/fade-in → data counter animation
 *
 * Call this BEFORE updating component.currentScene so prevIdx is still readable.
 */
export function transitionScene(component, idx) {
  const sceneData = component.scenes[idx];
  const cam = SCENE_CAMERAS[idx];
  const prevIdx = component.currentScene;
  const isLast = idx === component.scenes.length - 1;

  // ── Camera ──────────────────────────────────────────────────────────────────
  if (!isLast) {
    gsap.to(component.camera.position, {
      x: cam.position[0], y: cam.position[1], z: cam.position[2],
      duration: 1.2, ease: 'power3.inOut',
    });
    // cameraTarget is the THREE.Vector3 that animate() feeds into camera.lookAt()
    gsap.to(component.cameraTarget, {
      x: cam.lookAt[0], y: cam.lookAt[1], z: cam.lookAt[2],
      duration: 1.2, ease: 'power3.inOut',
    });
    component.controls.enabled = false;
  } else {
    // Final scene — move camera then hand control to OrbitControls
    gsap.to(component.camera.position, {
      x: cam.position[0], y: cam.position[1], z: cam.position[2],
      duration: 1.2, ease: 'power3.inOut',
      onComplete() {
        component.controls.target.set(cam.lookAt[0], cam.lookAt[1], cam.lookAt[2]);
        component.controls.enabled = true;
      },
    });
    gsap.to(component.cameraTarget, {
      x: cam.lookAt[0], y: cam.lookAt[1], z: cam.lookAt[2],
      duration: 1.2, ease: 'power3.inOut',
    });
  }

  // ── Particles ────────────────────────────────────────────────────────────────
  if (component.intakeParticles)  component.intakeParticles.visible  = idx === 0;
  if (component.exhaustParticles) component.exhaustParticles.visible = idx === 4;

  // ── Combustion reset when leaving Scene 3 ────────────────────────────────────
  if (prevIdx === 2 && idx !== 2 && component.ignited) {
    component.ignited = false;
    if (component.combustion) {
      gsap.killTweensOf(component.combustion.material);
      gsap.to(component.combustion.material, { emissiveIntensity: 0, duration: 0.5 });
    }
    if (component.combustionGlow) {
      gsap.killTweensOf(component.combustionGlow.material);
      gsap.to(component.combustionGlow.material, { opacity: 0, duration: 0.5 });
    }
  }

  // ── Ignite button visibility ──────────────────────────────────────────────────
  const igniteBtn = component.shadowRoot.querySelector('[data-ignite]');
  if (igniteBtn) {
    if (idx === 2 && !component.ignited) {
      igniteBtn.style.display = 'flex';
      gsap.fromTo(igniteBtn, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 1.0 });
      igniteBtn.style.pointerEvents = 'auto';
    } else {
      igniteBtn.style.pointerEvents = 'none';
      gsap.to(igniteBtn, {
        opacity: 0, duration: 0.2,
        onComplete() { igniteBtn.style.display = 'none'; },
      });
    }
  }

  // ── Text reveals ─────────────────────────────────────────────────────────────
  const root = component.shadowRoot;
  const titleEl   = root.querySelector('[data-headline-title]');
  const sublineEl = root.querySelector('[data-headline-subline]');
  const dataEl    = root.querySelector('[data-data-readout]');
  const labelEl   = root.querySelector('[data-scene-label]');

  // Outgoing
  gsap.to([titleEl, sublineEl], { opacity: 0, y: -10, duration: 0.25, ease: 'power2.in' });
  gsap.to(dataEl, { opacity: 0, duration: 0.2 });

  // Incoming — slight delay so outgoing finishes first
  gsap.delayedCall(0.32, () => {
    labelEl.textContent   = sceneData.label;
    titleEl.textContent   = sceneData.title;
    sublineEl.textContent = sceneData.subline;
    dataEl.innerHTML      = component.renderStats(sceneData.stats);

    gsap.fromTo(titleEl,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );
    gsap.fromTo(sublineEl,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.1, ease: 'power2.out' }
    );
    gsap.fromTo(dataEl,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power2.out' }
    );

    // Data counters — count up from 0 when the scene activates
    sceneData.stats.forEach((stat, i) => {
      if (stat.raw == null) return;
      const valueEl = dataEl.querySelectorAll('.data__value')[i];
      if (!valueEl) return;

      // Reset to 0 without destroying the unit <span>
      const textNode = valueEl.firstChild;
      if (textNode?.nodeType === Node.TEXT_NODE) textNode.textContent = '0';

      const isDecimal = !Number.isInteger(stat.raw);
      const isBig     = stat.raw >= 1000;
      const obj = { val: 0 };

      gsap.to(obj, {
        val: stat.raw,
        duration: 1.5,
        delay: 0.35,
        ease: 'power2.out',
        onUpdate() {
          const node = valueEl.firstChild;
          if (!node || node.nodeType !== Node.TEXT_NODE) return;
          if (isBig)        node.textContent = Math.round(obj.val).toLocaleString();
          else if (isDecimal) node.textContent = obj.val.toFixed(2);
          else               node.textContent = Math.round(obj.val).toString();
        },
      });
    });
  });

  // ── Progress + dots ──────────────────────────────────────────────────────────
  root.querySelector('[data-progress]').style.width =
    `${((idx + 1) / component.scenes.length) * 100}%`;
  root.querySelectorAll('[data-dot]').forEach((d, i) =>
    d.classList.toggle('is-active', i === idx)
  );
}
