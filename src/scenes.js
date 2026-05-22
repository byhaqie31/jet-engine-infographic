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
  { position: [16,  4.5, 30],  lookAt: [-6,   2.4, -1.2], duration: 2.6 }, // 8 Departure   — hero sky shot, auto-orbits the flying aircraft
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

// ─── FINALE: TAKEOFF + CRUISE ─────────────────────────────────────────────────

// Aircraft visual centre at the base pose (matches the finale orbit lookAt). The
// takeoff camera + orbit work in deltas from this known-good point.
const _TAKEOFF_CENTER = new THREE.Vector3(-6, 2.4, -1.2);
const _pitchAxis = new THREE.Vector3(1, 0, 0);
const _pitchQuat = new THREE.Quaternion();

// Chase-cam scratch + framing offsets (camera position relative to the jet centre).
const _center  = new THREE.Vector3();
const _camOff  = new THREE.Vector3();
const _lowCam  = new THREE.Vector3(22, -1.5, 31);   // low — shows the runway during the roll
const _heroCam = new THREE.Vector3(22,  2.1, 31.2); // hero framing once climbed (matches finale orbit radius)

/**
 * Pitch the aircraft nose up/down without disturbing its baked yaw. After the
 * nose→+X rotation the group's local +X is the wing (lateral) axis, so rotating
 * about it pitches the nose. Negative angle = nose up — flip the sign here if it
 * ever reads inverted on a re-exported model.
 */
function setAircraftPitch(component, noseUpRad) {
  const body  = component.aircraftBody;
  const level = component._aircraftLevelQuat;
  if (!body || !level) return;
  _pitchQuat.setFromAxisAngle(_pitchAxis, -noseUpRad);
  body.quaternion.copy(level).multiply(_pitchQuat);
}

/** Gentle cruise loop — the aircraft bobs and banks while the clouds stream past. */
function startCruiseBob(component) {
  const body = component.aircraftBody;
  const baseY = body.position.y;
  if (component._flyTween) component._flyTween.kill();
  component._flyTween = gsap.timeline({ repeat: -1, yoyo: true })
    .fromTo(body.position, { y: baseY - 0.3 }, { y: baseY + 0.5, duration: 3.6, ease: 'sine.inOut' }, 0)
    .fromTo(body.rotation, { z: -0.03 },       { z: 0.05,        duration: 4.2, ease: 'sine.inOut' }, 0);
}

/** Set the runway's overall opacity (it's a group of several meshes/materials),
 *  so it can cross-fade out as the aircraft climbs away rather than popping. */
function setRunwayOpacity(component, o) {
  const runway = component.runway;
  if (!runway) return;
  runway.traverse((node) => {
    if (!node.material) return;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    mats.forEach((mat) => { mat.transparent = true; mat.opacity = o; });
  });
}

/**
 * Scene 8 — the aircraft rolls down the runway, rotates nose-up, lifts off and
 * climbs into the sky, then settles into the gentle cruise orbit. The camera and
 * orbit target pan with the jet (deltas from _TAKEOFF_CENTER) so it stays framed.
 * DX / LIFT / BACK are the obvious tuning knobs.
 */
function playTakeoff(component) {
  const body = component.aircraftBody;
  const base = component._aircraftBase;
  if (!body || !base) return;

  const DX = 14, LIFT = 6, BACK = 22;   // forward distance · climb height · how far back it starts
  const ROLL_DUR = 6.6;                 // long ground roll — "gathering thrust" before rotation
  const groundY = base.pos.y;
  const centerOffset = _TAKEOFF_CENTER.clone().sub(base.pos); // jet centre = body.position + this

  // Start: parked at the back of the runway, level.
  setAircraftPose(component, 'base', 0);
  body.position.x = base.pos.x - BACK;
  setAircraftPitch(component, 0);
  if (component.runway) {
    component.runway.visible = true;
    setRunwayOpacity(component, 1);
  }

  // Chase cam: always centred on the jet — sits low to show the runway during the
  // roll and rises to the hero framing only as the jet gains altitude (driven by
  // climb height, not elapsed time, so a longer roll never out-runs the camera).
  component.controls.enabled = false;
  _center.copy(body.position).add(centerOffset);
  component.camera.position.copy(_center).add(_lowCam);
  component.cameraTarget.copy(_center);

  const pitch = { v: 0 };
  const fade  = { o: 1 };
  if (component._flyTween) component._flyTween.kill();
  component._flyTween = gsap.timeline({
    onUpdate() {
      _center.copy(body.position).add(centerOffset);
      const climbT = THREE.MathUtils.clamp((body.position.y - groundY) / LIFT, 0, 1);
      _camOff.lerpVectors(_lowCam, _heroCam, climbT);
      component.camera.position.copy(_center).add(_camOff);
      component.cameraTarget.copy(_center);
    },
    onComplete() {
      setAircraftPitch(component, 0);
      if (component.runway) component.runway.visible = false;
      _center.copy(body.position).add(centerOffset);
      component.controls.target.copy(_center);
      component.controls.minDistance = 22;
      component.controls.maxDistance = 90;
      component.controls.enabled = true;
      component.controls.autoRotate = true;
      startCruiseBob(component);
    },
  })
    .to(body.position, { x: base.pos.x - 2, duration: ROLL_DUR, ease: 'power1.in' }, 0)        // roll — accelerate down the runway
    .to(pitch, { v: 0.17, duration: 0.8, ease: 'power2.out',
        onUpdate: () => setAircraftPitch(component, pitch.v) }, ROLL_DUR - 0.5)                 // rotate (nose up) near Vr
    .to(body.position, { x: base.pos.x + DX, y: groundY + LIFT, duration: 3.4, ease: 'power2.out' }, ROLL_DUR) // lift off + climb
    .to(pitch, { v: 0.05, duration: 2.6, ease: 'power1.inOut',
        onUpdate: () => setAircraftPitch(component, pitch.v) }, ROLL_DUR + 1.0)                 // settle to cruise angle
    .to(fade, { o: 0, duration: 2.6, ease: 'power1.inOut',
        onUpdate: () => setRunwayOpacity(component, fade.o) }, ROLL_DUR + 0.4);                 // fade runway as it climbs away
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
  const isFinale = idx === 8;

  // ── Leaving the finale: hide sky/clouds, stop the fly-by ──────────────────────
  // (The destination scene resets fog/lighting itself.)
  if (prevIdx === 8 && !isFinale) {
    if (component.sky)    component.sky.visible = false;
    if (component.clouds) component.clouds.visible = false;
    if (component.runway) component.runway.visible = false;
    component._finaleActive = false;
    component.controls.autoRotate = false;
    if (component._flyTween) { component._flyTween.kill(); component._flyTween = null; }
    setAircraftPitch(component, 0); // undo any takeoff/cruise tilt
  }

  // ── Wheel ownership ───────────────────────────────────────────────────────────
  // Orbit scenes (0 + finale) keep wheel-zoom and block Lenis so the page doesn't
  // scroll under the cursor; every other scene hands the wheel back to the page.
  const isOrbitScene = idx === 0 || isFinale;
  component.controls.enableZoom = isOrbitScene;
  component.toggleAttribute('data-lenis-prevent', isOrbitScene);

  // Sky shader + clouds belong to the two in-sky scenes (0 + finale). Default them
  // off here; the Scene 0 and finale branches below switch them back on.
  if (idx !== 0 && idx !== 8) {
    if (component.sky)    component.sky.visible = false;
    if (component.clouds) component.clouds.visible = false;
  }

  // Auto-rotate is re-enabled per orbit scene below; reset it on every transition
  // so it never carries over into the scripted (non-orbit) scenes.
  component.controls.autoRotate = false;

  // ── Camera ──────────────────────────────────────────────────────────────────
  // Cancel any in-flight camera move (e.g. the ignition pull-back) so the new
  // scene's tween takes over cleanly.
  gsap.killTweensOf(component.camera.position);
  gsap.killTweensOf(component.cameraTarget);

  if (isFinale) {
    // The finale camera is driven by playTakeoff() in the aircraft section below —
    // it pans + climbs with the jet — so just release control here.
    component.controls.enabled = false;
    component.controls.autoRotate = false;
  } else if (idx === 0) {
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
        component.controls.autoRotate = true; // resume the gentle Scene 0 spin
      },
    });
    gsap.to(component.cameraTarget, {
      x: cam.lookAt[0], y: cam.lookAt[1], z: cam.lookAt[2],
      duration: dur, ease: 'power3.inOut',
    });
  } else {
    // Scenes 1–7 — scripted camera, OrbitControls off.
    // cameraTarget is the THREE.Vector3 that animate() feeds into camera.lookAt().
    gsap.to(component.camera.position, {
      x: cam.position[0], y: cam.position[1], z: cam.position[2],
      duration: dur, ease: 'power3.inOut',
    });
    gsap.to(component.cameraTarget, {
      x: cam.lookAt[0], y: cam.lookAt[1], z: cam.lookAt[2],
      duration: dur, ease: 'power3.inOut',
    });
    component.controls.enabled = false;
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
      // Scene 0 shares the finale's in-sky look: Sky shader + drifting clouds,
      // background cleared so the shader shows, fog pushed far off the aircraft.
      component.threeScene.background = null;
      component.threeScene.fog.color.set(0xBFD8EC);
      component.threeScene.fog.near = 220;
      component.threeScene.fog.far  = 1400;
      if (component._ambientLight) component._ambientLight.intensity = 1.1;
      if (component._keyLight)     component._keyLight.intensity     = 2.0;
      if (component.sky) component.sky.visible = true;
      if (component.clouds) {
        component.clouds.visible = true;
        component.clouds.children.forEach(s => { s.material.opacity = 0; }); // fade in
      }

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

    } else if (idx === 8) {
      // Finale — the aircraft takes off from the runway and climbs into the sky.
      component.engine.visible = false;
      component.aircraftBody.visible = true;
      component.aircraftBody.traverse(child => {
        if (child.material) child.material.opacity = 1.0;
      });

      // Sky + clouds take over. Fog is pushed far out so it doesn't touch the
      // aircraft; the Sky shader and clouds ignore fog, so the sky reads clean.
      component.threeScene.background = null;
      component.threeScene.fog.color.set(0xBFD8EC);
      component.threeScene.fog.near = 220;
      component.threeScene.fog.far  = 1400;
      if (component._ambientLight) component._ambientLight.intensity = 1.1;
      if (component._keyLight)     component._keyLight.intensity     = 2.0;
      if (component.sky) component.sky.visible = true;
      if (component.clouds) {
        component.clouds.visible = true;
        component.clouds.children.forEach(s => { s.material.opacity = 0; });
      }
      component._finaleActive = true;

      // Roll → rotate → lift off → climb → settle into the gentle cruise orbit.
      playTakeoff(component);

    } else if (prevIdx <= 2 || prevIdx === 8) {
      // Entering Scene 3+ from an aircraft/exterior scene or the finale (dot jump)
      // — hide aircraft, go dark.
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
      gsap.killTweensOf(component.combustionGlow.scale);
      gsap.to(component.combustionGlow.material, { opacity: 0, duration: 0.5 });
      gsap.to(component.combustionGlow.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
    }
    if (component.exhaustParticles) {
      gsap.killTweensOf(component.exhaustParticles.material);
      component.exhaustParticles.material.opacity = 0.65; // restore default plume
    }
  }

  // ── Ignite button + hint visibility ───────────────────────────────────────────
  const igniteBtn  = component.shadowRoot.querySelector('[data-ignite]');
  const igniteHint = component.shadowRoot.querySelector('[data-ignite-hint]');
  if (igniteBtn) {
    if (idx === 5 && !component.ignited) {
      igniteBtn.style.display = 'flex';
      igniteBtn.style.pointerEvents = 'auto';
      igniteBtn.classList.add('is-hinting');
      gsap.fromTo(igniteBtn, { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 1.0 });
      if (igniteHint) gsap.delayedCall(1.2, () => {
        // Only reveal if we're still on Combustion and it hasn't been lit yet
        if (component.currentScene === 5 && !component.ignited) igniteHint.style.display = 'block';
      });
    } else {
      igniteBtn.style.pointerEvents = 'none';
      igniteBtn.classList.remove('is-hinting');
      gsap.to(igniteBtn, {
        opacity: 0, duration: 0.2,
        onComplete() { igniteBtn.style.display = 'none'; },
      });
      if (igniteHint) igniteHint.style.display = 'none';
    }
  }

  // ── Scene 0 interaction hint — drag / zoom / hover help for the orbit view ────
  const orbitHint = component.shadowRoot.querySelector('[data-orbit-hint]');
  if (orbitHint) {
    if (idx === 0) {
      orbitHint.style.display = 'block';
      gsap.fromTo(orbitHint, { opacity: 0 }, { opacity: 0.6, duration: 0.6, delay: 0.7 });
    } else {
      gsap.to(orbitHint, {
        opacity: 0, duration: 0.3,
        onComplete() { orbitHint.style.display = 'none'; },
      });
    }
  }

  // ── CTA button — steps the aircraft scenes (0,1,2) and replays from the finale ─
  const exploreBtn = component.shadowRoot.querySelector('[data-explore]');
  if (exploreBtn) {
    const CTA = {
      0: '&#x2192;&nbsp;&nbsp;VIEW ENGINE',
      1: '&#x2193;&nbsp;&nbsp;EXPLORE ENGINE',
      2: '&#x2192;&nbsp;&nbsp;BEGIN WALKTHROUGH',
      8: '&#x21BA;&nbsp;&nbsp;REPLAY',
    };
    if (CTA[idx] !== undefined) {
      exploreBtn.innerHTML = CTA[idx];
      exploreBtn.style.display = 'flex';
      exploreBtn.style.pointerEvents = 'auto';
      gsap.to(exploreBtn, { opacity: 1, duration: 0.6, delay: idx === 8 ? 1.2 : 0.7 });
      if (idx === 0 || idx === 1) setTimeout(() => exploreBtn?.classList.add('is-pulsing'), 1300);
      else exploreBtn.classList.remove('is-pulsing');
    } else {
      exploreBtn.classList.remove('is-pulsing');
      exploreBtn.style.pointerEvents = 'none';
      gsap.to(exploreBtn, {
        opacity: 0, duration: 0.3,
        onComplete() { exploreBtn.style.display = 'none'; },
      });
    }
  }

  // ── Stage nav (Prev/Next) — only during the thrust stages (scenes 3–7) ────────
  const stageNav = component.shadowRoot.querySelector('[data-stage-nav]');
  const nextBtn  = component.shadowRoot.querySelector('[data-stage-next]');
  if (stageNav) {
    const inStages = idx >= 3 && idx <= 7;
    stageNav.style.display = inStages ? 'flex' : 'none';
    if (inStages && nextBtn) {
      nextBtn.innerHTML = idx === 7
        ? 'Watch takeoff&nbsp;&nbsp;&#x203A;'
        : 'Next stage&nbsp;&nbsp;&#x203A;';
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

  // ── Progress ──────────────────────────────────────────────────────────────────
  root.querySelector('[data-progress]').style.width =
    `${((idx + 1) / component.scenes.length) * 100}%`;
}
