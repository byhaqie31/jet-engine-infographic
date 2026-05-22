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
  { position: [12,  7,  36],  lookAt: [-7.7, 3,   -1.2], duration: 2.0 }, // 0 Intro       — full aircraft orbit
  { position: [13,  3,   4],   lookAt: [0,    1.0,  0],   duration: 2.5 }, // 1 Side angle  — approach from front, engine intake in frame
  { position: [9,   0,   2],   lookAt: [0,    0,    0],   duration: 1.8 }, // 2 Exterior    — camera at nacelle centreline, engine dead-centre
  { position: [7,   0,   3.5], lookAt: [1.5,  0,    0],   duration: 1.8 }, // 3 Intake      — camera at centreline, looking into intake face
  { position: [3,   0,   3.5], lookAt: [0.5,  0,    0],   duration: 1.2 }, // 4 Compression — centreline, compressor centred
  { position: [0,   0,   3],   lookAt: [-0.3, 0,    0],   duration: 1.2 }, // 5 Combustion  — centreline, combustion chamber centred
  { position: [-2,  0,   3],   lookAt: [-1.5, 0,    0],   duration: 1.2 }, // 6 Turbine     — centreline, turbine centred
  { position: [6,   0.5, 8],   lookAt: [0,    0,    0],   duration: 1.2 }, // 7 Thrust      — slight elevation for wide reveal, engine centred
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
    const ms = (SCENE_CAMERAS[next].duration ?? 1.2) * 1000 + 200;
    setTimeout(() => { cooldown = false; }, ms);
    component.goToScene(next);
  }

  // Wheel — prevent host page scroll while pointer is over the component.
  // Scene 0 is orbit mode; OrbitControls owns the wheel event there.
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (component.currentScene === 0) return;
    step(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // Touch swipe — also deferred to OrbitControls in Scene 0
  let touchY = 0;
  stage.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (component.currentScene === 0) return;
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

// ─── AIRCRAFT POSE ──────────────────────────────────────────────────────────

/**
 * Tween the aircraft body between its two poses:
 *   'base'    — full-aircraft view (Scenes 0–1)
 *   'aligned' — nacelle dropped onto the procedural engine at origin (Scene 2 x-ray)
 * Snaps instantly when dur is 0 (e.g. when the body is hidden and about to reappear).
 */
function setAircraftPose(component, mode, dur) {
  const body = component.aircraftBody;
  const base = component._aircraftBase;
  const aligned = component._aircraftAligned;
  if (!body || !base || !aligned) return;

  const t = mode === 'aligned' ? aligned : base;
  if (dur > 0) {
    gsap.to(body.position, { x: t.pos.x, y: t.pos.y, z: t.pos.z, duration: dur, ease: 'power3.inOut' });
    gsap.to(body.scale,    { x: t.scale.x, y: t.scale.y, z: t.scale.z, duration: dur, ease: 'power3.inOut' });
  } else {
    body.position.copy(t.pos);
    body.scale.copy(t.scale);
  }
}

/**
 * Fade the procedural engine in (opacity 0→1). Used in Scene 2 so the engine is
 * revealed *after* the aircraft has slid into place — reads as travelling into the
 * nacelle. Skips the combustion glow, which manages its own opacity.
 */
function revealEngine(component, dur) {
  const engine = component.engine;
  engine.visible = true;

  const mats = new Set();
  engine.traverse(o => {
    if (!o.isMesh || o.name === 'combustionGlow') return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m && mats.add(m));
  });
  mats.forEach(m => { m.userData._op = m.opacity; m.transparent = true; m.opacity = 0; });

  const obj = { t: 0 };
  gsap.to(obj, {
    t: 1, duration: dur, ease: 'power2.out',
    onUpdate() { mats.forEach(m => { m.opacity = (m.userData._op ?? 1) * obj.t; }); },
    onComplete() { mats.forEach(m => { m.opacity = m.userData._op ?? 1; m.transparent = false; }); },
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
  const dur = cam.duration ?? 1.2;
  const isLast = idx === component.scenes.length - 1; // Scene 6 (Thrust)

  // ── Camera ──────────────────────────────────────────────────────────────────
  if (idx === 0) {
    // Return to aircraft intro — tween camera, then restore aircraft orbit
    component.controls.enabled = false;
    gsap.to(component.camera.position, {
      x: cam.position[0], y: cam.position[1], z: cam.position[2],
      duration: dur, ease: 'power3.inOut',
      onComplete() {
        component.controls.target.set(-7.7, 3, -1.2);
        component.controls.minDistance = 18;
        component.controls.maxDistance = 65;
        component.controls.enabled = true;
      },
    });
    gsap.to(component.cameraTarget, {
      x: cam.lookAt[0], y: cam.lookAt[1], z: cam.lookAt[2],
      duration: dur, ease: 'power3.inOut',
    });
  } else if (!isLast) {
    gsap.to(component.camera.position, {
      x: cam.position[0], y: cam.position[1], z: cam.position[2],
      duration: dur, ease: 'power3.inOut',
    });
    // cameraTarget is the THREE.Vector3 that animate() feeds into camera.lookAt()
    gsap.to(component.cameraTarget, {
      x: cam.lookAt[0], y: cam.lookAt[1], z: cam.lookAt[2],
      duration: dur, ease: 'power3.inOut',
    });
    component.controls.enabled = false;
  } else {
    // Final scene — move camera then hand control to OrbitControls for engine inspection
    gsap.to(component.camera.position, {
      x: cam.position[0], y: cam.position[1], z: cam.position[2],
      duration: dur, ease: 'power3.inOut',
      onComplete() {
        component.controls.target.set(cam.lookAt[0], cam.lookAt[1], cam.lookAt[2]);
        component.controls.minDistance = 4;
        component.controls.maxDistance = 12;
        component.controls.enabled = true;
      },
    });
    gsap.to(component.cameraTarget, {
      x: cam.lookAt[0], y: cam.lookAt[1], z: cam.lookAt[2],
      duration: dur, ease: 'power3.inOut',
    });
  }

  // ── Aircraft / engine visibility ──────────────────────────────────────────────
  // Scene 0: full aircraft orbit, engine hidden, sky
  // Scene 1: side-angle nacelle shot, aircraft full opacity, engine hidden, sky
  // Scene 2: ghost aircraft (0.25), procedural engine fades in, sky→dark
  // Scene 3+: aircraft hidden, dark background
  if (component.aircraftBody) {
    if (idx === 0) {
      // Return to intro — restore full aircraft, sky, bright lighting
      component.engine.visible = false;
      component.aircraftBody.visible = true;
      setAircraftPose(component, 'base', prevIdx === 2 ? dur : 0);
      component.aircraftBody.traverse(child => {
        if (child.material) child.material.opacity = 1.0;
      });
      component.threeScene.background = new THREE.Color(0xB8CDD8);
      component.threeScene.fog.color.set(0xB8CDD8);
      component.threeScene.fog.near = 52;
      component.threeScene.fog.far  = 140;
      if (component._ambientLight) component._ambientLight.intensity = 1.2;
      if (component._keyLight)     component._keyLight.intensity     = 1.8;

    } else if (idx === 1) {
      // Side-angle engine approach — aircraft stays full, engine hidden, sky maintained
      component.engine.visible = false;
      component.aircraftBody.visible = true;
      setAircraftPose(component, 'base', prevIdx === 2 ? dur : 0);

      if (prevIdx >= 2) {
        // Returning from engine anatomy — restore aircraft and sky
        component.aircraftBody.traverse(child => {
          if (child.material) child.material.opacity = 1.0;
        });
        component.threeScene.background = new THREE.Color(0xB8CDD8);
        component.threeScene.fog.color.set(0xB8CDD8);
        component.threeScene.fog.near = 52;
        component.threeScene.fog.far  = 140;
        if (component._ambientLight) component._ambientLight.intensity = 1.2;
        if (component._keyLight)     component._keyLight.intensity     = 1.8;
      }
      // If coming from Scene 0, aircraft is already at full opacity — nothing to do

    } else if (idx === 2) {
      // Engine exterior — ghost aircraft, reveal procedural engine, begin darkening
      component.aircraftBody.visible = true;
      // Drop the nacelle onto the procedural engine: tween in from the full-aircraft
      // view, snap when arriving from a hidden state (Scene 3+).
      setAircraftPose(component, 'aligned', prevIdx <= 1 ? dur : 0);

      if (prevIdx <= 1) {
        // Move the aircraft into place first, THEN reveal the engine inside it.
        component.engine.visible = false;
        gsap.delayedCall(dur * 0.55, () => revealEngine(component, 0.7));
        // Coming from aircraft scenes: fade sky and ghost aircraft
        gsap.to(component.threeScene.fog, { near: 28, far: 85, duration: dur * 0.8 });
        if (component._ambientLight) gsap.to(component._ambientLight, { intensity: 0.8, duration: dur });
        if (component._keyLight)     gsap.to(component._keyLight,     { intensity: 1.4, duration: dur });
        const obj = { t: 1 };
        gsap.to(obj, {
          t: 0.25, duration: dur * 0.7, ease: 'power2.inOut',
          onUpdate() {
            component.aircraftBody.traverse(child => {
              if (child.material) child.material.opacity = obj.t;
            });
          },
        });
      } else {
        component.engine.visible = true;
        // Returning from Scene 3+ — restore the sky (Scene 3 had switched it to dark)
        component.aircraftBody.traverse(child => {
          if (child.material) child.material.opacity = 0.25;
        });
        component.threeScene.background = new THREE.Color(0xB8CDD8);
        component.threeScene.fog.color.set(0xB8CDD8);
        component.threeScene.fog.near = 28;
        component.threeScene.fog.far  = 85;
        if (component._ambientLight) component._ambientLight.intensity = 0.8;
        if (component._keyLight)     component._keyLight.intensity     = 1.4;
      }

    } else if (prevIdx <= 2) {
      // Entering Scene 3+ from any aircraft/exterior scene — hide aircraft, go dark
      component.engine.visible = true;
      component.threeScene.background = null;
      component.threeScene.fog.color.set(0x0a0b0f);
      component.threeScene.fog.near = 18;
      component.threeScene.fog.far  = 55;
      if (component._ambientLight) component._ambientLight.intensity = 0.6;
      if (component._keyLight)     component._keyLight.intensity     = 1.2;

      if (prevIdx === 2) {
        // Fade out ghost aircraft
        const obj = { t: 0.25 };
        gsap.to(obj, {
          t: 0, duration: 0.6, ease: 'power2.in',
          onUpdate() {
            component.aircraftBody.traverse(child => {
              if (child.material) child.material.opacity = obj.t;
            });
          },
          onComplete() { component.aircraftBody.visible = false; },
        });
      } else {
        component.aircraftBody.visible = false;
      }
    }
  }

  // ── Particles ────────────────────────────────────────────────────────────────
  if (component.intakeParticles)  component.intakeParticles.visible  = idx === 3;
  if (component.exhaustParticles) component.exhaustParticles.visible = idx === 7;

  // ── Combustion reset when leaving Scene 5 ────────────────────────────────────
  if (prevIdx === 5 && idx !== 5 && component.ignited) {
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
    if (idx === 5 && !component.ignited) {
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

  // ── CTA button (visible in Scenes 0 and 1) ───────────────────────────────────
  const exploreBtn = component.shadowRoot.querySelector('[data-explore]');
  if (idx === 0) {
    if (exploreBtn) {
      exploreBtn.innerHTML = '&#x2192;&nbsp;&nbsp;VIEW ENGINE';
      exploreBtn.style.display = 'flex';
      gsap.to(exploreBtn, { opacity: 1, duration: 0.6, delay: 0.8 });
      setTimeout(() => exploreBtn?.classList.add('is-pulsing'), 1400);
    }
  } else if (idx === 1) {
    if (exploreBtn) {
      exploreBtn.innerHTML = '&#x2193;&nbsp;&nbsp;EXPLORE ENGINE';
      exploreBtn.style.display = 'flex';
      gsap.to(exploreBtn, { opacity: 1, duration: 0.6, delay: 0.6 });
      setTimeout(() => exploreBtn?.classList.add('is-pulsing'), 1200);
    }
  } else if (prevIdx <= 1) {
    if (exploreBtn) {
      exploreBtn.classList.remove('is-pulsing');
      gsap.to(exploreBtn, {
        opacity: 0, duration: 0.3,
        onComplete() { exploreBtn.style.display = 'none'; },
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
